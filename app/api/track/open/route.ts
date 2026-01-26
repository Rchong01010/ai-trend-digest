import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const digestId = searchParams.get('id')

  if (digestId) {
    try {
      // Update opened_at timestamp
      await supabaseAdmin
        .from('digests')
        .update({
          opened: true,
          opened_at: new Date().toISOString(),
        })
        .eq('id', digestId)

      console.log(`Digest ${digestId} opened`)
    } catch (error) {
      console.error('Failed to track open:', error)
    }
  }

  // Return tracking pixel
  return new NextResponse(TRACKING_PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
