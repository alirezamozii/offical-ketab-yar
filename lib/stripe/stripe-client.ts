import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover' as any,
    typescript: true,
})

// Stripe plan configurations
export const STRIPE_PLANS = {
    monthly: {
        priceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
        amount: 9.99,
        currency: 'usd',
        interval: 'month',
    },
    yearly: {
        priceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
        amount: 99.99,
        currency: 'usd',
        interval: 'year',
    },
} as const

export type StripePlanId = keyof typeof STRIPE_PLANS

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession({
    userId,
    planId,
    successUrl,
    cancelUrl,
}: {
    userId: string
    planId: StripePlanId
    successUrl: string
    cancelUrl: string
}) {
    const plan = STRIPE_PLANS[planId]

    if (!plan.priceId) {
        throw new Error(`Stripe price ID not configured for plan: ${planId}`)
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: plan.priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
            userId,
            planId,
        },
    })

    return session
}

/**
 * Create a Stripe customer portal session
 */
async function createPortalSession({
    customerId,
    returnUrl,
}: {
    customerId: string
    returnUrl: string
}) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })

    return session
}

/**
 * Get subscription details
 */
async function getSubscription(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId: string) {
    return await stripe.subscriptions.cancel(subscriptionId)
}
