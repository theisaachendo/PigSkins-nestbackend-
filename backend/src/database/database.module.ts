import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
// import { User } from '../modules/users/entities/user.entity';
// import { Wallet } from '../modules/wallet/entities/wallet.entity';
// import { Transaction } from '../modules/wallet/entities/transaction.entity';
// import { Match } from '../modules/matches/entities/match.entity';
// import { MatchPlayer } from '../modules/matches/entities/match-player.entity';
// import { Hole } from '../modules/matches/entities/hole.entity';
// import { HoleScore } from '../modules/matches/entities/hole-score.entity';
// import { Course } from '../modules/courses/entities/course.entity';
// import { CourseHole } from '../modules/courses/entities/course-hole.entity';
// import { Payment } from '../modules/payments/entities/payment.entity';
// import { Notification } from '../modules/notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          // Add your entities here as you implement them
          // User,
          // Wallet,
          // Transaction,
          // Match,
          // MatchPlayer,
          // Hole,
          // HoleScore,
          // Course,
          // CourseHole,
          // Payment,
          // Notification,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {} 