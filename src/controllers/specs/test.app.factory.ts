/* istanbul ignore file */

import * as express from 'express';
import { Response, Request, NextFunction } from 'express';
import { AuthClient, AuthClientType } from '../../services/auth.client';
import * as TypeMoq from 'typemoq';
import { container } from '../../ioc.container';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as bodyParser from 'body-parser';
import { Auth } from '../../middlewares/auth';
import handle from '../../middlewares/error.handler';
import { FacebookService, FacebookServiceType } from '../../services/facebook.service';
import { UserService, UserServiceType } from '../../services/user.service';

export const mockAuthMiddleware = () => {
  const authMock = TypeMoq.Mock.ofType(AuthClient);

  const verifyTokenResult = {
    login: 'activated@test.com'
  };

  const verifyTokenResultShuftipro = {
    login: 'activated_shuftipro@test.com'
  };

  const verifyTokenResult2fa = {
    login: '2fa@test.com'
  };

  const verifyTokenResultKycVerified = {
    login: 'kyc.verified@test.com'
  };

  const verifyTokenResultKycVerifiedShuftipro = {
    login: 'kyc.verified_shuftipro@test.com'
  };

  const verifyTokenResultKycFailed3 = {
    login: 'kyc.failed3@test.com'
  };

  const verifyTokenResultKycFailed3Shuftipro = {
    login: 'kyc.failed3_shuftipro@test.com'
  };

  const loginResult = {
    accessToken: 'new_token'
  };

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('verified_token')))
    .returns(async(): Promise<any> => verifyTokenResult);

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('verified_token_shuftipro')))
    .returns(async(): Promise<any> => verifyTokenResultShuftipro);

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('verified_token_2fa_user')))
    .returns(async(): Promise<any> => verifyTokenResult2fa);

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('kyc_verified_token')))
    .returns(async(): Promise<any> => verifyTokenResultKycVerified);

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('kyc_verified_token_shuftipro')))
    .returns(async(): Promise<any> => verifyTokenResultKycVerifiedShuftipro);

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('kyc_3_failed_token')))
    .returns(async(): Promise<any> => verifyTokenResultKycFailed3);

  authMock.setup(x => x.verifyUserToken(TypeMoq.It.isValue('kyc_3_failed_token_shuftipro')))
    .returns(async(): Promise<any> => verifyTokenResultKycFailed3Shuftipro);

  authMock.setup(x => x.createUser(TypeMoq.It.isAny()))
    .returns(async(): Promise<any> => {
      return {};
    });

  authMock.setup(x => x.loginUser(TypeMoq.It.isAny()))
    .returns(async(): Promise<any> => loginResult);

  container.rebind<AuthClientInterface>(AuthClientType).toConstantValue(authMock.object);

  const auth = new Auth(container.get<AuthClientInterface>(AuthClientType));
  container.rebind<express.RequestHandler>('AuthMiddleware').toConstantValue(
    (req: any, res: any, next: any) => auth.authenticate(req, res, next)
  );
};

export const mockFacebookService = () => {

  const facebookMock = TypeMoq.Mock.ofType(FacebookService);

  const facebookAuthSuccessResult = {
    id: '1868677989835292',
    first_name: 'Andrey',
    last_name: 'Degtyaruk',
    email: 'hlogeon1@gmail.com',
    picture: {
      data: {
        height: 453,
        is_silhouette: false,
        url: 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1868677989835292&height=500&ext=1546005307&hash=AeT9A_SCqpzbxxQK',
        width: 604
      }
    },
    gender: 'male',
    birthday: '02/19/1993'
  };

  const facebookAuthErrResult = {
    error: {
      message: 'Malformed access token EAAGtP3OOrS4BAKz4z6ZCq204miQUcFdxzAGZAuDN4BZCqea5l4Ai5FiKZCkdh3UJVoWjSijZCCWZC41gnxamnSCMGPcHMj7GakgXFJTvI1oOEZCBhUBtENWDZB9r54BOppkMznuCuRVSvFV1ACyHtuXm6N0TvRlm2aKYljbyxkNVvv8f7uHRsJDSUMAoCoouAx7TJE14dyvZAgZDZD',
      type: 'OAuthException',
      code: 190,
      fbtrace_id: 'GD/YfkOJ8/1'
    }
  };

  facebookMock.setup(x => x.getUserByToken(TypeMoq.It.isValue('valid_facebook_token')))
    .returns(async(): Promise<any> => facebookAuthSuccessResult);

  facebookMock.setup(x => x.getUserByToken(TypeMoq.It.isValue('invalid_facebook_token')))
    .returns(async(): Promise<any> => facebookAuthErrResult);

  container.rebind<FacebookServiceInterface>(FacebookServiceType).toConstantValue(facebookMock.object);

};

export const buildApp = () => {
  const newApp = express();
  newApp.use(bodyParser.json());
  newApp.use(bodyParser.urlencoded({ extended: false }));

  const server = new InversifyExpressServer(container, null, null, newApp);
  server.setErrorConfig((app) => {
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.status(404).send({
        statusCode: 404,
        error: 'Route is not found'
      });
    });

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => handle(err, req, res, next));
  });

  return server.build();
};

export const testApp = () => {
  const initiateResult: InitiateResult = {
    status: 200,
    verificationId: '123',
    attempts: 0,
    expiredOn: 124545,
    method: 'email'
  };

  const validationResult: ValidationResult = {
    status: 200,
    data: {
      verificationId: '123',
      consumer: 'test@test.com',
      expiredOn: 123456,
      attempts: 0
    }
  };

  const registrationResult: UserRegistrationResult = {
    id: 'id',
    email: 'test@test.com',
    login: 'test@test.com',
    tenant: 'tenant',
    sub: 'sub'
  };

  const loginResult: AccessTokenResponse = {
    accessToken: 'token'
  };

  const verifyTokenResult = {
    login: 'activated@test.com'
  };

  mockAuthMiddleware();
  mockFacebookService();
  container.rebind<UserServiceInterface>(UserServiceType).toConstantValue(
    new UserService(
      container.get<FacebookServiceInterface>(FacebookServiceType),
      container.get<AuthClientInterface>(AuthClientType)
    )
  );
  return buildApp();
};
