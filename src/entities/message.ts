import { Column, Entity, ObjectIdColumn, ObjectID } from 'typeorm';
import { User } from './user';

@Entity()
export class Message {

  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  conversation: string;

  @Column()
  timestamp: number;

  @Column()
  message: string;

  @Column()
  user: User;

  @Column()
  receiver: User;

  @Column(type => Date)
  createdAt: Date;

  constructor(sender: User, receiver: User, conversation: string, message: string) {
    this.timestamp = Date.now();
    this.createdAt = new Date();
    this.user = sender;
    this.receiver = receiver;
    this.conversation = conversation;
    this.message = message;
  }

}
