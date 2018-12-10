import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

notificationService.messageNotificationQueue.process(async(job) => {
  await notificationService.processMessageNotifications(job.data);
  return true;
});

notificationService.callNotificationQueue.process(async(job) => {
  await notificationService.processCallNotifications(job.data);
  return true;
});

notificationService.ratingNotificationQueue.process(async(job) => {
  await notificationService.processRatingNotifications(job.data);
  return true;
});

notificationService.ratingNotificationQueue.on('completed', job => {
  console.log('Rating job with id ' + job.id + ' has been completed');
});

notificationService.messageNotificationQueue.on('completed', job => {
  console.log('Message job with id ' + job.id + ' has been completed');
});

notificationService.callNotificationQueue.on('completed', job => {
  console.log('Call job with id ' + job.id + ' has been completed');
});
