import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, UserPreferences, DEFAULT_PREFERENCES, Trend } from '@/lib/supabase'
import { sendDigestEmail } from '@/lib/resend'

export const maxDuration = 300 // Allow up to 5 minutes for sending all emails

interface UserWithPreferences {
  id: string
  email: string
  timezone: string
  preferences: UserPreferences
}

// Check if it's the right time to send a digest to this user
function shouldSendToUser(user: UserWithPreferences, currentHour: number, currentMinute: number): boolean {
  const prefs = user.preferences || DEFAULT_PREFERENCES
  const digestTime = prefs.digest_time || '07:00'

  // Parse user's preferred time
  const [prefHour, prefMinute] = digestTime.split(':').map(Number)

  // For simplicity, we check if current UTC time matches user's preferred time in their timezone
  // In production, you'd use a proper timezone library like luxon or date-fns-tz
  try {
    const now = new Date()
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: user.timezone || 'America/Los_Angeles' }))
    const userHour = userTime.getHours()
    const userMinute = userTime.getMinutes()

    // Allow a 30-minute window around the preferred time
    const prefTotalMinutes = prefHour * 60 + prefMinute
    const userTotalMinutes = userHour * 60 + userMinute

    return Math.abs(prefTotalMinutes - userTotalMinutes) <= 30
  } catch {
    // If timezone parsing fails, default to sending
    return currentHour === prefHour
  }
}

// Filter and prioritize trends based on user's topics
function personalizeTrends(trends: Trend[], preferences: UserPreferences): Trend[] {
  const userTopics = preferences.topics || DEFAULT_PREFERENCES.topics

  // Score each trend based on topic relevance
  const scoredTrends = trends.map(trend => {
    let relevanceBoost = 0
    const titleLower = trend.title.toLowerCase()
    const summaryLower = trend.summary.toLowerCase()

    for (const topic of userTopics) {
      const topicLower = topic.toLowerCase()
      if (titleLower.includes(topicLower) || summaryLower.includes(topicLower)) {
        relevanceBoost += 10
      }
    }

    return {
      ...trend,
      personalizedScore: trend.engagement_score + relevanceBoost,
    }
  })

  // Sort by personalized score and take top 7
  return scoredTrends
    .sort((a, b) => b.personalizedScore - a.personalizedScore)
    .slice(0, 7)
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for automated runs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'

    if (isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if this is a force send (ignore time preferences)
    const { searchParams } = new URL(request.url)
    const forceSend = searchParams.get('force') === 'true'

    console.log('Starting personalized digest send...')
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()

    // Get today's trends
    const today = new Date().toISOString().split('T')[0]
    const { data: allTrends, error: trendsError } = await supabaseAdmin
      .from('trends')
      .select('*')
      .eq('date', today)
      .order('engagement_score', { ascending: false })

    if (trendsError || !allTrends || allTrends.length === 0) {
      console.log('No trends found for today')
      return NextResponse.json({
        message: 'No trends to send',
        sent: 0,
      })
    }

    // Get all verified users with their preferences
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, timezone, preferences')
      .eq('verified', true)

    if (usersError || !users || users.length === 0) {
      console.log('No verified users found')
      return NextResponse.json({
        message: 'No users to send to',
        sent: 0,
      })
    }

    console.log(`Found ${users.length} users, ${allTrends.length} trends`)

    let sent = 0
    let skipped = 0
    let failed = 0

    // Send personalized emails to users
    for (const user of users as UserWithPreferences[]) {
      // Check if it's the right time for this user (unless force sending)
      if (!forceSend && !shouldSendToUser(user, currentHour, currentMinute)) {
        skipped++
        continue
      }

      try {
        const userPrefs = user.preferences || DEFAULT_PREFERENCES

        // Personalize trends for this user
        const personalizedTrends = personalizeTrends(allTrends, userPrefs)

        // Create digest record
        const { data: digest, error: digestError } = await supabaseAdmin
          .from('digests')
          .insert({
            user_id: user.id,
            trends_included: personalizedTrends.map(t => t.id),
          })
          .select('id')
          .single()

        if (digestError || !digest) {
          console.error(`Failed to create digest for ${user.email}:`, digestError)
          failed++
          continue
        }

        // Send the personalized email
        await sendDigestEmail(user.email, personalizedTrends, digest.id)
        sent++

        console.log(`Sent digest to ${user.email} (${personalizedTrends.length} trends)`)

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to send digest to ${user.email}:`, error)
        failed++
      }
    }

    console.log(`Digest send complete. Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`)

    return NextResponse.json({
      message: 'Digest send complete',
      sent,
      skipped,
      failed,
      total: users.length,
    })
  } catch (error) {
    console.error('Send digest error:', error)
    return NextResponse.json(
      { error: 'Send failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}
