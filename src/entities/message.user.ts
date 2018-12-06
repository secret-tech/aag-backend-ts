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

  constructor(user: User) {
    this._id = user.id.toString();
    this.name = user.firstName;
    this.avatar = user.picture;
  }

}
