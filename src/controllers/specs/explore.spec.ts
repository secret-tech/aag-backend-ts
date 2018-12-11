import * as chai from 'chai';
import * as factory from './test.app.factory';
import { cleanUpMetadata } from 'inversify-express-utils';
require('../../../test/load.fixtures');

chai.use(require('chai-http'));
const { expect, request } = chai;

const postRequest = (customApp, url: string) => {
  return request(customApp)
    .post(url)
    .set('Accept', 'application/json');
};

const getRequest = (customApp, url: string) => {
  return request(customApp)
    .get(url)
    .set('Accept', 'application/json');
};

describe('ExplorerController', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('Should explore all', async() => {
    const token = 'verified_token';
    getRequest(factory.testApp(), '/explore').set('Authorization', `Bearer ${ token }`).end((err, res) => {
      expect(res.status).to.equal(200);
    //   expect(res.body).to.have.property('token');
    //   expect(res.body).to.have.property('user');
    });
  });

//   it('Should explore new');

//   it('Should explore featured');

//   it('Should explore online');

});
