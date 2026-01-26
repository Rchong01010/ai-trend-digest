-- AI Trend Digest Database Schema
-- Run this in your Supabase SQL editor

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  verified boolean default false,
  subscription_tier text default 'free', -- free, pro
  timezone text default 'America/Los_Angeles',
  created_at timestamp with time zone default now(),
  preferences jsonb default '{
    "topics": ["AI", "machine learning", "LLM"],
    "subreddits": ["LocalLLaMA", "MachineLearning", "artificial"],
    "trusted_authors": [],
    "digest_time": "07:00",
    "content_style": "tiktok"
  }',
  onboarding_completed boolean default false,
  verification_token text,
  token_expires_at timestamp with time zone
);

-- Trends table
create table if not exists trends (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  summary text not null,
  why_it_matters text,
  tiktok_angle text,
  script text, -- Full TikTok script (30-45 sec)
  sources jsonb default '[]', -- [{url, platform, title}]
  engagement_score int default 0,
  scanned_at timestamp with time zone default now(),
  date date default current_date
);

-- Digests table (sent emails)
create table if not exists digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  sent_at timestamp with time zone default now(),
  trends_included uuid[] default '{}', -- array of trend IDs
  opened boolean default false
);

-- Indexes for performance
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_verified on users(verified);
create index if not exists idx_trends_date on trends(date);
create index if not exists idx_trends_category on trends(category);
create index if not exists idx_digests_user on digests(user_id);

-- Row Level Security (optional but recommended)
alter table users enable row level security;
alter table trends enable row level security;
alter table digests enable row level security;

-- Public read access to trends
create policy "Trends are publicly readable"
  on trends for select
  to anon
  using (true);

-- Service role can do everything
create policy "Service role has full access to users"
  on users for all
  to service_role
  using (true);

create policy "Service role has full access to trends"
  on trends for all
  to service_role
  using (true);

create policy "Service role has full access to digests"
  on digests for all
  to service_role
  using (true);
