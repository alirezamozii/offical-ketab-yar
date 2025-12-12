'use client'

/**
 * Paywall Check Hook
 * Agent 3: Check if user can access current page
 */

import { useAuth } from '@/hooks/use-supabase-auth'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function usePaywallCheck(bookId: string, currentPage: number, freePages: number, isPremium: boolean) {
    const { user } = useAuth()
    const [canAccess, setCanAccess] = useState(true)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkAccess()
    }, [user, currentPage, bookId])

    const checkAccess = async () => {
        setIsLoading(true)

        try {
            // If book is not premium, everyone can access
            if (!isPremium) {
                setCanAccess(true)
                setIsLoading(false)
                return
            }

            // If within free preview pages, allow access
            if (currentPage < freePages) {
                setCanAccess(true)
                setIsLoading(false)
                return
            }

            // Check if user has premium subscription
            if (!user) {
                setCanAccess(false)
                setIsLoading(false)
                return
            }

            const supabase = createClient()
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier, subscription_status, subscription_expires_at')
                .eq('id', user.id)
                .single()

            if (!profile) {
                setCanAccess(false)
                setIsLoading(false)
                return
            }

            // Check if subscription is active and not expired
            const isSubscribed =
                profile.subscription_tier !== 'free' &&
                profile.subscription_status === 'active' &&
                (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date())

            setCanAccess(isSubscribed)
        } catch (error) {
            console.error('Paywall check error:', error)
            setCanAccess(false)
        } finally {
            setIsLoading(false)
        }
    }

    return { canAccess, isLoading, checkAccess }
}
