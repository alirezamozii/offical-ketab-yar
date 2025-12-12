'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { BookOpen, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    const [isResending, setIsResending] = useState(false)
    const [resendMessage, setResendMessage] = useState('')
    const [countdown, setCountdown] = useState(60)
    const [canResend, setCanResend] = useState(false)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [countdown])

    const handleResendEmail = async () => {
        if (!email || !canResend) return

        setIsResending(true)
        setResendMessage('')

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            })

            if (error) throw error

            setResendMessage('ایمیل تأیید مجدداً ارسال شد! لطفاً صندوق ورودی خود را بررسی کنید.')
            setCountdown(60)
            setCanResend(false)
        } catch (error) {
            console.error('Error resending email:', error)
            setResendMessage('خطا در ارسال مجدد ایمیل. لطفاً دوباره تلاش کنید.')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
        >
            <Card className="border-gold/30 shadow-2xl backdrop-blur-sm bg-background/95 dark:bg-background/90">
                <CardHeader className="space-y-2 text-center pb-4">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="mx-auto mb-1 flex size-14 md:size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 shadow-xl shadow-gold-500/30"
                    >
                        <Mail className="size-7 md:size-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        ایمیل خود را تأیید کنید
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base text-muted-foreground">
                        یک ایمیل تأیید به آدرس شما ارسال شد 📧
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="text-center space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm text-muted-foreground mb-2">
                                ایمیل تأیید به آدرس زیر ارسال شد:
                            </p>
                            <p className="text-base font-semibold text-foreground" dir="ltr">
                                {email || 'ایمیل شما'}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground text-right">
                            <p>✓ صندوق ورودی خود را بررسی کنید</p>
                            <p>✓ روی لینک تأیید در ایمیل کلیک کنید</p>
                            <p>✓ پوشه اسپم را هم چک کنید</p>
                        </div>

                        {resendMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg text-sm ${resendMessage.includes('خطا')
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-green-500/10 text-green-600 dark:text-green-500'
                                    }`}
                            >
                                {resendMessage}
                            </motion.div>
                        )}

                        <Button
                            onClick={handleResendEmail}
                            disabled={!canResend || isResending}
                            variant="outline"
                            size="lg"
                            className="w-full h-12 font-medium border-2"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="ml-2 size-5 animate-spin" />
                                    در حال ارسال...
                                </>
                            ) : canResend ? (
                                <>
                                    <RefreshCw className="ml-2 size-5" />
                                    ارسال مجدد ایمیل
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="ml-2 size-5" />
                                    ارسال مجدد ({countdown}s)
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-4 border-t">
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">ایمیل را تأیید کردید؟</span>{' '}
                        <Link href="/auth/login" className="text-gold hover:text-gold/80 font-semibold transition-colors">
                            وارد شوید
                        </Link>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                            <BookOpen className="size-3" />
                            بازگشت به صفحه اصلی
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
