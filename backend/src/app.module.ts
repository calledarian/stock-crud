import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EarningsModule } from './earnings/earnings.module';
import { Earnings } from './earnings/earnings.entity';
import { User } from './users/users.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminBootstrapService } from './users/admin-bootstrap.service';
import { EarningsBootstrapService } from './earnings/earnings-bootstrap.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // type: 'sqlite',
      url: process.env.DATABASE_URL,  // database: 'data.db',
      entities: [Earnings, User], 
      synchronize: true,
      ssl: {
        rejectUnauthorized: false, // allows self-signed cert
      },
    }),
    EarningsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, EarningsBootstrapService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly adminBootstrap: AdminBootstrapService,
  ) { }

  async onModuleInit() {
    await this.adminBootstrap.bootstrap();
  }
}
