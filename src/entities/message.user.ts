import { Column } from 'typeorm';
import 'reflect-metadata';
import { User } from './user';

export class MessageUser {

  @Column()
  _id: string;

  @Column()
  name: string;

  @Column()
  avatar: string;

  static createMessageUser(user: User): MessageUser {
    const msgUser = new MessageUser();
    if (typeof user !== 'undefined') {
      msgUser._id = user.id.toString();
      msgUser.avatar = user.picture;
      msgUser.name = user.firstName;
    }
    return msgUser;
  }

}
