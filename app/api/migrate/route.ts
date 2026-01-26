import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Require a secret to run migrations
  const authHeader = request.headers.get('authorization')
  const migrationSecret = process.env.MIGRATION_SECRET || process.env.CRON_SECRET

  if (!migrationSecret || authHeader !== `Bearer ${migrationSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const migrations = [
    // Stripe fields on users table
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP`,
    `CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id)`,
    // Email tracking fields on digests table
    `ALTER TABLE digests ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP`,
    `ALTER TABLE digests ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP`,
  ]

  const results: { sql: string; success: boolean; error?: string }[] = []

  for (const sql of migrations) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

      if (error) {
        // Try direct query if rpc doesn't exist
        const { error: directError } = await supabase.from('_migrations').select('*').limit(0)

        results.push({
          sql: sql.substring(0, 50) + '...',
          success: false,
          error: error.message,
        })
      } else {
        results.push({
          sql: sql.substring(0, 50) + '...',
          success: true,
        })
      }
    } catch (err) {
      results.push({
        sql: sql.substring(0, 50) + '...',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({
    message: 'Migration attempted',
    results,
    note: 'If migrations failed, please run them manually in Supabase SQL Editor',
  })
}
