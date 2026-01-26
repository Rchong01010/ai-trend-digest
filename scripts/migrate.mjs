import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load env vars
const env = fs.readFileSync('.env.local', 'utf8')
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = value.join('=').trim()
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Use postgres connection via supabase-js query method
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
})

const migrations = [
  // Check current columns
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
]

async function runMigrations() {
  console.log('Checking existing columns...\n')

  // Check users table columns
  const { data: userColumns, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(0)

  if (userError) {
    console.log('Users table error:', userError.message)
  }

  // Check digests table columns
  const { data: digestColumns, error: digestError } = await supabase
    .from('digests')
    .select('*')
    .limit(0)

  if (digestError) {
    console.log('Digests table error:', digestError.message)
  }

  // Try to insert a test record with new fields to see if columns exist
  console.log('Testing if new columns exist...\n')

  // Test users table
  const { error: testUserError } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_ends_at')
    .limit(1)

  if (testUserError) {
    console.log('Users columns stripe_customer_id/subscription_ends_at: NOT FOUND')
    console.log('Error:', testUserError.message)
  } else {
    console.log('Users columns stripe_customer_id/subscription_ends_at: EXISTS')
  }

  // Test digests table
  const { error: testDigestError } = await supabase
    .from('digests')
    .select('opened_at, clicked_at')
    .limit(1)

  if (testDigestError) {
    console.log('Digests columns opened_at/clicked_at: NOT FOUND')
    console.log('Error:', testDigestError.message)
  } else {
    console.log('Digests columns opened_at/clicked_at: EXISTS')
  }

  console.log('\n---')
  console.log('If columns are NOT FOUND, please run this SQL in Supabase Dashboard > SQL Editor:\n')
  console.log(`
-- Stripe fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);

-- Email tracking
ALTER TABLE digests ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;
ALTER TABLE digests ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP;
`)
}

runMigrations().catch(console.error)
