import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
// Core modules
import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
import { MatchesModule } from './modules/matches/matches.module';
// import { WalletModule } from './modules/wallet/wallet.module';
// import { PaymentsModule } from './modules/payments/payments.module';
// import { CoursesModule } from './modules/courses/courses.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { WebsocketModule } from './modules/websocket/websocket.module';

// Shared modules
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules (add back as you implement them)
    AuthModule,
    // UsersModule,
    MatchesModule,
    // WalletModule,
    // PaymentsModule,
    // CoursesModule,
    // NotificationsModule,
    // WebsocketModule,

    // Shared utilities (add back as you implement it)
    SharedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 