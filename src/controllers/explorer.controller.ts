import { Response } from 'express';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import { AuthorizedRequest } from '../requests/authorized.request';
import { Logger } from '../logger';
import { UserServiceType } from '../services/user.service';
import { inject } from 'inversify';

@controller(
  '/explore',
  'OnlyAcceptApplicationJson',
  'AuthMiddleware'
)
export class ExplorerController {

  private logger = Logger.getInstance('EXPLORER_CONTROLLER');

  constructor(
    @inject(UserServiceType) private userService: UserServiceInterface
  ) { }

  /**
   *
   * Explore users by categories: featured, online, new
   * Show users for advisors
   * Advisors for users
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('/')
  async explore(req: AuthorizedRequest, res: Response): Promise<void> {
    res.json(await this.userService.explore(req.user));
  }

  /**
   * Get new users/advisors
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('/new')
  async exploreNew(req: AuthorizedRequest, res: Response): Promise<void> {
    let pagination: any = {};
    if (req.query.limit) pagination.limit = req.query.limit;
    if (req.query.skip) pagination.skip = req.query.skip;

    res.json(await this.userService.findNew(req.user, pagination));
  }

  /**
   * Get featured users/advisors
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('/featured')
  async featured(req: AuthorizedRequest, res: Response): Promise<void> {
    let pagination: any = {};
    if (req.query.limit) pagination.limit = req.query.limit;
    if (req.query.skip) pagination.skip = req.query.skip;

    res.json(this.userService.findFeatured(req.user, pagination));
  }

  /**
   * Get online users/advisors
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  @httpGet('online')
  async online(req: AuthorizedRequest, res: Response): Promise<void> {
    let pagination: any = {};
    if (req.query.limit) pagination.limit = req.query.limit;
    if (req.query.skip) pagination.skip = req.query.skip;

    res.json(this.userService.findOnline(req.user, pagination));
  }

}
