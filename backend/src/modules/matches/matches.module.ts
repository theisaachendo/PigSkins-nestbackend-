import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { TestController } from './test.controller';
import { MatchesService } from './matches.service';
import { GolfService } from './golf.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [MatchesController, TestController],
  providers: [MatchesService, GolfService],
  exports: [MatchesService],
})
export class MatchesModule {} 