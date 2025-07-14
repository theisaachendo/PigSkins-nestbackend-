# Pigskins Backend - Golf Skins Betting App

A comprehensive backend for a golf skins betting application built with NestJS, featuring real-time match updates, wallet management, and payment processing.

## 🏗️ Architecture Overview

### Recommended Services Stack

| Service | Purpose | Cost | Why Recommended |
|---------|---------|------|-----------------|
| **Supabase** | Database + Auth + Real-time | Free → $25/month | PostgreSQL with real-time subscriptions |
| **Stripe** | Payment Processing | 2.9% + 30¢ | Best for marketplace payments |
| **Resend** | Email Service | $20/month | Modern, developer-friendly |
| **Twilio** | SMS Verification | $0.0075/SMS | Reliable, good pricing |
| **Redis** | Caching + Queues | $15/month | For Bull queues and caching |

### Alternative Service Options

| Service | Alternative | Cost | Trade-offs |
|---------|-------------|------|------------|
| Supabase | PlanetScale + Auth0 | $29 + $23/month | More complex setup |
| Stripe | PayPal + Square | 2.9% + 30¢ | Less developer-friendly |
| Resend | SendGrid | $15/month | More features, higher cost |
| Twilio | AWS SNS | $0.00645/SMS | Less reliable |

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase)
- Redis (for queues)
- Stripe account
- Resend account
- Twilio account

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Install dependencies
npm install

# Set up your environment variables
# See env.example for all required variables
```

### 3. Database Setup

#### Option A: Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Run the schema migration:

```bash
# Apply the database schema
psql -h your-project.supabase.co -U postgres -d postgres -f database/schema.sql
```

#### Option B: Local PostgreSQL

```bash
# Create database
createdb pigskins

# Apply schema
psql -d pigskins -f database/schema.sql
```

### 4. Start Development

```bash
# Start in development mode
npm run start:dev

# API will be available at http://localhost:3000
# Documentation at http://localhost:3000/api/docs
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/
│   │   └── services.config.ts  # External service configurations
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

## 🔧 Service Integration Guide

### Supabase Integration

**Why Supabase for this app:**
- Real-time subscriptions for live match updates
- Built-in authentication with JWT
- Row-level security for wallet data
- PostgreSQL with advanced features
- Edge functions for payment webhooks

**Setup:**
```typescript
// In your service
@Inject('SUPABASE_CLIENT')
private supabase: SupabaseClient;

// Real-time subscriptions
const subscription = this.supabase
  .channel('match-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'holes' },
    (payload) => {
      // Handle real-time updates
    }
  )
  .subscribe();
```

### Stripe Integration

**Why Stripe for payments:**
- Connect for marketplace payments (perfect for skins payouts)
- Webhooks for payment confirmations
- Built-in fraud protection
- Multiple payment methods

**Setup:**
```typescript
// Payment processing
@Inject('STRIPE_CLIENT')
private stripe: Stripe;

async processPayment(amount: number, userId: string) {
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    metadata: { userId },
  });
  return paymentIntent;
}
```

### Real-time Features

**Hybrid Approach:**
- **Supabase Realtime** for database changes (scores, wallet updates)
- **Socket.io** for custom events (match chat, notifications)

```typescript
// WebSocket events
@WebSocketGateway()
export class MatchGateway {
  @SubscribeMessage('joinMatch')
  handleJoinMatch(client: Socket, matchId: string) {
    client.join(`match-${matchId}`);
  }

  @SubscribeMessage('updateScore')
  handleScoreUpdate(client: Socket, data: ScoreUpdateDto) {
    // Update database via Supabase
    // Broadcast to all match participants
    this.server.to(`match-${data.matchId}`).emit('scoreUpdated', data);
  }
}
```

## 💰 Cost Analysis

### Monthly Costs (Estimated)

| Service | Plan | Cost | Usage |
|---------|------|------|-------|
| Supabase | Pro | $25 | 8GB database, real-time |
| Stripe | Pay-per-use | ~$50 | 2.9% + 30¢ per transaction |
| Resend | Starter | $20 | 50k emails/month |
| Twilio | Pay-per-use | ~$15 | SMS verification |
| Redis | Basic | $15 | Caching & queues |
| **Total** | | **~$125** | |

### Cost Optimization Tips

1. **Start with free tiers** and upgrade as needed
2. **Use Supabase's free tier** for development
3. **Implement caching** to reduce database calls
4. **Batch notifications** to reduce email/SMS costs
5. **Monitor usage** with service dashboards

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- Email/phone verification

### Payment Security
- Stripe's PCI compliance
- Webhook signature verification
- Transaction audit trails
- Fraud detection

### Data Protection
- Row-level security (RLS) in Supabase
- Input validation with class-validator
- SQL injection prevention
- CORS configuration

## 🚀 Deployment

### Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Communication
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Infrastructure
REDIS_URL=redis://...
NODE_ENV=production
PORT=3000
```

### Production Checklist

- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backups
- [ ] Set up CI/CD pipeline
- [ ] Test payment webhooks
- [ ] Verify real-time features
- [ ] Load test critical endpoints

## 📚 API Documentation

Once running, visit `http://localhost:3000/api/docs` for interactive API documentation.

### Key Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/matches` - Create match
- `GET /api/v1/matches` - List matches
- `POST /api/v1/wallet/deposit` - Add funds
- `GET /api/v1/wallet/balance` - Check balance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 