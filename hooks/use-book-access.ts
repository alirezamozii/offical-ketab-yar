/**
 * Hook to check if user can access a specific book
 * Admins and test users have unlimited access
 * Regular users need active premium subscription for premium books
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useBookAccess(bookId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['book-access', bookId],
    queryFn: async () => {
      if (!bookId) return false

      const { data, error } = await supabase.rpc('can_access_book', {
        book_id: bookId,
      })

      if (error) {
        console.error('Error checking book access:', error)
        return false
      }

      return data as boolean
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Hook to check if user has general premium access
 * Useful for showing/hiding premium features in UI
 */
export function usePremiumAccess() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['premium-access'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_premium_access')

      if (error) {
        console.error('Error checking premium access:', error)
        return false
      }

      return data as boolean
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Hook to get user's role and subscription info
 * Useful for displaying badges and access indicators
 */
export function useUserAccessInfo() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user-access-info'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, subscription_tier, subscription_status, subscription_expires_at')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user access info:', error)
        return null
      }

      return {
        role: profile.role as 'user' | 'admin' | 'test_user',
        subscriptionTier: profile.subscription_tier as 'free' | 'monthly' | 'quarterly' | 'annual',
        subscriptionStatus: profile.subscription_status as 'active' | 'inactive' | 'cancelled' | 'expired',
        subscriptionExpiresAt: profile.subscription_expires_at,
        hasUnlimitedAccess: profile.role === 'admin' || profile.role === 'test_user',
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
