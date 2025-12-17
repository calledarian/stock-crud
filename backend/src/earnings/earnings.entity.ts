import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
