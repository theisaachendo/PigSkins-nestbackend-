import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 12.5, required: false })
  @IsOptional()
  handicap?: number;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    phone?: string;
    handicap?: number;
    email_verified: boolean;
    phone_verified: boolean;
    created_at: string;
  };
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar_url?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  handicap?: number;

  @ApiProperty()
  email_verified: boolean;

  @ApiProperty()
  phone_verified: boolean;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
} 