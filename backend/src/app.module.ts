import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningsModule } from './earnings/earnings.module';
import { Earnings } from './earnings/earnings.entity';
import { User } from './users/users.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data.db', // local file
      entities: [Earnings, User],
      synchronize: true,   // dev only
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EarningsModule,
    UsersModule,
    AuthModule,
  ], controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
