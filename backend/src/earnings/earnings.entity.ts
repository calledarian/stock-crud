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

  @Column('float', { nullable: true })
  closePrior45d: number;

  @Column({ type: 'date', nullable: true })
  datePrior45d: string;

  @Column('float', { nullable: true })
  closePrior30d: number;

  @Column({ type: 'date', nullable: true })
  datePrior30d: string;

  @Column('float', { nullable: true })
  closePrior14d: number;

  @Column({ type: 'date', nullable: true })
  datePrior14d: string;

  @Column('float', { nullable: true })
  closePrior1d: number;

  @Column({ type: 'date', nullable: true })
  datePrior1d: string;
 
  @ManyToOne(() => User, user => user.earnings, {
    nullable: true,
  })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
