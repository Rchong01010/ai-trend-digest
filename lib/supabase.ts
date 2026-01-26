import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

function createSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and service key are required')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Lazy singletons
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createSupabaseClient()
  }
  return _supabase
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createSupabaseAdmin()
  }
  return _supabaseAdmin
}

// For backwards compatibility - these will throw at runtime if env vars are missing
// but won't throw at build time since they're using getters
export const supabase = {
  get from() {
    return getSupabase().from.bind(getSupabase())
  },
}

export const supabaseAdmin = {
  get from() {
    return getSupabaseAdmin().from.bind(getSupabaseAdmin())
  },
}

// Types for our database
export type ContentStyle = 'tiktok' | 'youtube' | 'linkedin' | 'twitter' | 'newsletter'

export interface UserPreferences {
  topics: string[]
  subreddits: string[]
  trusted_authors: string[]
  digest_time: string  // HH:MM format
  content_style: ContentStyle
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  topics: ['AI', 'machine learning', 'LLM'],
  subreddits: ['LocalLLaMA', 'MachineLearning', 'artificial'],
  trusted_authors: [],
  digest_time: '07:00',
  content_style: 'tiktok',
}

export interface User {
  id: string
  email: string
  verified: boolean
  subscription_tier: 'free' | 'pro'
  timezone: string
  created_at: string
  preferences: UserPreferences
  onboarding_completed: boolean
  stripe_customer_id?: string
  subscription_ends_at?: string
}

export interface Trend {
  id: string
  title: string
  category: 'models' | 'tools' | 'research' | 'drama' | 'tutorials'
  summary: string
  why_it_matters: string | null
  tiktok_angle: string | null
  script: string | null
  sources: Array<{ url: string; platform: string; title: string }>
  engagement_score: number
  scanned_at: string
  date: string
}

export interface Digest {
  id: string
  user_id: string
  sent_at: string
  trends_included: string[]
  opened: boolean
  opened_at?: string
  clicked_at?: string
}
