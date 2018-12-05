// import * as chai from 'chai';
// import * as factory from './test.app.factory';
// import { cleanUpMetadata } from 'inversify-express-utils';
// require('../../../test/load.fixtures');

// chai.use(require('chai-http'));
// const { expect, request } = chai;

// const postRequest = (customApp, url: string) => {
//   return request(customApp)
//     .post(url)
//     .set('Accept', 'application/json');
// };

// const getRequest = (customApp, url: string) => {
//   return request(customApp)
//     .get(url)
//     .set('Accept', 'application/json');
// };

// describe('UserController', () => {
//   beforeEach(() => {
//     cleanUpMetadata();
//   });

// //   it('Should login or register user', (done) => {
// //     postRequest(factory.testApp(), '/auth/facebook').send({ access_token: 'valid_facebook_token', playerId: '123' }).end((err, res) => {
// //       expect(res.status).to.equal(200);
// //       expect(res.body).to.have.property('token');
// //       expect(res.body).to.have.property('user');
// //       done();
// //     });
// //   });

// });
