/* istanbul ignore file */

import { Container } from 'inversify';
import { AuthClientType, AuthClient } from './services/auth.client';
import { Auth } from './middlewares/auth';
import config from './config';
import * as express from 'express';
import * as validation from './middlewares/request.validation';
import './controllers/auth.controller';
import './controllers/user.controller';
import './controllers/explorer.controller';
import { FacebookService, FacebookServiceType } from './services/facebook.service';
import { UserServiceType, UserService } from './services/user.service';
import { ChatServiceType, ChatService } from './services/chat.service';
import { NotificationServiceInterface, NotificationServiceType, NotificationService } from './services/notification.service';

let container = new Container();

// services
container.bind<FacebookServiceInterface>(FacebookServiceType).toConstantValue(new FacebookService());
container.bind<AuthClientInterface>(AuthClientType).toConstantValue(new AuthClient(config.auth.baseUrl));
container.bind<NotificationServiceInterface>(NotificationServiceType).toConstantValue(new NotificationService());
container.bind<UserServiceInterface>(UserServiceType).to(UserService).inSingletonScope();
container.bind<ChatServiceInterface>(ChatServiceType).to(ChatService).inSingletonScope();

const auth = new Auth(container.get<AuthClientInterface>(AuthClientType));
// middlewares
container.bind<express.RequestHandler>('AuthMiddleware').toConstantValue(
  (req: any, res: any, next: any) => auth.authenticate(req, res, next)
);
container.bind<express.RequestHandler>('OnlyAcceptApplicationJson').toConstantValue(
  (req: any, res: any, next: any) => validation.onlyAcceptApplicationJson(req, res, next)
);

export { container };
