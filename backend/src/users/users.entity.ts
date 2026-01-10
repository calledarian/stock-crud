import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Earnings } from '../earnings/earnings.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  passwordHash: string;

  @Column({ default: 'worker' })
  role: 'admin' | 'worker';

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Earnings, (earnings) => earnings.user)
  earnings: Earnings[];
}
