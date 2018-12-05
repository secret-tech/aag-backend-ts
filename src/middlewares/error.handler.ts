/* istanbul ignore file */

import { Request, Response, NextFunction } from 'express';
import {
  CustomError, UserExists, AuthException, UserUpdateError,
  InvalidRoleException, UserNotFound, ConversationNotFound
} from '../exceptions/exceptions';
import { Logger } from '../logger';

export default function handle(err: Error, req: Request, res: Response, next: NextFunction): void {
  let status;
  const logger = Logger.getInstance('ERROR_HANDLER_MIDDLEWARE');

  switch (err.constructor) {
    case CustomError: {
      status = 500;
      break;
    }
    case UserUpdateError:
    case UserExists: {
      status = 422;
      break;
    }
    case InvalidRoleException: {
      status = 401;
      break;
    }
    case AuthException: {
      status = 400;
      break;
    }
    case ConversationNotFound:
    case UserNotFound: {
      status = 404;
      break;
    }
    default: {
      status = 500;
      logger.error(err.message);
      logger.error(err.stack);
      break;
    }
  }

  res.status(status).send({
    statusCode: status,
    error: err.message
  });
}
