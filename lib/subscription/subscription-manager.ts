// Subscription Management System
// Agent 4: Core subscription logic

import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'monthly' | 'quarterly' | 'annual'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired'

export interface SubscriptionInfo {
    tier: SubscriptionTier
    status: SubscriptionStatus
    expiresAt: Date | null
    isPremium: boolean
    daysRemaining: number | null
}

/**
 * Check if user has active premium subscription
 */
async function checkPremiumStatus(userId: string): Promise<boolean> {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single()

    if (!profile) return false

    // Free tier is not premium
    if (profile.subscription_tier === 'free') return false

    // Check if subscription is active
    if (profile.subscription_status !== 'active') return false

    // Check if subscription has expired
    if (profile.subscription_expires_at) {
        const expiresAt = new Date(profile.subscription_expires_at)
        if (expiresAt < new Date()) {
            // Subscription expired - update status
            await supabase
                .from('profiles')
                .update({ subscription_status: 'expired' })
                .eq('id', userId)
            return false
        }
    }

    return true
}

/**
 * Get detailed subscription information
 */
async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single()

    if (!profile) {
        return {
            tier: 'free',
            status: 'inactive',
            expiresAt: null,
            isPremium: false,
            daysRemaining: null,
        }
    }

    const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
    const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

    return {
        tier: profile.subscription_tier as SubscriptionTier,
        status: profile.subscription_status as SubscriptionStatus,
        expiresAt,
        isPremium: await checkPremiumStatus(userId),
        daysRemaining,
    }
}

/**
 * Activate free trial (1 day)
 */
export async function activateFreeTrial(userId: string): Promise<boolean> {
    const supabase = await createClient()

    // Check if user already had a trial
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

    // Only allow trial if user is on free tier and never had premium
    if (!profile || profile.subscription_tier !== 'free') {
        return false
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day from now

    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_tier: 'free',
            subscription_status: 'active',
            subscription_started_at: now.toISOString(),
            subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId)

    if (error) {
        console.error('Error activating free trial:', error)
        return false
    }

    // Create subscription record
    await supabase.from('subscriptions').insert({
        user_id: userId,
        plan_id: 'free-trial',
        plan_name: 'رایگان 1 روزه',
        amount: 0,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
    })

    return true
}

/**
 * Upgrade subscription (called after successful payment)
 */
export async function upgradeSubscription(
    userId: string,
    planId: SubscriptionTier,
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
): Promise<boolean> {
    const supabase = await createClient()

    const now = new Date()
    let expiresAt: Date

    // Calculate expiration based on plan
    switch (planId) {
        case 'monthly':
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            break
        case 'quarterly':
            expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
            break
        case 'annual':
            expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
            break
        default:
            return false
    }

    const updateData: Record<string, string> = {
        subscription_tier: planId,
        subscription_status: 'active',
        subscription_started_at: now.toISOString(),
        subscription_expires_at: expiresAt.toISOString(),
    }

    if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId
    if (stripeCustomerId) updateData.stripe_customer_id = stripeCustomerId

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

    if (error) {
        console.error('Error upgrading subscription:', error)
        return false
    }

    // Create subscription record
    const planNames = {
        monthly: 'اشتراک ماهانه',
        quarterly: 'اشتراک 3 ماهه',
        annual: 'اشتراک سالانه',
    }

    const planPrices = {
        monthly: 299000,
        quarterly: 799000,
        annual: 2499000,
    }

    await supabase.from('subscriptions').insert({
        user_id: userId,
        plan_id: planId,
        plan_name: planNames[planId],
        amount: planPrices[planId],
        status: 'active',
        stripe_subscription_id: stripeSubscriptionId,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
    })

    return true
}

/**
 * Cancel subscription
 */
async function cancelSubscription(userId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_status: 'cancelled',
        })
        .eq('id', userId)

    if (error) {
        console.error('Error cancelling subscription:', error)
        return false
    }

    // Update subscription record
    await supabase
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active')

    return true
}
