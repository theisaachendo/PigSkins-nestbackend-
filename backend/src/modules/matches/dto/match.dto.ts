import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsUUID, Min, Max, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GameType {
  STANDARD = 'standard',
  NASSAU = 'nassau',
  WOLF = 'wolf',
  VEGAS = 'vegas'
}

export enum MatchStatus {
  CREATED = 'created',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PlayerStatus {
  JOINED = 'joined',
  LEFT = 'left',
  REMOVED = 'removed'
}

export class CreateMatchDto {
  @ApiProperty({ example: 'Pebble Beach Golf Links' })
  @IsString()
  course_name: string;

  @ApiProperty({ example: '2025-07-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  time: string;

  @ApiProperty({ example: 4, minimum: 2, maximum: 8 })
  @IsNumber()
  @Min(2)
  @Max(8)
  max_players: number;

  @ApiProperty({ example: 50.00, minimum: 0 })
  @IsNumber()
  @Min(0)
  entry_fee: number;

  @ApiProperty({ enum: GameType, example: GameType.STANDARD })
  @IsEnum(GameType)
  game_type: GameType;

  @ApiProperty({ example: 'https://maps.google.com/...', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: { skins: true, carryover: true }, required: false })
  @IsOptional()
  rules?: Record<string, any>;
}

export class UpdateMatchDto {
  @ApiProperty({ example: 'Pebble Beach Golf Links', required: false })
  @IsOptional()
  @IsString()
  course_name?: string;

  @ApiProperty({ example: '2025-07-20', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: '14:00', required: false })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ example: 4, minimum: 2, maximum: 8, required: false })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(8)
  max_players?: number;

  @ApiProperty({ example: 50.00, minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entry_fee?: number;

  @ApiProperty({ enum: GameType, example: GameType.STANDARD, required: false })
  @IsOptional()
  @IsEnum(GameType)
  game_type?: GameType;

  @ApiProperty({ example: 'https://maps.google.com/...', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: { skins: true, carryover: true }, required: false })
  @IsOptional()
  rules?: Record<string, any>;

  @ApiProperty({ enum: MatchStatus, example: MatchStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}

export class MatchPlayerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar_url?: string;

  @ApiProperty({ required: false })
  handicap?: number;

  @ApiProperty({ enum: PlayerStatus })
  status: PlayerStatus;

  @ApiProperty()
  entry_fee_paid: boolean;

  @ApiProperty()
  joined_at: string;
}

export class JoinByCodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  join_code: string;
}

export class MatchDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  host_id: string;

  @ApiProperty()
  host_name: string;

  @ApiProperty({ required: false })
  course_id?: string;

  @ApiProperty()
  course_name: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  time: string;

  @ApiProperty()
  max_players: number;

  @ApiProperty()
  entry_fee: number;

  @ApiProperty({ enum: GameType })
  game_type: GameType;

  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty()
  join_code: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  rules?: Record<string, any>;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

  @ApiProperty({ type: [MatchPlayerDto] })
  players: MatchPlayerDto[];

  @ApiProperty()
  current_players: number;
}

export class JoinMatchDto {
  @ApiProperty({ example: 'match-uuid' })
  @IsUUID()
  match_id: string;
}

export class LeaveMatchDto {
  @ApiProperty({ example: 'match-uuid' })
  @IsUUID()
  match_id: string;
}

export class MatchListResponseDto {
  @ApiProperty({ type: [MatchDto] })
  matches: MatchDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
} 