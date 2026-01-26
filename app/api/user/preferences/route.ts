import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, UserPreferences } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, preferences, timezone, onboarding_completed } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's current tier for validation
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const tier = user.subscription_tier || 'free'

    // Server-side validation of tier limits
    if (preferences) {
      const prefs = preferences as UserPreferences

      // Validate topics limit for free users
      if (tier === 'free' && prefs.topics && prefs.topics.length > PLANS.free.limits.topics) {
        return NextResponse.json(
          { error: `Free plan limited to ${PLANS.free.limits.topics} topics` },
          { status: 403 }
        )
      }

      // Validate content style for free users
      if (tier === 'free' && prefs.content_style) {
        const allowedStyles = PLANS.free.limits.styles as readonly string[]
        if (!allowedStyles.includes(prefs.content_style)) {
          return NextResponse.json(
            { error: 'Content style not available on free plan' },
            { status: 403 }
          )
        }
      }

      // Validate custom digest time for free users
      if (tier === 'free' && prefs.digest_time && prefs.digest_time !== '07:00') {
        if (!PLANS.free.limits.customDigestTime) {
          return NextResponse.json(
            { error: 'Custom digest time not available on free plan' },
            { status: 403 }
          )
        }
      }
    }

    const updateData: Record<string, unknown> = {}
    if (preferences) updateData.preferences = preferences
    if (timezone) updateData.timezone = timezone
    if (typeof onboarding_completed === 'boolean') {
      updateData.onboarding_completed = onboarding_completed
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Failed to update preferences:', error)
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('preferences, timezone, onboarding_completed, subscription_tier')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
