import { Column } from 'typeorm';
import 'reflect-metadata';

export class Services {

  @Column()
  facebook: string;

  @Column()
  oneSignal: string;

}
