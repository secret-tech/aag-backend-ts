import * as chai from 'chai';
import { container } from '../../ioc.container';
import { ChatServiceType } from '../chat.service';
import { User } from '../../entities/user';
import * as faker from 'faker';
import { Services } from '../../entities/services';
import { getConnection } from 'typeorm';
import { Message } from '../../entities/message';
require('../../../test/load.fixtures');

const { expect } = chai;

describe('ChatService', () => {

  const createRandomUser = async(): Promise<User> => {
    const user = new User();
    user.email = faker.internet.email();
    user.firstName = faker.name.firstName();
    user.lastName = faker.name.lastName();
    user.gender = 'female';
    user.role = 'advisor';
    user.birthday = faker.date.past();
    user.picture = 'https://random.org/image.jpg';
    user.bio = faker.lorem.paragraph();
    user.tags = ['random', 'tags'];
    user.featured = Math.random() < 0.2;
    user.pictures = [];
    user.createdAt = new Date();
    user.age = Math.floor(Math.random() * 13) + 21;
    user.services = new Services();
    user.services.facebook = 'undefined';
    user.services.oneSignal = 'undefined';
    user.conversations = [];
    return getConnection().mongoManager.save(user);
  };

  const chatService = container.get<ChatServiceInterface>(ChatServiceType);

  it('Should return empty list of conversations if no conversations created with this user', async() => {
    const user = await createRandomUser();
    const conversations = await chatService.listConversations(user);
    expect(conversations).to.deep.equal([]);
  });

  it('Should create conversation between two existing users', async() => {
    const userOne = await createRandomUser();
    const userTwo = await createRandomUser();
    const conversation = await chatService.findOrCreateConversation(userOne.id.toHexString(), userTwo.id.toString());
    expect(conversation).to.have.property('user');
    expect(conversation).to.have.property('friend');
    expect(conversation).to.have.property('messages');
    expect(conversation).to.have.property('_id');
    expect(conversation.user.conversations[0]).to.be.equal(conversation._id);
    expect(conversation.friend.conversations[0]).to.be.equal(conversation._id);
  });

  it('Should find conversation instead of creating if already exists', async() => {
    const userOne = await createRandomUser();
    const userTwo = await createRandomUser();
    await chatService.findOrCreateConversation(userOne.id.toString(), userTwo.id.toString()); // Create conversation
    const conversation = await chatService.findOrCreateConversation(userTwo.id.toString(), userOne.id.toString());// Find existing
    expect(conversation).to.have.property('user');
    expect(conversation).to.have.property('friend');
    expect(conversation).to.have.property('messages');
    expect(conversation).to.have.property('_id');
    expect(conversation.user.conversations[0]).to.be.equal(conversation._id);
    expect(conversation.friend.conversations[0]).to.be.equal(conversation._id);
  });

  it('Should throw exception if trying to create conversation with not existing users', (done) => {
    createRandomUser().then((user) => {
      chatService.findOrCreateConversation(user.id.toString(), 'unexistingId').catch((err) => {
        if (err) {
          done();
        }
      });
    });
  });

  it('Should list conversation for both users', async() => {
    const userOne = await createRandomUser();
    const userTwo = await createRandomUser();
    await chatService.findOrCreateConversation(userTwo.id.toString(), userOne.id.toString());
    const userOneConv = await chatService.listConversations(userOne.id.toString());
    const userTwoConv = await chatService.listConversations(userTwo.id.toString());

    expect(userOneConv).to.be.an('array');
    expect(userOneConv).to.has.key('0');
    expect(userOneConv[0]).to.have.property('user');
    expect(userOneConv[0]).to.have.property('friend');
    expect(userOneConv[0]).to.have.property('messages');
    expect(userOneConv[0]).to.have.property('_id');
    expect(userOneConv[0].friend.email).to.be.equal(userTwo.email);

    expect(userTwoConv).to.be.an('array');
    expect(userTwoConv).to.has.key('0');
    expect(userTwoConv[0]).to.have.property('user');
    expect(userTwoConv[0]).to.have.property('friend');
    expect(userTwoConv[0]).to.have.property('messages');
    expect(userTwoConv[0]).to.have.property('_id');
    expect(userTwoConv[0].friend.email).to.be.equal(userOne.email);

    expect(userOneConv[0]._id).to.be.equal(userTwoConv[0]._id);
  });

  it('Should add messsages to conversation', async() => {
    const user = await createRandomUser();
    const friend = await createRandomUser();
    const conversation = await chatService.findOrCreateConversation(user.id.toString(), friend.id.toString());
    const message: Message = await chatService.sendMessage(user, {
      text: 'Hello, world!',
      senderId: user.id.toString(),
      conversationId: conversation._id
    });
    expect(message.message).to.be.equal('Hello, world!');
    expect(message.sender.email).to.be.equal(user.email);
    expect(message.receiver.email).to.be.equal(friend.email);
    const conversations = await chatService.listConversations(user.id.toString());
    expect(conversations).to.have.key('0');
    expect(conversations[0]).to.have.property('messages');
    expect(conversations[0].messages).to.have.key('0');
    expect(conversations[0].messages[0]).to.have.property('message');
    expect(conversations[0].messages[0].message).to.be.equal('Hello, world!');
  });

  it('Should throw when trying to send message to not existing conversation', (done) => {
    createRandomUser().then((user) => {
      const wrongMessageData: ClientChatMessage = {
        text: 'Good bye, world!',
        senderId: user.id.toString(),
        conversationId: user.id.toString() + ':' + user.id.toString()
      };
      chatService.sendMessage(user, wrongMessageData).catch((err) => {
        if (err) {
          done();
        }
      });
    });
  });

  it('Should throw when trying to send message to not existing user', (done) => {
    createRandomUser().then((user) => {
      const wrongMessageData: ClientChatMessage = {
        text: 'Good bye, world!',
        senderId: user.id.toString(),
        conversationId: user.id.toString() + ':5c0627735877e60be32fc7b2'
      };
      chatService.sendMessage(user, wrongMessageData).catch((err) => {
        if (err) {
          done();
        }
      });
    });
  });

  it('Should fetch messages from conversation', async() => {
    const user = await createRandomUser();
    const friend = await createRandomUser();
    const conversation = await chatService.findOrCreateConversation(user.id.toString(), friend.id.toString());
    for (let i = 0; i < 60; i++) {
      const sender = i % 2 === 0 ? user : friend;
      await chatService.sendMessage(sender, {
        text: faker.lorem.paragraph(),
        senderId: sender.id.toString(),
        conversationId: conversation._id
      });
    }
    const messages = await chatService.fetchMessages(conversation._id);
    expect(messages.length).to.be.equal(50);
    const firstMessage = messages[messages.length - 1];
    const newMessages = await chatService.fetchMessages(conversation._id, firstMessage.timestamp);
    expect(newMessages.length).to.be.equal(11);
    expect(firstMessage.timestamp).to.be.lessThan(messages[0].timestamp);
  });
});
