import 'reflect-metadata';
import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
import { Index } from 'typeorm/decorator/Index';
import { Services } from './services';
import { validateUser } from './validators/user.validator';
import { UserRegistrationError } from '../exceptions/exceptions';

@Entity()
@Index('email', () => ({ email: 1 }), { unique: true })
export class User {

  static ROLE_USER = 'user';
  static ROLE_ADVISOR = 'advisor';
  static ROLE_ADMIN = 'admin';

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  gender: string;

  @Column()
  rating: Number;

  @Column()
  birthday?: Date;

  @Column()
  age?: Number;

  @Column(type => Services)
  services: Services;

  @Column()
  role: string;

  @Column()
  picture: string;

  @Column()
  pictures: string[];

  @Column()
  bio: string;

  @Column()
  tags: string[];

  @Column()
  featured: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt?: Date;

  @Column()
  conversations: string[];

  /**
   * Register user with facebook  data
   *
   * @param userData
   */
  static register(userData: FacebookUserData): User {
    let user = new User();
    user.email = userData.email;
    user.firstName = userData.first_name;
    user.lastName = userData.last_name;
    user.picture = userData.picture.data.url;
    user.services = new Services();
    user.services.facebook = userData.id;
    user.services.oneSignal = userData.oneSignal;
    user.createdAt = new Date();
    user.role = User.ROLE_USER;
    user.conversations = [];

    if (!userData.gender) {
      user.gender = 'male';
    } else {
      user.gender = userData.gender;
    }
    if (userData.birthday) {
      user.birthday = new Date(userData.birthday);
      const ageDifMs = Date.now() - user.birthday.getTime();
      user.age = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
    }
    const validationResult = validateUser(user);
    if (validationResult.error) {
      throw new UserRegistrationError(validationResult.error.details[0].message);
    }
    return user;
  }

  /**
   *
   * @param user
   * @param userData
   * @returns {User}
   */
  static update(user: User, userData: FacebookUserData): User {
    user.picture = userData.picture.data.url;
    user.email = userData.email;
    user.firstName = userData.first_name;
    user.lastName = userData.last_name;
    user.picture = userData.picture.data.url;
    if(userData.oneSignal !== '') {
      user.services.oneSignal = userData.oneSignal;
    }
    return user;
  }

}
