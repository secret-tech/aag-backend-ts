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

  constructor(id: string, name: string, avatar: string) {
    this._id = id;
    this.name = name;
    this.avatar = avatar;
  }

}
