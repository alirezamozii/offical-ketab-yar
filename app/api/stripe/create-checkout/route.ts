import { createCheckoutSession, STRIPE_PLANS } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Create Stripe Checkout Session
 * Agent 4: Handle subscription checkout
 */
export async function POST(request: NextRequest) {
    try {
        const { planType } = await request.json()

        if (!planType || !STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]) {
            return NextResponse.json(
                { error: 'Invalid plan type' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL

        const session = await createCheckoutSession(
            user.id,
            planType,
            `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            `${origin}/subscription?cancelled=true`
        )

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (error) {
        console.error('Stripe checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
