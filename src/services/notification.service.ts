import { User } from '../entities/user';
import * as Bull from 'bull';
import config from '../config';
import { injectable } from 'inversify';
import { Client, Notification } from 'onesignal-node';
import { Message } from '../entities/message';

export const MESSAGE_NOTIFICATIONS = 'message-notifications';
export const RATING_NOTIFICATIONS = 'rating-notifications';
export const CALL_NOTIFICATIONS = 'call-notifications';

export interface NotificationServiceInterface {

  sendMessageNotifcation(message: Message);
  sendCallNotification(receiver: User, caller: User, conversationId: string);
  scheduleRatingNotification(oneSignal: string, userToRate: User);
}

@injectable()
export class NotificationService implements NotificationServiceInterface {

  messageNotificationQueue: Bull;
  ratingNotificationQueue: Bull;
  callNotificationQueue: Bull;
  oneSignalClient: Client;

  constructor() {
    this.messageNotificationQueue = new Bull(MESSAGE_NOTIFICATIONS, config.redis.url);
    this.ratingNotificationQueue = new Bull(RATING_NOTIFICATIONS, config.redis.url);
    this.callNotificationQueue = new Bull(CALL_NOTIFICATIONS, config.redis.url);
    this.oneSignalClient = new Client({
      userAuthKey: config.oneSignal.userKey,
      app: {
        appAuthKey: config.oneSignal.apiKey,
        appId: config.oneSignal.appId
      }
    });
  }

  async sendMessageNotifcation(message: Message) {
    if (typeof message.receiver.services.oneSignal !== 'string') return false;
    const notificationData = {
      headings: {
        en: message.user.firstName
      },
      contents: {
        en: message.message
      },
      data: {
        review: false,
        userId: message.user.id.toString(),
        userPicture: message.user.picture,
        userName: message.user.firstName
      },
      url: 'askagirl://app/chat/conversation/' + message.conversation,
      include_player_ids: [message.receiver.services.oneSignal]
    };
    await this.messageNotificationQueue.add(notificationData);
    return notificationData;
  }

  async processMessageNotifications(data) {
    return this.oneSignalClient.sendNotification(new Notification(data));
  }

  async sendCallNotification(receiver: User, caller: User, conversationId: string) {
    if (typeof receiver.services.oneSignal !== 'string') return false;
    const notificationData = {
      headings: {
        en: caller.firstName + ' tried to call you'
      },
      contents: {
        en: 'You\'ve missed a call from ' + caller.firstName
      },
      data: {
        review: false,
        userId: caller.id.toString(),
        userPicture: caller.picture,
        userName: caller.firstName
      },
      url: 'askagirl://app/chat/conversation/' + conversationId,
      include_player_ids: [receiver.services.oneSignal]
    };
    await this.messageNotificationQueue.add(notificationData);
    return notificationData;
  }

  async processCallNotifications(data) {
    return this.oneSignalClient.sendNotification(new Notification(data));
  }

  async scheduleRatingNotification(oneSignal: string, userToRate: User) {
    const notificationData = {
      headings: {
        en: userToRate.firstName + ' is waiting for your feedback'
      },
      contents: {
        en: 'Please rate your conversation with ' + userToRate.firstName
      },
      data: {
        review: true,
        userId: userToRate.id.toString(),
        userPicture: userToRate.picture,
        userName: userToRate.firstName
      },
      include_player_ids: [oneSignal]
    };
    await this.ratingNotificationQueue.add(notificationData, { delay: 300000 });
    return notificationData;
  }

  async processRatingNotifications(data) {
    return this.oneSignalClient.sendNotification(new Notification(data));
  }

}

const NotificationServiceType = Symbol('NotificationServiceInterface');
export { NotificationServiceType };
