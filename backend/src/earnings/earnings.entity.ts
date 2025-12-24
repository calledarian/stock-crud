import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity()
export class Earnings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stockName: string;

  @Column({ type: 'date' })
  earningsDate: string;

  @Column('float')
  closePrice: number;

  @ManyToOne(() => User, user => user.earnings, {
    nullable: true,
  })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
