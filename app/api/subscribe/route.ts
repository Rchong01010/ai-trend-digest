import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, verified')
      .eq('email', normalizedEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Check user error:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingUser?.verified) {
      // User already subscribed - check if they completed onboarding
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, onboarding_completed')
        .eq('id', existingUser.id)
        .single()

      return NextResponse.json({
        message: 'Welcome back!',
        userId: existingUser.id,
        onboarding_completed: userData?.onboarding_completed ?? false,
      })
    }

    let userId: string

    if (existingUser) {
      // User exists but not verified - mark as verified
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ verified: true })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }
      userId = existingUser.id
    } else {
      // Create new user with default preferences
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: normalizedEmail,
          verified: true,
          preferences: {
            topics: ['AI', 'machine learning', 'LLM'],
            subreddits: ['LocalLLaMA', 'MachineLearning', 'artificial'],
            trusted_authors: [],
            digest_time: '07:00',
            content_style: 'tiktok',
          },
          onboarding_completed: false,
        })
        .select('id')
        .single()

      if (insertError || !newUser) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to subscribe: ' + (insertError?.message || 'Unknown error') },
          { status: 500 }
        )
      }
      userId = newUser.id
    }

    return NextResponse.json({
      message: "You're subscribed! Let's personalize your digest.",
      userId,
      onboarding_completed: false,
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
