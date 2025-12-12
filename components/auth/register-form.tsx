'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { motion } from 'framer-motion'
import { AlertCircle, BookOpen, Loader2, Lock, Mail, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterForm() {
    const router = useRouter()
    const { signUp } = useSupabaseAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (password !== confirmPassword) {
            setError('رمز عبور و تکرار آن یکسان نیستند')
            return
        }

        if (password.length < 6) {
            setError('رمز عبور باید حداقل ۶ کاراکتر باشد')
            return
        }

        if (!acceptTerms) {
            setError('لطفاً قوانین و مقررات را بپذیرید')
            return
        }

        setIsLoading(true)

        try {
            await signUp(email, password, name)
            // Success - redirected by auth hook
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطایی رخ داد'

            if (errorMessage.includes('already registered')) {
                setError('این ایمیل قبلاً ثبت شده است. می‌خواهید وارد شوید؟')
            } else if (errorMessage.includes('Invalid email')) {
                setError('فرمت ایمیل صحیح نیست')
            } else {
                setError('خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.')
            }
        } finally {
            setIsLoading(false)
        }
    }

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
                <CardHeader className="space-y-2 text-center pb-4">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="mx-auto mb-1 flex size-14 md:size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 shadow-xl shadow-gold-500/30"
                    >
                        <BookOpen className="size-7 md:size-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        شروع سفر یادگیری
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base text-muted-foreground">
                        حساب بسازید و ۵۰ امتیاز هدیه بگیرید! 🎁
                    </CardDescription>
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
                            <Label htmlFor="name" className="text-sm font-semibold">نام و نام خانوادگی</Label>
                            <div className="relative group">
                                <User className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="نام شما"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pr-10 h-12 border-2 focus:border-gold focus:ring-gold/20 transition-all"
                                />
                            </div>
                        </div>

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
                            <Label htmlFor="password" className="text-sm font-semibold">رمز عبور</Label>
                            <div className="relative group">
                                <Lock className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="حداقل ۶ کاراکتر"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pr-10 h-12 border-2 focus:border-gold focus:ring-gold/20 transition-all"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-semibold">تکرار رمز عبور</Label>
                            <div className="relative group">
                                <Lock className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="تکرار رمز عبور"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pr-10 h-12 border-2 focus:border-gold focus:ring-gold/20 transition-all"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse pt-2">
                            <Checkbox
                                id="terms"
                                checked={acceptTerms}
                                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                disabled={isLoading}
                                className="border-2 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                            />
                            <Label
                                htmlFor="terms"
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                <Link href="/terms" className="text-gold hover:text-gold/80 font-medium transition-colors">
                                    قوانین و مقررات
                                </Link>{' '}
                                را می‌پذیرم
                            </Label>
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
                                    در حال ثبت‌نام...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="ml-2 size-5" />
                                    ثبت‌نام و دریافت ۵۰ امتیاز
                                </>
                            )}
                        </Button>

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
                        <span className="text-muted-foreground">قبلاً ثبت‌نام کرده‌اید؟</span>{' '}
                        <Link href="/auth/login" className="text-gold hover:text-gold/80 font-semibold transition-colors">
                            وارد شوید
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
                    >
                        <span className="inline-flex items-center gap-1">
                            <span className="text-lg">🔥</span>
                            <span className="font-medium">استریک روزانه</span>
                        </span>
                        را شروع کنید
                    </motion.div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
