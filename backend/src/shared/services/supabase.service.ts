import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create service role client for admin operations
    if (supabaseServiceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  // User authentication methods
  async signUp(email: string, password: string, userData: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async getUser(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    return { data, error };
  }

  // Database operations
  async createUser(userData: any) {
    // Use admin client to bypass RLS
    const client = this.supabaseAdmin || this.supabase;
    const { data, error } = await client
      .from('users')
      .insert([userData])
      .select()
      .single();
    return { data, error };
  }

  async getUserById(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  }

  async updateUser(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  }

  async createWallet(userId: string) {
    // Use admin client to bypass RLS
    const client = this.supabaseAdmin || this.supabase;
    const { data, error } = await client
      .from('wallets')
      .insert([{ user_id: userId, balance: 0.00 }])
      .select()
      .single();
    return { data, error };
  }
} 