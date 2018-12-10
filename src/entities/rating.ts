import { Column, Entity, ObjectIdColumn, ObjectID } from 'typeorm';
import { User } from './user';

@Entity()
export class Rating {

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  value: number;

  constructor(from: User, to: User, value: number) {
    this.from = from.id.toString();
    this.to = to.id.toString();
    this.value = value;
  }

}