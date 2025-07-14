# 🏌️ PigSkins Backend

A high-performance backend for a golf skins betting application built with NestJS, featuring real-time match updates, secure payment processing, and comprehensive wallet management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)
- Twilio account (for SMS)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pigskins-backend.git
cd pigskins-backend

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure your environment variables
# See env.example for all required variables

# Start development server
npm run start:dev
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: NestJS (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **Payments**: Stripe
- **Real-time**: Supabase Realtime + Socket.io
- **Email**: Resend
- **SMS**: Twilio
- **File Storage**: Supabase Storage

### Cost-Effective Design
- **Monthly Cost**: ~$45 (vs $125 with Redis)
- **Database**: Supabase (free → $25/month)
- **Payments**: Stripe (2.9% + 30¢ per transaction)
- **Email**: Resend ($20/month)
- **SMS**: Twilio ($0.0075/SMS)

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/
│   │   └── low-cost.config.ts  # Service configurations
│   ├── modules/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── users/             # User management
│   │   ├── matches/           # Match creation & management
│   │   ├── wallet/            # Wallet & transactions
│   │   ├── payments/          # Payment processing
│   │   ├── courses/           # Golf course management
│   │   ├── notifications/     # User notifications
│   │   └── websocket/         # Real-time features
│   ├── shared/                # Shared utilities & DTOs
│   └── database/              # Database configuration
├── database/
│   └── schema.sql             # Database schema
└── package.json
```

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Communication
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# App Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
```

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Apply the database schema:

```bash
# Apply the database schema
psql -h your-project.supabase.co -U postgres -d postgres -f database/schema.sql
```

### Option 2: Local PostgreSQL

```bash
# Create database
createdb pigskins

# Apply schema
psql -d pigskins -f database/schema.sql
```

## 🎯 Core Features

### Authentication
- User registration with email verification
- Phone number verification via SMS
- JWT-based authentication
- Password strength validation

### Match Management
- Create and join golf matches
- Real-time score updates
- Multiple game types (Standard, Nassau, Wolf, Vegas)
- Match status tracking

### Wallet System
- Secure wallet management
- Transaction history
- Deposit/withdrawal processing
- Payment verification

### Payment Processing
- Stripe integration for secure payments
- Webhook handling for payment confirmations
- Refund processing
- Fraud protection

### Real-time Features
- Live match updates
- Real-time leaderboards
- Match chat functionality
- User presence tracking

## 📚 API Documentation

Once running, visit `http://localhost:3000/api/docs` for interactive API documentation.

### Key Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/matches` - Create match
- `GET /api/v1/matches` - List matches
- `POST /api/v1/wallet/deposit` - Add funds
- `GET /api/v1/wallet/balance` - Check balance

## 🚀 Deployment

### Production Checklist

- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backups
- [ ] Set up CI/CD pipeline
- [ ] Test payment webhooks
- [ ] Verify real-time features
- [ ] Load test critical endpoints

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help:

1. Check the [API Documentation](http://localhost:3000/api/docs)
2. Review the [Issues](../../issues) page
3. Create a new issue with detailed information

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Resend Documentation](https://resend.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs) 