import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get date range for last 24 hours to handle timezone differences
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const todayStr = now.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Fetch trends from last 24 hours (today or yesterday), ordered by engagement score
    const { data: trends, error } = await supabaseAdmin
      .from('trends')
      .select('*')
      .in('date', [todayStr, yesterdayStr])
      .order('date', { ascending: false })
      .order('engagement_score', { ascending: false })
      .limit(15)

    if (error) {
      console.error('Failed to fetch trends:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trends' },
        { status: 500 }
      )
    }

    // Use the date of the most recent trend, or today if no trends
    const latestDate = trends?.[0]?.date || todayStr

    return NextResponse.json({
      date: latestDate,
      trends: trends || [],
      count: trends?.length || 0,
    })
  } catch (error) {
    console.error('Trends error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
