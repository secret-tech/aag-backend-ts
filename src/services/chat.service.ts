import { injectable, inject } from 'inversify';
import { User } from '../entities/user';
import { Message } from '../entities/message';
import { ObjectID, getConnection } from 'typeorm';
import { UserNotFound, ConversationNotFound } from '../exceptions/exceptions';

@injectable()
export class ChatService implements ChatServiceInterface {

  async sendMessage(from: User, message: ClientChatMessage): Promise<Message> {
    const receiver = await getConnection().getRepository(User)
      .findOne(this.findAnotherUserId(from.id.toString(), message.conversationId));
    if (!receiver) throw new UserNotFound('Receiver not found');
    if (!await this.conversationExists(message.conversationId)) {
      throw new ConversationNotFound('Conversation ' + message.conversationId + ' not found');
    }
    const messageToStore = new Message(from, receiver, message.conversationId, message.text);
    // TODO: queue push notification
    return getConnection().mongoManager.save(messageToStore);
  }

  /**
   * This method is fucked up
   * 
   * TODO: find some better way to list converasations
   * @param user User
   */
  async listConversations(user: User | string): Promise<ConversationPreview[]> {
    if (typeof user === 'string') {
      user = await getConnection().getRepository(User).findOne(user);
      if (!user) throw new UserNotFound('User ' + user + ' not found');
    }
    const converasations: ConversationPreview[] = [];
    for (const conversation of user.conversations) {
      const friend = await getConnection().getRepository(User).findOne(this.findAnotherUserId(user.id.toString(), conversation));
      const messages = await getConnection().mongoManager.createEntityCursor(Message, { conversation })
        .limit(1)
        .sort({ timestamp: -1 })
        .toArray();
      converasations.push({ user, friend, messages, id: conversation });
    }
    return converasations;
  }

  /**
   * Fetch a new portion of messages
   * 
   * @param conversationId id of conversation
   * @param key timestamp to look messages after
   */
  async fetchMessages(conversationId: string, key?: number): Promise<Message[]> {
    if (key) {
      return getConnection().mongoManager.createEntityCursor(Message, {
        conversation: conversationId,
        timestamp: { $lte: key }
      }).sort({ timestamp: -1 }).limit(50).toArray();
    } else {
      return getConnection().mongoManager.createEntityCursor(Message, {
        conversation: conversationId
      }).sort({ timestamp: -1 }).limit(50).toArray();
    }
  }

  async findOrCreateConversation(userId: string, companion: string): Promise<ConversationPreview> {
    const friend = await getConnection().getRepository(User).findOne(companion);
    const user = await getConnection().getRepository(User).findOne(userId); // reloading user entity
    if (!friend) throw new UserNotFound('User with id ' + companion + ' not found');
    if (!user) throw new UserNotFound('User with id ' + userId + ' not found');
    let convId;
    if (user.id.toString() <= friend.id.toString()) convId = user.id.toString() + ':' + friend.id.toString();
    else convId = friend.id.toString() + ':' + user.id.toString();
    if (!await this.conversationExists(convId)) {
      return this.createConversation(user, friend, convId);
    } else {
      return this.previewConversation(user, friend, convId);
    }
  }

  private async conversationExists(conversationId: string): Promise<boolean> {
    const participants = await getConnection().mongoManager.createEntityCursor(User, {
      conversations: {
        $in: [conversationId]
      }
    }).toArray();
    if (participants.length !== 2) return false;
    return true;
  }

  private async createConversation(user: User, friend: User, conversation: string): Promise<ConversationPreview> {
    friend.conversations.push(conversation);
    user.conversations.push(conversation);
    await getConnection().mongoManager.save([friend, user]);
    return { user, friend, messages: [], id: conversation };
  }

  private async previewConversation(user: User, friend: User, conversationId: string): Promise<ConversationPreview> {
    const messages = await getConnection().mongoManager.createEntityCursor(Message, { conversation: conversationId })
        .limit(10)
        .sort({ timestamp: -1 })
        .toArray();
    return { user, friend, messages, id: conversationId };
  }

  private findAnotherUserId(from: string, conversationId: string): string {
    const convParts = conversationId.split(':');
    return convParts[0] === from ? convParts[1] : convParts[0];
  }

}

const ChatServiceType = Symbol('ChatServiceInterface');
export { ChatServiceType };
