import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url))
    }

    // Find user with this token
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, verified, token_expires_at')
      .eq('verification_token', token)
      .single()

    if (error || !user) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url))
    }

    // Check if already verified
    if (user.verified) {
      return NextResponse.redirect(new URL('/?verified=already', request.url))
    }

    // Check if token expired
    if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/?error=token_expired', request.url))
    }

    // Mark user as verified
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        verified: true,
        verification_token: null,
        token_expires_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to verify user:', updateError)
      return NextResponse.redirect(new URL('/?error=verification_failed', request.url))
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/?verified=success', request.url))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/?error=verification_failed', request.url))
  }
}
