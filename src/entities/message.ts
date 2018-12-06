import { Column, Entity, ObjectIdColumn, ObjectID } from 'typeorm';
import { User } from './user';
import { MessageUser } from './message.user';

@Entity()
export class Message {

  @ObjectIdColumn()
  _d: ObjectID;

  @Column()
  conversation: string;

  @Column()
  timestamp: number;

  @Column()
  text: string;

  @Column()
  user: MessageUser;

  @Column()
  receiver: MessageUser;

  @Column()
  createdAt: Date;

  constructor(sender: User, receiver: User, conversation: string, message: string) {
    this.timestamp = Date.now();
    this.createdAt = new Date();
    console.log('Sender: ', sender);
    console.log('conversation: ', conversation);
    this.user = new MessageUser(sender.id.toString(), sender.firstName, sender.picture);
    this.receiver = new MessageUser(receiver.id.toString(), receiver.firstName, receiver.picture);
    this.conversation = conversation;
    this.text = message;
  }

}
