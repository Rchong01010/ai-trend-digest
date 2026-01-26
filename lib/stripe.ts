import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required')
    }
    _stripe = new Stripe(secretKey)
  }
  return _stripe
}

// Plan configuration
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      topics: 3,
      styles: ['tiktok'] as const,
      customDigestTime: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 12,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    limits: {
      topics: Infinity,
      styles: ['tiktok', 'youtube', 'linkedin', 'twitter', 'newsletter'] as const,
      customDigestTime: true,
    },
  },
} as const

export type PlanType = keyof typeof PLANS

// Check if a feature is available for a tier
export function canUseTier(tier: 'free' | 'pro', feature: 'topics' | 'styles' | 'customDigestTime', value?: number | string): boolean {
  const plan = PLANS[tier]

  if (feature === 'topics' && typeof value === 'number') {
    return value <= plan.limits.topics
  }

  if (feature === 'styles' && typeof value === 'string') {
    return (plan.limits.styles as readonly string[]).includes(value)
  }

  if (feature === 'customDigestTime') {
    return plan.limits.customDigestTime
  }

  return false
}
