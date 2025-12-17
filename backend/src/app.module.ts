import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningsModule } from './earnings/earnings.module';
import { Earnings } from './earnings/earnings.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data.db', // local file
      entities: [Earnings],
      synchronize: true,   // dev only
    }),
    EarningsModule,
  ],  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
