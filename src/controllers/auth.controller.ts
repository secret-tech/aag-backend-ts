import 'reflect-metadata';
import { Response, Request } from 'express';
import { controller, httpPost } from 'inversify-express-utils';
import { Logger } from '../logger';
import { inject } from 'inversify';
import { UserServiceType } from '../services/user.service';

@controller(
  '/auth',
  'OnlyAcceptApplicationJson'
)
export class AuthController {
  private logger = Logger.getInstance('AUTH_CONTROLLER');

  constructor(
    @inject(UserServiceType) private userService: UserServiceInterface
  ) { }

  @httpPost(
    '/facebook',
    'OnlyAcceptApplicationJson'
  )
  async facebook(req: Request, res: Response): Promise<void> {
    res.json(await this.userService.loginOrRegisterWithFacebook(req.body.access_token, req.body.playerId));
  }

}
