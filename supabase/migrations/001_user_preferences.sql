-- User Preferences Migration
-- Run this in Supabase SQL Editor to add customization support

-- Update the preferences column with a richer default structure
ALTER TABLE users
ALTER COLUMN preferences SET DEFAULT '{
  "topics": ["AI", "machine learning", "LLM"],
  "subreddits": ["LocalLLaMA", "MachineLearning", "artificial"],
  "trusted_authors": [],
  "digest_time": "07:00",
  "content_style": "tiktok"
}'::jsonb;

-- Add onboarding_completed flag to track if user finished onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update existing users to have the new preferences structure
UPDATE users
SET preferences = jsonb_build_object(
  'topics', COALESCE(preferences->'categories', '["AI", "machine learning", "LLM"]'::jsonb),
  'subreddits', '["LocalLLaMA", "MachineLearning", "artificial"]'::jsonb,
  'trusted_authors', '[]'::jsonb,
  'digest_time', '07:00',
  'content_style', 'tiktok'
)
WHERE preferences->>'topics' IS NULL;

-- Create index on preferences for faster queries
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING gin(preferences);
