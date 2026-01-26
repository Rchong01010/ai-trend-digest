import { Resend } from 'resend'
import crypto from 'crypto'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required')
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

// Generate unsubscribe token
function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret'
  return crypto
    .createHmac('sha256', secret)
    .update(userId)
    .digest('hex')
    .slice(0, 16)
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_URL}/api/verify?token=${token}`

  const { error } = await getResend().emails.send({
    from: 'AI Trend Digest <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your email for AI Trend Digest',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6; font-size: 24px;">Welcome to AI Trend Digest!</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Click the button below to verify your email and start receiving daily AI trend updates.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 14px;">
          Or copy this link: ${verifyUrl}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          If you didn't sign up for AI Trend Digest, you can ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Failed to send verification email:', error)
    throw error
  }
}

export async function sendDigestEmail(
  email: string,
  trends: Array<{
    title: string
    category: string
    summary: string
    why_it_matters: string | null
    tiktok_angle: string | null
    script: string | null
    sources: Array<{ url: string; platform: string; title: string }>
  }>,
  digestId: string,
  userId?: string,
  userTier?: 'free' | 'pro'
) {
  const topTopic = trends[0]?.title || 'AI Updates'
  const webViewUrl = `${process.env.NEXT_PUBLIC_URL}/digest/${digestId}`
  const trackingPixelUrl = `${process.env.NEXT_PUBLIC_URL}/api/track/open?id=${digestId}`
  const unsubscribeUrl = userId
    ? `${process.env.NEXT_PUBLIC_URL}/api/unsubscribe?user=${userId}&token=${generateUnsubscribeToken(userId)}`
    : `${process.env.NEXT_PUBLIC_URL}/unsubscribe`

  const categoryEmojis: Record<string, string> = {
    models: '🤖',
    tools: '🛠️',
    research: '📚',
    drama: '🔥',
    tutorials: '📖',
  }

  const trendsHtml = trends.map(trend => `
    <div style="margin-bottom: 32px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <h3 style="margin: 0 0 12px; color: #111; font-size: 18px; font-weight: 600;">
        ${categoryEmojis[trend.category] || '📰'} ${trend.title}
      </h3>
      <p style="margin: 0 0 12px; color: #444; font-size: 14px; line-height: 1.6;">
        ${trend.summary}
      </p>
      ${trend.tiktok_angle ? `
        <p style="margin: 12px 0; padding: 10px; background: #fff3cd; border-radius: 6px; font-size: 13px; color: #856404;">
          💡 <strong>Content angle:</strong> ${trend.tiktok_angle}
        </p>
      ` : ''}
      ${trend.script ? `
        <div style="margin: 16px 0; padding: 16px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px;">
            📝 TikTok Script (30-45 sec)
          </p>
          <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
${trend.script}
          </p>
        </div>
      ` : ''}
      ${trend.sources.length > 0 ? `
        <p style="margin: 12px 0 0; font-size: 12px; color: #666;">
          📎 Source: <a href="${trend.sources[0].url}" style="color: #3b82f6; text-decoration: none;">${trend.sources[0].title || trend.sources[0].platform}</a>
        </p>
      ` : ''}
    </div>
  `).join('')

  // Upgrade CTA for free users
  const upgradeCta = userTier === 'free' ? `
    <div style="margin: 28px 0; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 12px; color: #92400e; font-size: 16px; font-weight: 600;">
        ⭐ Unlock More with Pro
      </p>
      <p style="margin: 0 0 16px; color: #a16207; font-size: 14px;">
        Get unlimited topics, all content styles (YouTube, LinkedIn, Twitter, Newsletter), and custom delivery times.
      </p>
      <a href="${process.env.NEXT_PUBLIC_URL}/settings${userId ? `?user=${userId}` : ''}" style="display: inline-block; padding: 10px 20px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Upgrade for $12/mo
      </a>
    </div>
  ` : ''

  const { error } = await getResend().emails.send({
    from: 'AI Trend Digest <onboarding@resend.dev>',
    to: email,
    subject: `🔥 AI Digest: ${topTopic} + ${trends.length - 1} more trends`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #eee; margin-bottom: 28px;">
          <h1 style="margin: 0; color: #3b82f6; font-size: 28px; font-weight: 700;">AI Trend Digest</h1>
          <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
            ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 28px;">
          Here's what happened in AI while you were sleeping:
        </p>

        ${trendsHtml}

        ${upgradeCta}

        <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
            <a href="${webViewUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">View in browser</a>
            <span style="color: #ccc; margin: 0 8px;">·</span>
            Reply to this email with feedback
          </p>
          <p style="color: #999; font-size: 12px;">
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>

        <!-- Tracking pixel -->
        <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
      </div>
    `,
  })

  if (error) {
    console.error('Failed to send digest email:', error)
    throw error
  }
}

// Send error alert to admin
export async function sendErrorAlert(
  subject: string,
  message: string,
  details?: string
) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL not set, cannot send error alert')
    return
  }

  try {
    const { error } = await getResend().emails.send({
      from: 'AI Trend Digest <onboarding@resend.dev>',
      to: adminEmail,
      subject: `[Alert] ${subject}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; font-size: 24px;">Error Alert</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          ${details ? `
            <pre style="background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
${details}
            </pre>
          ` : ''}
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send error alert:', error)
    }
  } catch (err) {
    console.error('Error sending alert email:', err)
  }
}
