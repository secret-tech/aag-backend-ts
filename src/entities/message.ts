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
  message: string;

  @Column()
  user: MessageUser;

  @Column()
  receiver: MessageUser;

  @Column()
  createdAt: Date;

  constructor(sender: User, receiver: User, conversation: string, message: string) {
    this.timestamp = Date.now();
    this.createdAt = new Date();
    this.user = new MessageUser(sender);
    this.receiver = new MessageUser(receiver);
    this.conversation = conversation;
    this.message = message;
  }

}
