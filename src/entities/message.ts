import { Column, Entity, ObjectIdColumn, ObjectID } from 'typeorm';
import { User } from './user';

@Entity()
export class Message {

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  conversation: string;

  @Column()
  timestamp: number;

  @Column()
  message: string;

  @Column()
  user?: User;

  @Column()
  receiver?: User;

  @Column()
  system?: boolean;

  constructor(conversation: string, message: string, sender?: User, receiver?: User) {
    this.timestamp = Date.now();
    this.user = sender;
    this.conversation = conversation;
    this.message = message;
    if (receiver) this.receiver = receiver;
    if (sender) this.user = sender;
  }

}
