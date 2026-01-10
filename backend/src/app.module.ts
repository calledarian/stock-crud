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
      type: 'postgres',
      url: process.env.DATABASE_URL, 
      entities: [Earnings, User],
      synchronize: true, // Set to false in production to prevent data loss
      ssl: {
        rejectUnauthorized: false, // Required for Render self-signed certificates
      },
    }),
    EarningsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, EarningsBootstrapService], // EarningsBootstrapService
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly adminBootstrap: AdminBootstrapService,
  ) { }

  async onModuleInit() {
    await this.adminBootstrap.bootstrap();
  }
}
