import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsObject } from 'class-validator';

export class GolfTeeDto {
  @ApiProperty()
  teeID: string;

  @ApiProperty()
  teeName: string;

  @ApiProperty()
  teeColor: string;

  @ApiProperty({ type: [Number] })
  length1: number;
  length2: number;
  length3: number;
  length4: number;
  length5: number;
  length6: number;
  length7: number;
  length8: number;
  length9: number;
  length10: number;
  length11: number;
  length12: number;
  length13: number;
  length14: number;
  length15: number;
  length16: number;
  length17: number;
  length18: number;

  @ApiProperty()
  courseRatingMen: number;

  @ApiProperty()
  slopeMen: number;

  @ApiProperty()
  courseRatingWomen: string;

  @ApiProperty()
  slopeWomen: string;
}

export class GolfCourseDto {
  @ApiProperty()
  courseID: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty()
  clubName: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  latitude: string;

  @ApiProperty()
  longitude: string;

  @ApiProperty()
  numHoles: string;

  @ApiProperty({ type: [Number] })
  parsMen: number[];

  @ApiProperty({ type: [Number] })
  indexesMen: number[];

  @ApiProperty({ type: [Number] })
  parsWomen: number[];

  @ApiProperty({ type: [Number] })
  indexesWomen: number[];

  @ApiProperty()
  numTees: number;

  @ApiProperty({ type: [GolfTeeDto] })
  tees: GolfTeeDto[];
}

export class GolfClubDto {
  @ApiProperty()
  clubID: string;

  @ApiProperty()
  clubName: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  latitude: string;

  @ApiProperty()
  longitude: string;

  @ApiProperty()
  website: string;

  @ApiProperty()
  telephone: string;

  @ApiProperty({ type: [Object] })
  courses: any[];
}

export class CreateMatchWithCourseDto {
  @ApiProperty({ example: '012141520658891108829' })
  @IsString()
  courseID: string;

  @ApiProperty({ example: '106673' })
  @IsString()
  teeID: string;

  @ApiProperty({ example: '2025-07-20' })
  @IsString()
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

  @ApiProperty({ enum: ['standard', 'nassau', 'wolf', 'vegas'] })
  @IsEnum(['standard', 'nassau', 'wolf', 'vegas'])
  game_type: string;

  @ApiProperty({ example: 'https://maps.google.com/...', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: { skins: true, carryover: true }, required: false })
  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;
} 