import * as chai from 'chai';
import { User } from '../entities/user';
const { expect } = chai;

describe('User', () => {
  it('should create correct object on user registration when full data set provided', (done) => {
    const data: FacebookUserData = {
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
      picture: { data: { url: 'https://t.me/image.png' } },
      id: '1234567',
      birthday: '02/19/1993',
      oneSignal: '123',
      gender: 'female'
    };
    const user = User.register(data);
    expect(user.firstName).to.be.equal(data.first_name);
    expect(user.lastName).to.be.equal(data.last_name);
    expect(user.email).to.be.equal(data.email);
    expect(user.role).to.be.equal(User.ROLE_USER);
    expect(user.services.facebook).to.be.equal(data.id);
    expect(user.birthday.toDateString()).to.be.equal(new Date(data.birthday).toDateString());
    expect(user.age).to.be.equal(25);
    expect(user.gender).to.be.equal('female');
    done();
  });

  it('should create correct object on user registration when not required fields are missing', (done) => {
    const data: FacebookUserData = {
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
      picture: { data: { url: 'https://t.me/image.png' } },
      oneSignal: '123',
      id: '1234567'
    };
    const user = User.register(data);
    expect(user.firstName).to.be.equal(data.first_name);
    expect(user.lastName).to.be.equal(data.last_name);
    expect(user.email).to.be.equal(data.email);
    expect(user.role).to.be.equal(User.ROLE_USER);
    expect(user.services.facebook).to.be.equal(data.id);
    done();
  });

  it('should throw registration error if invalid data was provided during registration', (done) => {
    const data: FacebookUserData = {
      email: 'test@test',
      first_name: 'Test',
      last_name: 'User',
      picture: { data: { url: 'https://t.me/image.png' } },
      id: '1234567',
      birthday: '02/19/1993',
      oneSignal: '123'
    };
    expect(() => {
      User.register(data);
    }).to.throw('"email" must be a valid email');
    done();
  });

});
