import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export class LowCostConfig {
  private static instance: LowCostConfig;
  private configService: ConfigService;

  private constructor(configService: ConfigService) {
    this.configService = configService;
  }

  static getInstance(configService: ConfigService): LowCostConfig {
    if (!LowCostConfig.instance) {
      LowCostConfig.instance = new LowCostConfig(configService);
    }
    return LowCostConfig.instance;
  }

  // Supabase Configuration (Database + Auth + Real-time)
  getSupabaseClient() {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  getSupabaseAdminClient() {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase admin configuration is missing');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Stripe Configuration
  getStripeClient(): Stripe {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('Stripe configuration is missing');
    }

    return new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  // Email Configuration (Resend)
  getEmailConfig() {
    return {
      apiKey: this.configService.get('RESEND_API_KEY'),
      from: this.configService.get('EMAIL_FROM'),
    };
  }

  // SMS Configuration (Twilio)
  getSmsConfig() {
    return {
      accountSid: this.configService.get('TWILIO_ACCOUNT_SID'),
      authToken: this.configService.get('TWILIO_AUTH_TOKEN'),
      phoneNumber: this.configService.get('TWILIO_PHONE_NUMBER'),
    };
  }

  // File Storage Configuration (Supabase Storage)
  getStorageConfig() {
    return {
      bucket: this.configService.get('SUPABASE_STORAGE_BUCKET') || 'pigskins-assets',
      maxFileSize: parseInt(this.configService.get('MAX_FILE_SIZE')) || 5242880,
    };
  }

  // JWT Configuration
  getJwtConfig() {
    return {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
      refreshSecret: this.configService.get('JWT_REFRESH_SECRET'),
      refreshExpiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    };
  }

  // Simple In-Memory Cache (No Redis needed)
  getSimpleCache() {
    return new SimpleCache();
  }
}

// Simple in-memory cache class
class SimpleCache {
  private cache = new Map();
  private timers = new Map();

  set(key: string, value: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, value);
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  get(key: string) {
    return this.cache.get(key);
  }

  delete(key: string) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }
}

// Service providers for dependency injection (No Redis)
export const LOW_COST_SERVICES_PROVIDERS = [
  {
    provide: 'SUPABASE_CLIENT',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getSupabaseClient();
    },
    inject: [ConfigService],
  },
  {
    provide: 'SUPABASE_ADMIN_CLIENT',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getSupabaseAdminClient();
    },
    inject: [ConfigService],
  },
  {
    provide: 'STRIPE_CLIENT',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getStripeClient();
    },
    inject: [ConfigService],
  },
  {
    provide: 'EMAIL_CONFIG',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getEmailConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'SMS_CONFIG',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getSmsConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'STORAGE_CONFIG',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getStorageConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'JWT_CONFIG',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getJwtConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'SIMPLE_CACHE',
    useFactory: (configService: ConfigService) => {
      return LowCostConfig.getInstance(configService).getSimpleCache();
    },
    inject: [ConfigService],
  },
]; 