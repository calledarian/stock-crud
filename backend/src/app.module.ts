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
      type: 'sqlite',
      database: 'data_enriched.db',
      entities: [Earnings, User], 
      synchronize: true,
    }),
    EarningsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService], // EarningsBootstrapService
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly adminBootstrap: AdminBootstrapService,
  ) { }

  async onModuleInit() {
    await this.adminBootstrap.bootstrap();
  }
}
