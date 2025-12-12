'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Lock, Sparkles, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface FreemiumPaywallProps {
    currentPage: number
    freePreviewPages: number
    bookTitle: string
    onClose?: () => void
}

type PaywallStage = 'hidden' | 'first' | 'second' | 'closed'

export function FreemiumPaywall({
    currentPage,
    freePreviewPages,
    bookTitle,
    onClose,
}: FreemiumPaywallProps) {
    const { user } = useAuth()
    const supabase = createClient()
    const [stage, setStage] = useState<PaywallStage>('hidden')
    const [isPremium, setIsPremium] = useState(false)
    const [hasFreeTrial, setHasFreeTrial] = useState(false)

    // Check if user has reached the free page limit
    const hasReachedLimit = currentPage > freePreviewPages

    // Check user subscription status
    useEffect(() => {
        const checkSubscription = async () => {
            if (!user) return

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_tier, subscription_expires_at, created_at')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    // Check if premium
                    const isActivePremium =
                        profile.subscription_tier !== 'free' &&
                        profile.subscription_expires_at &&
                        new Date(profile.subscription_expires_at) > new Date()

                    setIsPremium(!!isActivePremium)

                    // Check if user has used free trial (created within last 24 hours)
                    const accountAge = Date.now() - new Date(profile.created_at).getTime()
                    const hasActiveTrial = accountAge < 24 * 60 * 60 * 1000 // 24 hours
                    setHasFreeTrial(hasActiveTrial)
                }
            } catch (error) {
                console.error('Failed to check subscription:', error)
            }
        }

        checkSubscription()
    }, [user, supabase])

    // Show paywall when limit reached
    useEffect(() => {
        if (hasReachedLimit && !isPremium && !hasFreeTrial && stage === 'hidden') {
            setStage('first')
        }
    }, [hasReachedLimit, isPremium, hasFreeTrial, stage])

    // Handle first popup close
    const handleFirstClose = () => {
        setStage('second')
    }

    // Handle second popup close
    const handleSecondClose = () => {
        setStage('closed')
        onClose?.()
    }

    // Activate free trial
    const activateFreeTrial = async () => {
        if (!user) {
            // Redirect to register
            window.location.href = '/auth/register?trial=true'
            return
        }

        try {
            // User already has account, just mark trial as active
            // (Trial is automatic for first 24 hours)
            setHasFreeTrial(true)
            setStage('closed')
            onClose?.()
        } catch (error) {
            console.error('Failed to activate trial:', error)
        }
    }

    // Don't show if user is premium or has active trial
    if (isPremium || hasFreeTrial || !hasReachedLimit) {
        return null
    }

    return (
        <AnimatePresence>
            {stage !== 'hidden' && stage !== 'closed' && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
                        style={{ backdropFilter: 'blur(8px)' }}
                    />

                    {/* First Popup - Premium Upgrade */}
                    {stage === 'first' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        >
                            <Card className="w-full max-w-md border-2 border-gold-500 shadow-2xl">
                                <CardHeader className="relative bg-gradient-to-br from-gold-500/20 to-gold-600/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleFirstClose}
                                        className="absolute top-2 right-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Lock className="h-8 w-8 text-gold-600" />
                                        <CardTitle className="text-2xl">
                                            You've reached the free preview limit
                                        </CardTitle>
                                    </div>
                                    <p className="text-muted-foreground">
                                        You've read {freePreviewPages} pages of "{bookTitle}"
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-gold-600" />
                                            Upgrade to Premium
                                        </h3>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-600 mt-0.5">✓</span>
                                                <span>Unlimited access to all books</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-600 mt-0.5">✓</span>
                                                <span>Save unlimited vocabulary words</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-600 mt-0.5">✓</span>
                                                <span>Offline reading capability</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-600 mt-0.5">✓</span>
                                                <span>AI-powered reading assistant</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-600 mt-0.5">✓</span>
                                                <span>Advanced progress tracking</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold">Monthly Plan</span>
                                            <Badge className="bg-gold-600">Best Value</Badge>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold">$9.99</span>
                                            <span className="text-muted-foreground">/month</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Button
                                            asChild
                                            className="w-full bg-gold-600 hover:bg-gold-700 text-lg py-6"
                                        >
                                            <Link href="/subscription">
                                                <Sparkles className="h-5 w-5 mr-2" />
                                                Upgrade to Premium
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleFirstClose}
                                            className="w-full"
                                        >
                                            Maybe Later
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Second Popup - Free Trial Offer */}
                    {stage === 'second' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, delay: 0.2 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        >
                            <Card className="w-full max-w-md border-2 border-green-500 shadow-2xl">
                                <CardHeader className="relative bg-gradient-to-br from-green-500/20 to-emerald-600/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSecondClose}
                                        className="absolute top-2 right-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Zap className="h-8 w-8 text-green-600 animate-pulse" />
                                        <CardTitle className="text-2xl">Wait! Special Offer</CardTitle>
                                    </div>
                                    <Badge className="bg-green-600 w-fit">Limited Time</Badge>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl font-bold">
                                            Get 24 Hours FREE Access!
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {user
                                                ? 'Activate your free trial now'
                                                : 'Create a free account and get instant access'}
                                        </p>
                                    </div>

                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-6 w-6 text-green-600" />
                                            <div>
                                                <p className="font-semibold">24-Hour Full Access</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Read any book, unlimited
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="h-6 w-6 text-green-600" />
                                            <div>
                                                <p className="font-semibold">All Premium Features</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Try everything for free
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-6 w-6 text-green-600" />
                                            <div>
                                                <p className="font-semibold">No Credit Card Required</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Cancel anytime
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Button
                                            onClick={activateFreeTrial}
                                            className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                                        >
                                            <Zap className="h-5 w-5 mr-2" />
                                            {user ? 'Activate Free Trial' : 'Sign Up & Get Free Trial'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleSecondClose}
                                            className="w-full text-muted-foreground"
                                        >
                                            No thanks, I'll pass
                                        </Button>
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground">
                                        After 24 hours, you can subscribe for $9.99/month to continue
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    )
}
