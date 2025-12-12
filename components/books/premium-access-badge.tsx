/**
 * Badge component to show user's access level
 * Shows special badges for admins and test users
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { useUserAccessInfo } from '@/hooks/use-book-access'
import { Crown, Shield, TestTube } from 'lucide-react'

export function PremiumAccessBadge() {
    const { data: accessInfo, isLoading } = useUserAccessInfo()

    if (isLoading || !accessInfo) return null

    // Admin badge
    if (accessInfo.role === 'admin') {
        return (
            <Badge variant="default" className="gap-1.5 bg-gold text-black">
                <Shield className="h-3 w-3" />
                <span>Admin Access</span>
            </Badge>
        )
    }

    // Test user badge
    if (accessInfo.role === 'test_user') {
        return (
            <Badge variant="secondary" className="gap-1.5">
                <TestTube className="h-3 w-3" />
                <span>Test User</span>
            </Badge>
        )
    }

    // Premium subscriber badge
    if (
        accessInfo.subscriptionStatus === 'active' &&
        accessInfo.subscriptionTier !== 'free'
    ) {
        return (
            <Badge variant="default" className="gap-1.5 bg-gold text-black">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
            </Badge>
        )
    }

    // Free user - no badge
    return null
}

/**
 * Inline text component showing access level
 * For use in headers or profile sections
 */
export function AccessLevelText() {
    const { data: accessInfo } = useUserAccessInfo()

    if (!accessInfo) return null

    if (accessInfo.role === 'admin') {
        return <span className="text-sm text-gold font-medium">Admin • Unlimited Access</span>
    }

    if (accessInfo.role === 'test_user') {
        return <span className="text-sm text-muted-foreground font-medium">Test User • Unlimited Access</span>
    }

    if (accessInfo.subscriptionStatus === 'active' && accessInfo.subscriptionTier !== 'free') {
        return <span className="text-sm text-gold font-medium">Premium Member</span>
    }

    return <span className="text-sm text-muted-foreground">Free Account</span>
}
