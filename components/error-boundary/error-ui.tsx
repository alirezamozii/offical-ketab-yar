'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { AlertCircle, BookOpen, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorUIProps {
    title?: string
    description?: string
    onReset: () => void
    errorDigest?: string
    error?: Error & { digest?: string }
    loggerLabel?: string
}

export function ErrorUI({
    title = 'اوه! یک مشکل پیش آمد',
    description,
    onReset,
    errorDigest,
    error,
    loggerLabel = 'Error'
}: ErrorUIProps) {
    useEffect(() => {
        if (error) {
            if (process.env.NODE_ENV === 'production') {
                // TODO: Send to error tracking
            } else {
                console.error(`[${loggerLabel}]:`, error)
            }
        }
    }, [error, loggerLabel])

    const getUserFriendlyMessage = (err?: Error) => {
        if (!err) return description || 'متأسفانه یک خطای غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.'
        const msg = err.message || ''
        if (msg.includes('network')) return 'مشکل در اتصال به اینترنت. لطفاً اتصال خود را بررسی کنید.'
        if (msg.includes('timeout')) return 'زمان اتصال به پایان رسید. لطفاً دوباره تلاش کنید.'
        if (msg.includes('Invalid')) return 'اطلاعات وارد شده صحیح نیست. لطفاً دوباره بررسی کنید.'
        if (msg.includes('fetch')) return 'خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.'
        return description || msg || 'متأسفانه یک خطای غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.'
    }

    const displayDescription = getUserFriendlyMessage(error)
    const displayDigest = errorDigest || error?.digest

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6 max-w-md"
            >
                <motion.div
                    animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatDelay: 2
                    }}
                    className="flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
                        <div className="relative w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-destructive" />
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{displayDescription}</p>
                    {displayDigest && (
                        <p className="text-xs text-muted-foreground/70 font-mono">
                            کد خطا: {displayDigest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={onReset}
                        className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 shadow-lg shadow-gold-500/30"
                    >
                        <RefreshCw className="w-4 h-4 ml-2" />
                        تلاش مجدد
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <Home className="w-4 h-4 ml-2" />
                            بازگشت به خانه
                        </Link>
                    </Button>
                </div>

                <div className="pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">پیشنهادات مفید:</p>
                    <div className="space-y-2 text-sm text-muted-foreground text-right">
                        <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-500" />
                            <span>به کتابخانه بروید و مطالعه خود را ادامه دهید</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-500" />
                            <span>صفحه را رفرش کنید یا اتصال اینترنت خود را بررسی کنید</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
