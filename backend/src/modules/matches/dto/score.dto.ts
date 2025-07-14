import { IsNumber, IsUUID, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordScoreDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 18 })
  @IsNumber()
  @Min(1)
  @Max(18)
  hole_number: number;

  @ApiProperty({ example: 4, minimum: 1 })
  @IsNumber()
  @Min(1)
  score: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 6 })
  @IsNumber()
  @Min(1)
  @Max(6)
  par: number;
}

export class HoleScoreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  hole_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  user_name: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  is_skin_winner: boolean;

  @ApiProperty()
  recorded_at: string;
}

export class HoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  hole_number: number;

  @ApiProperty()
  par: number;

  @ApiProperty({ required: false })
  skin_value?: number;

  @ApiProperty()
  carryover_from_previous: boolean;

  @ApiProperty()
  completed: boolean;

  @ApiProperty({ type: [HoleScoreDto] })
  scores: HoleScoreDto[];
}

export class MatchScoresDto {
  @ApiProperty()
  match_id: string;

  @ApiProperty()
  match_status: string;

  @ApiProperty({ type: [HoleDto] })
  holes: HoleDto[];

  @ApiProperty()
  total_skins: number;

  @ApiProperty()
  completed_holes: number;
} 