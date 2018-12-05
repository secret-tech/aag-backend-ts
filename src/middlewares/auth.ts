/* istanbul ignore file */

import { Response, NextFunction } from 'express';
import { AuthorizedRequest } from '../requests/authorized.request';
import { getConnection } from 'typeorm';
import { VerifiedToken } from '../entities/verified.token';
import { User } from '../entities/user';

export class Auth {
  /**
   * constructor
   */
  constructor(
    private authClient: AuthClientInterface
  ) { }

  async authenticate(req: AuthorizedRequest, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      return Auth.notAuthorized(res);
    }

    const parts = req.headers.authorization.split(' ');

    if (parts[0] !== 'Bearer') {
      return Auth.notAuthorized(res);
    }

    const token = parts[1];

    try {
      const verifyResult = await this.authClient.verifyUserToken(token);
      req.user = await getConnection().getMongoRepository(User).findOne({
        email: verifyResult.login
      });
      if (!req.user) {
        return res.status(401).json({
          message: 'User is not found'
        });
      }
      return next();
    } catch (e) {
      return Auth.notAuthorized(res);
    }
  }

  static notAuthorized(res: Response) {
    return res.status(401).json({
      statusCode: 401,
      error: 'Not Authorized'
    });
  }
}
