import { injectable, inject } from 'inversify';
import { User } from '../entities/user';
import { getConnection, FindManyOptions, Cursor } from 'typeorm';
import { UserExists, AuthException, UserUpdateError, InvalidRoleException } from '../exceptions/exceptions';
import { FacebookServiceType } from './facebook.service';
import { AuthClientType } from './auth.client';
import { validateUser } from '../entities/validators/user.validator';
import * as faker from 'faker';
import { Services } from '../entities/services';

const ObjectId = require('mongodb').ObjectId;

@injectable()
export class UserService implements UserServiceInterface {

  static DUMMY_PASS = 'dummy';

  constructor(
    @inject(FacebookServiceType) private facebookService: FacebookServiceInterface,
    @inject(AuthClientType) private authClient: AuthClientInterface
  ) { }

  private async register(userData: FacebookUserData): Promise<User> {
    const existingUser = await getConnection().getMongoRepository(User).findOne({ email: userData.email });
    if (existingUser) {
      throw new UserExists('User with this email already exists');
    }
    const user = User.register(userData);
    await getConnection().mongoManager.save(user);
    await this.authClient.createUser({
      email: user.email,
      login: user.email,
      password: UserService.DUMMY_PASS,
      sub: user.role,
      scope: {
        facebook: user.services.facebook,
        oneSignal: user.services.oneSignal
      }
    });
    return user;
  }

  async updateUser(user: User, data: Partial<User>): Promise<any> {
    const updatedUser = Object.assign(user, data);
    updatedUser.updatedAt = new Date();
    const validationResult = validateUser(user);
    if (validationResult.error) {
      throw new UserUpdateError(validationResult.error.details[0].message);
    }
    return getConnection().mongoManager.save(updatedUser);
  }

  /**
   * Login user by facebook token or register&login if not
   *
   * @param accessToken
   * @param oneSignalId
   * @returns {Promise<void>}
   */
  async loginOrRegisterWithFacebook(accessToken: string, oneSignalId: string): Promise<LoginWithFacebookResponse> {
    return this.facebookService.getUserByToken(accessToken).then(async(userData) => {
      userData.oneSignal = oneSignalId;
      let existingUser = await getConnection().getMongoRepository(User).findOne({ email: userData.email });
      if (!existingUser) {
        existingUser = await this.register(userData);
      } else {
        await getConnection().mongoManager.save(User.update(existingUser, userData));
      }
      const tokenResponse: AccessTokenResponse = await this.authClient.loginUser({ login: existingUser.email, password: UserService.DUMMY_PASS, deviceId: UserService.DUMMY_PASS });
      return {
        token: tokenResponse.accessToken,
        user: existingUser
      };
    }).catch((err) => {
      throw new AuthException('Facebook ' + err.name);
    });
  }

  /**
   * Find user by mongoId
   *
   * @param userId
   * @returns {Promise<void>}
   */
  async findUserById(userId: string): Promise<User> {
    return getConnection().getMongoRepository(User).findOne(new ObjectId(userId));
  }

  async find(query: Partial<User>, pagination?: Partial<Query>): Promise<User[]> {
    const cursor = getConnection().mongoManager.createEntityCursor(User, query);
    if (pagination && typeof pagination.limit !== 'undefined') {
      cursor.limit(parseInt(pagination.limit, 10));
    } else {
      cursor.limit(10);
    }
    if (pagination && typeof pagination.skip !== 'undefined') {
      const skip = parseInt(pagination.skip, 10);
      if (skip > 30) return [];
      cursor.skip(skip);
    }
    if (pagination && pagination.sort) {
      cursor.sort(pagination.sort);
    }
    return await cursor.toArray() as User[];
  }

  /**
   * Find new users\advisors
   *
   * @param user
   * @param pagination
   * @returns {Promise<User[]>}
   */
  async findNew(user: User, pagination: Partial<Query>): Promise<User[]> {
    if (user.role === User.ROLE_USER) return this.find({ role: User.ROLE_ADVISOR }, { ...pagination, sort: { createdAt: -1 } });
    else if (user.role === User.ROLE_ADVISOR) return this.find({ role: User.ROLE_USER }, { ...pagination, sort: { createdAt: -1 } });
    throw new InvalidRoleException('Invalid role provided');
  }

  /**
   * Find online users\advisors
   *
   * @param user
   * @param pagination
   * @returns {Promise<User[]>}
   */
  async findOnline(user: User, pagination: Partial<Query>): Promise<User[]> {
    if (user.role === User.ROLE_USER) return this.find({ role: User.ROLE_ADVISOR }, pagination);
    else if (user.role === User.ROLE_ADVISOR) return this.find({ role: User.ROLE_USER }, pagination);
    throw new InvalidRoleException('Invalid role provided');
  }

  /**
   * Find featured  users\advisors
   *
   * @param user
   * @param pagination
   * @returns {Promise<User[]>}
   */
  async findFeatured(user: User, pagination: Partial<Query>): Promise<User[]> {
    if (user.role === User.ROLE_USER) return this.find({ role: User.ROLE_ADVISOR, featured: true }, pagination);
    else if (user.role === User.ROLE_ADVISOR) return this.find({ role: User.ROLE_USER, featured: true }, pagination);
    throw new InvalidRoleException('Invalid role provided');
  }

  /**
   * Explore users for user with role provided in param
   *
   * @param role
   * @returns {Promise<{online: User[], featured: User[], new: User[]}>}
   */
  async exploreByRole(role: string): Promise<ExploreResponse> {
    const featured = await this.find({ role, featured: true });
    const online = await this.find({ role: role }); // TODO: implement online
    const newAdvisors = await this.find({ role: role }, { sort: { createdAt: -1 } });

    return { online, featured, 'new': newAdvisors };
  }

  /**
   * Explore both:  users and advisors
   *
   * @returns {Promise<{users: ExploreResponse, advisors: ExploreResponse}>}
   */
  async exploreAll(): Promise<AllRolesExploreResponse> {
    const users = await this.exploreByRole(User.ROLE_USER);
    const advisors = await this.exploreByRole(User.ROLE_ADVISOR);

    return { users, advisors };
  }

  /**
   *
   * it's possible to pass `limit` and `skip` in the query to paginate results in case type
   * is not `main`
   *
   * @returns {Promise<void>}
   */
  async explore(user: User): Promise<ExploreResponse> {
    if (user.role === User.ROLE_USER) {
      return this.exploreByRole(User.ROLE_ADVISOR);
    } else if (user.role === User.ROLE_ADVISOR) {
      return this.exploreByRole(User.ROLE_USER);
    } else {
      throw new InvalidRoleException('Invalid role provided');
    }
  }

  /**
   * Vote for user, return  true if  voting were performed, false in the other case
   * @param source
   * @param target
   * @param rating
   * @returns {Promise<void>}
   */
  async rate(source: User, target: User, rating: number): Promise<boolean> {
    // TODO: implement rating system
    return false;
  }

  async makeAdvisor(userId: string): Promise<User> {
    const user = await this.findUserById(userId);
    user.role = User.ROLE_ADVISOR;
    await this.authClient.createUser({ // overrides user in auth service
      email: user.email,
      login: user.email,
      password: UserService.DUMMY_PASS,
      sub: user.role,
      scope: {
        facebook: user.services.facebook,
        oneSignal: user.services.oneSignal
      }
    });
    return user;
  }

  async addFakes(amount?: number): Promise<void> {
    const pictures = [
      'https://images.pexels.com/photos/875862/pexels-photo-875862.png?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/735552/pexels-photo-735552.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/445109/pexels-photo-445109.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/415276/pexels-photo-415276.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/580631/pexels-photo-580631.png?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/206434/pexels-photo-206434.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      'https://images.pexels.com/photos/185517/pexels-photo-185517.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
    ];
    if (!amount) {
      amount = 100;
    }
    for (let i = 0; i < amount; i++) {
      let tags = [];
      const kw = Math.floor(Math.random() * 10) + 1;
      const avatarIndex = Math.floor(Math.random() * 7);
      for (let j = 0; j < kw; j++) {
        tags.push(faker.lorem.word());
      }
      const advisor = new User();
      advisor.email = faker.internet.email();
      advisor.firstName = faker.name.firstName();
      advisor.lastName = faker.name.lastName();
      advisor.gender = 'female';
      advisor.role = 'advisor';
      advisor.birthday = faker.date.past();
      advisor.picture = pictures[ avatarIndex ];
      advisor.bio = faker.lorem.paragraph();
      advisor.tags = tags;
      advisor.featured = Math.random() < 0.2;
      advisor.pictures = pictures;
      advisor.createdAt = new Date();
      advisor.age = Math.floor(Math.random() * 13) + 21;
      advisor.services = new Services();
      advisor.services.facebook = 'undefined';
      advisor.services.oneSignal = 'undefined';
      advisor.conversations = [];
      await getConnection().mongoManager.save(advisor);
    }

  }

}

const UserServiceType = Symbol('UserServiceInterface');
export { UserServiceType };
