import { injectable } from 'inversify';
import * as request from 'request-promise';

@injectable()
export class FacebookService implements FacebookServiceInterface {

  async getUserByToken(accessToken: string): Promise<any> {
    return request.get({
      uri: 'https://graph.facebook.com/me',
      json: true,
      qs: {
        access_token: accessToken,
        fields: 'id, first_name, last_name, email, picture.height(500), gender, birthday'
      }
    });
  }
}

const FacebookServiceType = Symbol('FacebookServiceInterface');
export { FacebookServiceType };
