# AI Trend Digest

A SaaS platform that delivers personalized daily AI news digests to content creators. Automatically scans multiple sources, ranks trends using a weighted algorithm, and generates ready-to-use scripts for TikTok, YouTube, LinkedIn, and newsletters.

**Live Demo:** [ai-trend-digest.vercel.app](https://ai-trend-digest.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)

---

## Features

### Content Aggregation
- **Multi-source scanning**: HackerNews, Reddit (8 subreddits), Bluesky, Twitter/X, and 10+ RSS feeds
- **Weighted ranking algorithm**: Prioritizes content by source tier, author reputation, engagement velocity, and keyword relevance
- **Deduplication**: Jaccard similarity check prevents duplicate trends across 48-hour windows

### AI-Powered Analysis
- Generates 5 curated trends daily with plain-English summaries
- Creates platform-specific scripts (TikTok, YouTube, LinkedIn, Twitter, Newsletter)
- Includes content angles and hooks optimized for each platform

### User Personalization
- Custom topic tracking and subreddit selection
- Trusted author boosting (2x ranking multiplier)
- Configurable delivery time and timezone

### Monetization (Stripe Integration)
- **Free tier**: 3 topics, TikTok style only, fixed delivery time
- **Pro tier ($12/mo)**: Unlimited topics, all content styles, custom delivery
- Full checkout flow with webhook handling for subscription lifecycle

### Email System
- Automated daily digest delivery via Resend
- Open tracking with 1x1 pixel
- Upgrade CTAs for free users
- Secure token-based unsubscribe

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Next.js API Routes, Server Components |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| Payments | Stripe (Checkout, Webhooks) |
| Email | Resend |
| Hosting | Vercel |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Landing Page → Onboarding → Dashboard → Settings            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     API Routes                               │
│  /scan  /send-digests  /stripe/*  /track/*  /preferences    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Core Services                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Scanner  │  │ Ranker   │  │ Claude   │  │ Resend   │    │
│  │          │  │          │  │ Analysis │  │ Email    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Services                               │
│  Supabase │ Stripe │ Anthropic │ Resend │ HN/Reddit/RSS    │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Anthropic API key
- Stripe account (for payments)
- Resend account (for email)

### Installation

```bash
git clone https://github.com/Rchong01010/ai-trend-digest.git
cd ai-trend-digest
npm install
cp .env.example .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_URL=http://localhost:3000
ADMIN_EMAIL=your@email.com
```

### Database Setup

Run in Supabase SQL Editor:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  why_it_matters TEXT,
  tiktok_angle TEXT,
  script TEXT,
  sources JSONB,
  engagement_score INTEGER,
  date DATE,
  scanned_at TIMESTAMP DEFAULT now()
);

CREATE TABLE digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  sent_at TIMESTAMP DEFAULT now(),
  trends_included UUID[],
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP
);

CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
CREATE INDEX idx_trends_date ON trends(date);
```

### Run Development Server

```bash
npm run dev
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | POST | Trigger trend scan |
| `/api/send-digests` | POST | Send emails to all verified users |
| `/api/subscribe` | POST | Register new user |
| `/api/verify` | GET | Verify email token |
| `/api/user/preferences` | GET/POST | Manage user settings |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/track/open` | GET | Track email opens |
| `/api/unsubscribe` | GET | Unsubscribe user |

---

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Cron Jobs

```
0 6 * * * curl -X POST https://your-domain.com/api/scan        # 6am PT
0 7 * * * curl -X POST https://your-domain.com/api/send-digests # 7am PT
```

---

## License

MIT

---

## Author

Reid Chong - [GitHub](https://github.com/Rchong01010)
