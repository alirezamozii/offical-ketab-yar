'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, KeyRound, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordForm() {
    const { resetPassword } = useSupabaseAuth()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)
        setIsLoading(true)

        try {
            await resetPassword(email)
            setSuccess(true)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطایی رخ داد'

            if (errorMessage.includes('not found')) {
                setError('این ایمیل در سیستم ثبت نشده است')
            } else {
                setError('خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <Card className="border-green-500/20 shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle className="size-6 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">ایمیل ارسال شد!</CardTitle>
                        <CardDescription>
                            لینک بازیابی رمز عبور به ایمیل شما ارسال شد
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <Mail className="size-4" />
                            <AlertDescription>
                                لطفاً ایمیل خود را بررسی کنید و روی لینک بازیابی کلیک کنید.
                                اگر ایمیل را نمی‌بینید، پوشه اسپم را هم چک کنید.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Link href="/auth/login" className="w-full">
                            <Button variant="outline" className="w-full">
                                بازگشت به صفحه ورود
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        )
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
                        <KeyRound className="size-7 md:size-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        فراموشی رمز عبور
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base text-muted-foreground">
                        لینک بازیابی به ایمیل شما ارسال می‌شود 📧
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold">ایمیل</Label>
                            <div className="relative group">
                                <Mail className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pr-10 h-12 border-2 focus:border-gold focus:ring-gold/20 transition-all"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-12 bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 hover:from-gold-600 hover:via-gold-700 hover:to-gold-600 text-white font-semibold shadow-lg shadow-gold-500/30 hover:shadow-xl hover:shadow-gold-500/40 transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="ml-2 size-5 animate-spin" />
                                    در حال ارسال...
                                </>
                            ) : (
                                <>
                                    <Mail className="ml-2 size-5" />
                                    ارسال لینک بازیابی
                                </>
                            )}
                        </Button>
                    </CardContent>
                </form>

                <CardFooter className="flex flex-col space-y-2 pt-6 border-t">
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">رمز عبور خود را به یاد آوردید؟</span>{' '}
                        <Link href="/auth/login" className="text-gold hover:text-gold/80 font-semibold transition-colors">
                            وارد شوید
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
