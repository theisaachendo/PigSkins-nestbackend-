import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../../shared/services/supabase.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserProfileDto } from '../../shared/dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, phone, handicap } = registerDto;

    // Check if user already exists by email
    const { data: existingUsers, error: checkError } = await this.supabaseService.getClient()
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (existingUsers && existingUsers.length > 0) {
      throw new BadRequestException('User already exists');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabaseService.signUp(
      email,
      password,
      { name, phone, handicap }
    );

    console.log('Supabase signup response:', { authData, authError });

    if (authError) {
      console.error('Supabase signup error:', authError);
      throw new BadRequestException(authError.message || 'Failed to create user');
    }

    if (!authData.user) {
      throw new BadRequestException('Failed to create user');
    }

    // Create user profile in database
    const userData = {
      id: authData.user.id,
      email,
      name,
      phone,
      handicap,
      password_hash: await bcrypt.hash(password, 10),
      email_verified: authData.user.email_confirmed_at ? true : false,
      phone_verified: false,
    };

    const { data: user, error: userError } = await this.supabaseService.createUser(userData);
    console.log('Create user profile response:', { user, userError });
    if (userError) {
      console.error('User profile creation error:', userError);
      const errorMessage = userError.message || userError.details || userError.hint || 'Unknown error';
      throw new BadRequestException(`Failed to create user profile: ${errorMessage}`);
    }

    // Create wallet for user
    await this.supabaseService.createWallet(authData.user.id);

    // Generate JWT token
    const payload = { sub: authData.user.id, email: authData.user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        phone: user.phone,
        handicap: user.handicap,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        created_at: user.created_at,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Sign in with Supabase
    const { data: authData, error: authError } = await this.supabaseService.signIn(email, password);

    if (authError) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!authData.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile from database
    const { data: user, error: userError } = await this.supabaseService.getUserById(authData.user.id);
    if (userError || !user) {
      throw new UnauthorizedException('User profile not found');
    }

    // Generate JWT token
    const payload = { sub: authData.user.id, email: authData.user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        phone: user.phone,
        handicap: user.handicap,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        created_at: user.created_at,
      },
    };
  }

  async logout(token: string): Promise<{ message: string }> {
    const { error } = await this.supabaseService.signOut();
    if (error) {
      throw new BadRequestException('Failed to logout');
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const { data: user, error } = await this.supabaseService.getUserById(userId);
    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      handicap: user.handicap,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async updateProfile(userId: string, updates: Partial<UserProfileDto>): Promise<UserProfileDto> {
    const { data: user, error } = await this.supabaseService.updateUser(userId, updates);
    if (error) {
      throw new BadRequestException('Failed to update profile');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      handicap: user.handicap,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
} 