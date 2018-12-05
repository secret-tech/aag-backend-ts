import * as chai from 'chai';
import * as TypeMoq from 'typemoq';
import * as express from 'express';
import { UserService, UserServiceType } from '../user.service';
import { container } from '../../ioc.container';
import { AuthClient, AuthClientType } from '../auth.client';
import { FacebookServiceType, FacebookService } from '../facebook.service';
import { Auth } from '../../middlewares/auth';
import { User } from '../../entities/user';
require('../../../test/load.fixtures');

const { expect } = chai;

const mockAuthMiddleware = () => {
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

const mockFacebookService = () => {

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
    .returns(async(): Promise<any> => {
      throw new Error(facebookAuthErrResult.error.message);
    });

  container.rebind<FacebookServiceInterface>(FacebookServiceType).toConstantValue(facebookMock.object);
};

const mockServices = () => {
  mockAuthMiddleware();
  mockFacebookService();
  container.rebind<UserServiceInterface>(UserServiceType).to(UserService).inSingletonScope();
};

describe('UserService', () => {

  mockServices();
  const userService = container.get<UserServiceInterface>(UserServiceType);

  const data: FacebookUserData = {
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
    birthday: '02/19/1993',
    oneSignal: ''
  };

  it('Should register new user if not exists', (done) => {
    userService.loginOrRegisterWithFacebook('valid_facebook_token', '123').then((response) => {
      expect(response).to.have.property('user');
      expect(response).to.have.property('token');
      expect(response.user.email).to.be.equal(data.email);
      expect(response.user).to.have.property('id');
      done();
    });
  });

  it('Should login user if exists', (done) => {
    userService.loginOrRegisterWithFacebook('valid_facebook_token', '123').then((response) => {
      userService.loginOrRegisterWithFacebook('valid_facebook_token', '123').then((response) => {
        expect(response).to.have.property('user');
        expect(response).to.have.property('token');
        expect(response.user.email).to.be.equal(data.email);
        expect(response.user).to.have.property('id');
        done();
      });
    });
  });

  it('Should throw exception if token is invalid', (done) => {
    userService.loginOrRegisterWithFacebook('invalid_facebook_token', '123').catch((err) => {
      if (err) {
        done();
      }
    });
  });

  it('Should assign advisor role to user when makeAdvisor called', async() => {
    const regisrationResult = await userService.loginOrRegisterWithFacebook('valid_facebook_token', '123');
    await userService.makeAdvisor(regisrationResult.user.id.toString());
  });

  it('Should return users and advisors when explore all', async() => {
    await userService.addFakes(10);
    const result = await userService.exploreAll();
    expect(result).to.have.property('users');
    expect(result.users).to.have.property('online');
    expect(result.users).to.have.property('featured');
    expect(result.users).to.have.property('new');
    expect(result).to.have.property('advisors');
    expect(result.advisors).to.have.property('online');
    expect(result.advisors).to.have.property('featured');
    expect(result.advisors).to.have.property('new');
    expect(result.advisors['new'].length).to.be.equal(10);
  });

  it('Should find user by ID', async() => {
    await userService.addFakes(10);
    const advisor = (await userService.exploreAll())['advisors']['new'][0];
    const foundUser = await userService.findUserById(advisor.id.toString());
    expect(advisor.firstName).to.be.equal(foundUser.firstName);
    expect(advisor.email).to.be.equal(foundUser.email);
    expect(advisor.id.toString()).to.be.equal(foundUser.id.toString());
  });

  it('Should throw if user with invalid role tries to explore', (done) => {
    userService.loginOrRegisterWithFacebook('valid_facebook_token', '123').then((response) => {
      const user = response.user;
      user.role = User.ROLE_ADMIN;
      userService.explore(user).catch((err) => {
        if (err) {
          done();
        }
      });
    });
  });

});
