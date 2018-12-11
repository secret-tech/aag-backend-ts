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

  constructor(from: string, to: string, value: number) {
    this.from = from;
    this.to = to;
    this.value = value;
  }

}
