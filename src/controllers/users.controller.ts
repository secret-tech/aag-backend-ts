import { controller, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { UserServiceType } from '../services/user.service';
import { Logger } from '../logger';
import { AuthorizedRequest } from '../requests/authorized.request';
import { Response } from 'express';

@controller(
  '/users',
  'OnlyAcceptApplicationJson',
  'AuthMiddleware'
)
export class UsersController {

  private logger = Logger.getInstance('USER_CONTROLLER');

  constructor(
    @inject(UserServiceType) private userService: UserServiceInterface
  ) { }

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

}
