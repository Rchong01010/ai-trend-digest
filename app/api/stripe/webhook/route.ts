import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId) {
          // Get subscription end date
          let subscriptionEndsAt: string | null = null
          if (session.subscription) {
            const stripe = getStripe()
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            ) as unknown as { current_period_end: number }
            subscriptionEndsAt = new Date(subscription.current_period_end * 1000).toISOString()
          }

          await supabaseAdmin
            .from('users')
            .update({
              subscription_tier: 'pro',
              subscription_ends_at: subscriptionEndsAt,
            })
            .eq('id', userId)

          console.log(`User ${userId} upgraded to pro`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          await supabaseAdmin
            .from('users')
            .update({
              subscription_tier: 'free',
              subscription_ends_at: null,
            })
            .eq('id', user.id)

          console.log(`User ${user.id} downgraded to free`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const stripe = getStripe()
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_end: number }
          const subscriptionEndsAt = new Date(subscription.current_period_end * 1000).toISOString()

          // Find user by Stripe customer ID
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (user) {
            await supabaseAdmin
              .from('users')
              .update({ subscription_ends_at: subscriptionEndsAt })
              .eq('id', user.id)

            console.log(`Extended subscription for user ${user.id}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
