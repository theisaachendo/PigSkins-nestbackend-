import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export class ServicesConfig {
  private static instance: ServicesConfig;
  private configService: ConfigService;

  private constructor(configService: ConfigService) {
    this.configService = configService;
  }

  static getInstance(configService: ConfigService): ServicesConfig {
    if (!ServicesConfig.instance) {
      ServicesConfig.instance = new ServicesConfig(configService);
    }
    return ServicesConfig.instance;
  }

  // Supabase Configuration
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

  // File Storage Configuration
  getStorageConfig() {
    return {
      bucket: this.configService.get('SUPABASE_STORAGE_BUCKET'),
      maxFileSize: parseInt(this.configService.get('MAX_FILE_SIZE')) || 5242880,
      uploadPath: this.configService.get('UPLOAD_PATH') || './uploads',
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

  // Redis Configuration
  getRedisConfig() {
    return {
      url: this.configService.get('REDIS_URL') || 'redis://localhost:6379',
    };
  }
}

// Service providers for dependency injection
export const SERVICES_PROVIDERS = [
  {
    provide: 'SUPABASE_CLIENT',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getSupabaseClient();
    },
    inject: [ConfigService],
  },
  {
    provide: 'SUPABASE_ADMIN_CLIENT',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getSupabaseAdminClient();
    },
    inject: [ConfigService],
  },
  {
    provide: 'STRIPE_CLIENT',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getStripeClient();
    },
    inject: [ConfigService],
  },
  {
    provide: 'EMAIL_CONFIG',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getEmailConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'SMS_CONFIG',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getSmsConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'STORAGE_CONFIG',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getStorageConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'JWT_CONFIG',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getJwtConfig();
    },
    inject: [ConfigService],
  },
  {
    provide: 'REDIS_CONFIG',
    useFactory: (configService: ConfigService) => {
      return ServicesConfig.getInstance(configService).getRedisConfig();
    },
    inject: [ConfigService],
  },
]; 