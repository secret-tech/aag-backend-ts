import config from '../config';
import { Response, Request } from 'express';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import { AuthorizedRequest } from '../requests/authorized.request';
import { Logger } from '../logger';
import { CustomError, AuthException } from '../exceptions/exceptions';
import { UserServiceType } from '../services/user.service';
import { inject } from 'inversify';
import { User } from '../entities/user';

@controller(
  '/user',
  'OnlyAcceptApplicationJson',
  'AuthMiddleware'
)
export class UserController {

  private logger = Logger.getInstance('USER_CONTROLLER');

  constructor(
    @inject(UserServiceType) private userService: UserServiceInterface
  ) { }

  /**
   * Show user profile by token provided
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('/me')
  async me(req: AuthorizedRequest, res: Response): Promise<void> {
    res.json(req.user);
  }

  /**
   * Create 100  fake advisors
   *
   * istanbul ignore
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('/fake')
  async fakeUsers(req: AuthorizedRequest, res: Response): Promise<void> {
    this.userService.addFakes();
    res.json({ status: 'ok' });
  }

  /**
   * Show user public profile by user id
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('/:id')
  async show(req: AuthorizedRequest, res: Response): Promise<void> {
    return this.userService.findUserById(req.params.id);
  }

  /**
   * Rate user
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpPost('/rate')
  async rate(req: AuthorizedRequest, res: Response): Promise<void> {
    const target = await this.userService.findUserById(req.body.id);
    res.json({
      success: await this.userService.rate(req.user, target, req.body.rating)
    });
  }

  /**
   * Edit bio
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpPost('/bio')
  async bio(req: AuthorizedRequest, res: Response): Promise<void> {
    res.json({
      user: await this.userService.updateUser(req.user, { bio: req.body.bio })
    });
  }

  /**
   * Edit tags
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpPost('/tags')
  async tags(req: AuthorizedRequest, res: Response): Promise<void> {
    res.json({
      user: await this.userService.updateUser(req.user, { tags: req.body.tags })
    });
  }

  /**
   * Apply profile for review to become advisor on the platform
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpPost('/apply')
  async applyForAdvisor(req: AuthorizedRequest, res: Response): Promise<void> {
    // TODO: implement advisor requests
  }

  /**
   * Assign advisor role to users
   *
   * @TODO: ONLY ADMIN ACCESS
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpPost('/makeAdvisor')
  async makeAdvisor(req: AuthorizedRequest, res: Response): Promise<void> {
    if (req.user.role !== User.ROLE_ADMIN) throw new AuthException('Unauthorized');
    res.json({
      user: await this.userService.makeAdvisor(req.body.userId)
    });
  }

}
