'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { motion } from 'framer-motion'
import { AlertCircle, BookOpen, Loader2, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginForm() {
    const router = useRouter()
    const { signIn, signInWithGoogle } = useSupabaseAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Agent 3 (Psychology): Optimistic UI with helpful error messages
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await signIn(email, password)
            // Success handled by auth hook (redirects to dashboard)
        } catch (err) {
            // Agent 3: User-friendly error messages
            const errorMessage = err instanceof Error ? err.message : 'خطایی رخ داد'

            if (errorMessage.includes('Invalid login credentials')) {
                setError('ایمیل یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.')
            } else if (errorMessage.includes('Email not confirmed')) {
                setError('لطفاً ابتدا ایمیل خود را تأیید کنید.')
            } else {
                setError('خطا در ورود. لطفاً دوباره تلاش کنید.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Agent 3: Guest mode for freemium strategy
    const handleGuestMode = () => {
        router.push('/library')
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
        >
            <Card className="border-gold/30 shadow-2xl backdrop-blur-sm bg-background/95 dark:bg-background/90">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                        <BookOpen className="h-6 w-6 text-gold" />
                    </div>
                    <CardTitle className="text-2xl font-bold">خوش آمدید</CardTitle>
                    <CardDescription>به دنیای کتاب‌های دوزبانه خوش آمدید 📚</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-3 md:space-y-4">
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-semibold">رمز عبور</Label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-gold hover:text-gold/80 font-medium transition-colors"
                                >
                                    فراموشی رمز عبور؟
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                    در حال ورود...
                                </>
                            ) : (
                                <>
                                    <Lock className="ml-2 size-5" />
                                    ورود به کتاب‌یار
                                </>
                            )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-3 text-muted-foreground font-medium">
                                    یا ادامه با
                                </span>
                            </div>
                        </div>

                        {/* Google Sign In - Beautiful with Google Colors */}
                        <Button
                            type="button"
                            size="lg"
                            className="w-full h-12 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={async () => {
                                setIsLoading(true)
                                try {
                                    await signInWithGoogle()
                                } catch (err) {
                                    setError('خطا در ورود با Google')
                                } finally {
                                    setIsLoading(false)
                                }
                            }}
                            disabled={isLoading}
                        >
                            <svg className="ml-2 size-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            ورود با Google
                        </Button>

                        {/* Agent 3: Guest mode for freemium */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            className="w-full h-12 font-medium hover:bg-muted/50 transition-colors"
                            onClick={handleGuestMode}
                            disabled={isLoading}
                        >
                            ادامه به عنوان مهمان
                        </Button>
                    </CardContent>
                </form>

                <CardFooter className="flex flex-col space-y-4 pt-6 border-t">
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">حساب کاربری ندارید؟</span>{' '}
                        <Link href="/auth/register" className="text-gold hover:text-gold/80 font-semibold transition-colors">
                            ثبت‌نام کنید
                        </Link>
                    </div>

                    {/* Agent 3: Social proof with animation */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
                    >
                        <span className="inline-flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="font-medium">۱۰,۰۰۰+</span>
                        </span>
                        خواننده فعال 📚
                    </motion.div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
