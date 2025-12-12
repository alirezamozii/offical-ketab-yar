'use client'

/**
 * Upgrade Prompt Component
 * Agent 3 (Psychology): Strategic FOMO-driven upgrade prompts
 * Placed throughout the app at key conversion moments
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Crown, Sparkles, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

interface UpgradePromptProps {
    variant?: 'banner' | 'card' | 'inline' | 'modal'
    trigger?: 'vocabulary-limit' | 'premium-book' | 'advanced-feature' | 'general'
    compact?: boolean
    className?: string
}

export function UpgradePrompt({
    variant = 'card',
    trigger = 'general',
    compact = false,
    className = '',
}: UpgradePromptProps) {
    const messages = {
        'vocabulary-limit': {
            title: 'حافظه واژگان پر شد!',
            description: 'با پریمیوم، واژگان نامحدود ذخیره کنید و یادگیری خود را تسریع کنید.',
            icon: Sparkles,
            color: 'from-purple-500 to-pink-500',
        },
        'premium-book': {
            title: 'این کتاب پریمیوم است',
            description: 'با اشتراک پریمیوم، به بیش از 1000 کتاب دسترسی کامل داشته باشید.',
            icon: Crown,
            color: 'from-gold-500 to-gold-600',
        },
        'advanced-feature': {
            title: 'ویژگی پیشرفته',
            description: 'این ویژگی فقط برای کاربران پریمیوم در دسترس است.',
            icon: Zap,
            color: 'from-blue-500 to-cyan-500',
        },
        general: {
            title: 'یادگیری خود را ارتقا دهید',
            description: 'با پریمیوم، به تمام امکانات و کتاب‌ها دسترسی داشته باشید.',
            icon: TrendingUp,
            color: 'from-gold-500 to-gold-600',
        },
    }

    const message = messages[trigger]
    const Icon = message.icon

    if (variant === 'banner') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r ${message.color} text-white p-4 rounded-lg shadow-lg ${className}`}
            >
                <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-bold">{message.title}</p>
                            {!compact && (
                                <p className="text-sm opacity-90">{message.description}</p>
                            )}
                        </div>
                    </div>
                    <Button
                        asChild
                        variant="secondary"
                        className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                        <Link href="/subscription">
                            <Crown className="w-4 h-4 mr-2" />
                            ارتقا به پریمیوم
                        </Link>
                    </Button>
                </div>
            </motion.div>
        )
    }

    if (variant === 'inline') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${message.color} bg-opacity-10 border-2 border-current/20 ${className}`}
            >
                <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm flex-1">{compact ? message.title : message.description}</p>
                <Button asChild size="sm" variant="outline">
                    <Link href="/subscription">ارتقا</Link>
                </Button>
            </motion.div>
        )
    }

    // Default: card variant
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={className}
        >
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-beige-100 to-beige-50 dark:from-gold-500/5 dark:to-gold-600/5 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${message.color}`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{message.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {message.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="premium">
                                    <Link href="/subscription">
                                        <Crown className="w-4 h-4 mr-2" />
                                        مشاهده پلن‌ها
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/about">بیشتر بدانید</Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-4 pt-4 border-t border-primary/20">
                        <p className="text-xs text-muted-foreground text-center">
                            ✨ بیش از 1,000 کاربر به پریمیوم ارتقا یافته‌اند
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

/**
 * Floating Upgrade Button
 * Agent 3: Persistent but non-intrusive upgrade CTA
 */
export function FloatingUpgradeButton() {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2, type: 'spring' }}
            className="fixed bottom-6 left-6 z-40"
        >
            <Button
                asChild
                size="lg"
                variant="premium"
                className="rounded-full"
            >
                <Link href="/subscription">
                    <Crown className="w-5 h-5 mr-2" />
                    ارتقا به پریمیوم
                </Link>
            </Button>
        </motion.div>
    )
}
