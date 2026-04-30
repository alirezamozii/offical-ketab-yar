'use client'

import { AuthCardHeader } from './auth-card-header'
import { AvatarSelector } from '@/components/auth/avatar-selector'
import { UsernameInput } from '@/components/auth/username-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEmailValidation } from '@/hooks/use-email-validation'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { type AvatarData } from '@/lib/utils/avatar-utils'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, Loader2, Lock, Mail, Sparkles, User, X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface FormData {
    email: string
    fullName: string
    password: string
    confirmPassword: string
    username: string
    birthDate: Date | null
    birthDateJalali: string
    gender: 'male' | 'female' | 'prefer_not_to_say' | ''
    avatar: AvatarData
    referralCode: string
    marketingConsent: boolean
}

export default function MultiStepRegisterForm() {
    const { signUp, signInWithGoogle } = useSupabaseAuth()
    const searchParams = useSearchParams()

    // Check if coming from Google OAuth
    const isGoogleSignup = searchParams.get('google') === 'true'
    const urlStep = searchParams.get('step')
    const initialStep = urlStep ? parseInt(urlStep) : 1

    const [currentStep, setCurrentStep] = useState(initialStep)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [isUsernameValid, setIsUsernameValid] = useState(false)
    const [emailError, setEmailError] = useState('')
    const [emailTouched, setEmailTouched] = useState(false)
    const [passwordError, setPasswordError] = useState('')
    const [confirmPasswordError, setConfirmPasswordError] = useState('')
    const [googlePhotoUrl, setGooglePhotoUrl] = useState<string | null>(null)

    const [formData, setFormData] = useState<FormData>({
        email: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        username: '',
        birthDate: null,
        birthDateJalali: '',
        gender: '',
        avatar: { type: 'preset', presetId: 1 },
        referralCode: '',
        marketingConsent: false,
    })

    // Email uniqueness validation (must be after formData declaration)
    const emailValidation = useEmailValidation(formData.email, 800)

    // Load Google user data if coming from OAuth
    useEffect(() => {
        if (isGoogleSignup) {
            const loadGoogleUserData = async () => {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    const googlePhoto = session.user.user_metadata?.avatar_url || null
                    setGooglePhotoUrl(googlePhoto)

                    setFormData(prev => ({
                        ...prev,
                        email: session.user.email || '',
                        fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                        avatar: googlePhoto
                            ? { type: 'google', customUrl: googlePhoto }
                            : prev.avatar
                    }))
                }
            }
            loadGoogleUserData()
        }
    }, [isGoogleSignup])

    const updateFormData = (field: keyof FormData, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    // Real-time email validation with domain whitelist
    useEffect(() => {
        if (!emailTouched || !formData.email) {
            setEmailError('')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setEmailError('فرمت ایمیل صحیح نیست')
            return
        }

        // Popular email providers whitelist
        const allowedDomains = [
            // Google
            'gmail.com', 'googlemail.com',
            // Microsoft
            'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
            // Yahoo
            'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it',
            // Apple
            'icloud.com', 'me.com', 'mac.com',
            // Other popular providers
            'protonmail.com', 'proton.me', 'aol.com', 'zoho.com', 'yandex.com', 'mail.com',
            // Educational
            'edu', 'ac.uk', 'edu.au', 'edu.cn',
            // Iranian providers
            'chmail.ir', 'email.ir', 'iranmail.com', 'post.com'
        ]

        const emailDomain = formData.email.split('@')[1]?.toLowerCase()

        // Check if domain ends with any allowed domain (for subdomains)
        const isAllowed = allowedDomains.some(domain =>
            emailDomain === domain || emailDomain?.endsWith('.' + domain)
        )

        if (!isAllowed) {
            setEmailError('لطفاً از یک ایمیل معتبر استفاده کنید (Gmail, Outlook, Yahoo, iCloud و...)')
            return
        }

        // Check uniqueness from the hook
        if (emailValidation.error) {
            setEmailError(emailValidation.error)
        } else if (!emailValidation.isChecking && emailValidation.isAvailable) {
            setEmailError('')
        }
    }, [formData.email, emailTouched, emailValidation.error, emailValidation.isChecking, emailValidation.isAvailable])

    // Real-time password validation
    useEffect(() => {
        if (!formData.password) {
            setPasswordError('')
            return
        }

        if (formData.password.length < 6) {
            setPasswordError('رمز عبور باید حداقل ۶ کاراکتر باشد')
        } else {
            setPasswordError('')
        }
    }, [formData.password])

    // Real-time confirm password validation
    useEffect(() => {
        if (!formData.confirmPassword) {
            setConfirmPasswordError('')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setConfirmPasswordError('رمز عبور و تکرار آن یکسان نیستند')
        } else {
            setConfirmPasswordError('')
        }
    }, [formData.password, formData.confirmPassword])

    const validateStep1 = (): boolean => {
        if (!formData.email || !formData.fullName || !formData.password || !formData.confirmPassword) {
            setError('لطفاً تمام فیلدها را پر کنید')
            return false
        }

        if (emailError || passwordError || confirmPasswordError) {
            setError('لطفاً خطاهای فرم را برطرف کنید')
            return false
        }

        return true
    }

    const validateStep2 = (): boolean => {
        if (!formData.username) {
            setError('لطفاً نام کاربری را وارد کنید')
            return false
        }

        if (!isUsernameValid) {
            setError('نام کاربری معتبر نیست یا قبلاً گرفته شده است')
            return false
        }

        return true
    }

    const handleNext = () => {
        setError('')

        if (currentStep === 1 && !validateStep1()) return
        if (currentStep === 2 && !validateStep2()) return

        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrevious = () => {
        setError('')
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSubmit = async () => {
        setError('')
        setIsLoading(true)

        try {
            if (isGoogleSignup) {
                // For Google OAuth users, just update their profile
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    throw new Error('No active session')
                }

                const profileData = {
                    id: session.user.id,
                    full_name: formData.fullName,
                    username: formData.username,
                    first_name: formData.fullName.split(' ')[0],
                    last_name: formData.fullName.split(' ').slice(1).join(' ') || null,
                    birth_date: formData.birthDate,
                    gender: formData.gender || null,
                    avatar_type: formData.avatar.type,
                    avatar_preset_id: formData.avatar.presetId || null,
                    avatar_custom_url: formData.avatar.customUrl || null,
                    registration_completed: true,
                    registration_step: 3,
                    registration_completed_at: new Date().toISOString(),
                }

                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert(profileData)
                    .eq('id', session.user.id)

                if (profileError) throw profileError

                // Redirect to dashboard
                window.location.href = '/dashboard'
            } else {
                // Regular email/password signup
                const registrationData = {
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    username: formData.username,
                    birthDate: formData.birthDate,
                    birthDateJalali: '', // Will be calculated server-side if needed
                    gender: formData.gender || undefined,
                    avatar: formData.avatar,
                    referralCode: formData.referralCode || undefined,
                    marketingConsent: formData.marketingConsent,
                }

                await signUp(registrationData)
            }
        } catch {
            setError('خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.')
        } finally {
            setIsLoading(false)
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
                <AuthCardHeader
                    icon={BookOpen}
                    title="ثبت‌نام در کتاب‌یار"
                    description={
                        <div className="space-y-3">
                            <p>
                                {currentStep === 1 && 'سفر یادگیری خود را آغاز کنید 🚀'}
                                {currentStep === 2 && 'اطلاعات پروفایل خود را تکمیل کنید ✨'}
                                {currentStep === 3 && 'تصویر پروفایل خود را انتخاب کنید 🎨'}
                            </p>
                            {/* Step Progress Indicator */}
                            <div className="flex items-center justify-center gap-2 pt-1">
                                {[1, 2, 3].map((step) => (
                                    <motion.div
                                        key={step}
                                        initial={false}
                                        animate={{
                                            scale: currentStep === step ? 1.2 : 1,
                                            opacity: currentStep >= step ? 1 : 0.3,
                                        }}
                                        className={`h-2 rounded-full transition-all ${currentStep >= step ? 'bg-gold w-8' : 'bg-muted w-2'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    }
                />

                <form onSubmit={(e) => {
                    e.preventDefault()
                    if (currentStep === 3) {
                        void handleSubmit()
                    } else {
                        handleNext()
                    }
                }}>
                    <CardContent className="space-y-3 md:space-y-4 pt-0">
                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Step Content */}
                        <AnimatePresence mode="wait">
                            {/* Step 1: Basic Info */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-3 md:space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-sm font-semibold">نام و نام خانوادگی</Label>
                                        <div className="relative group">
                                            <User className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) => updateFormData('fullName', e.target.value)}
                                                placeholder="نام کامل شما"
                                                className="pr-10 h-12 border-2 focus:border-gold focus:ring-gold/20 transition-all"
                                                disabled={isLoading}
                                                autoFocus
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
                                                value={formData.email}
                                                onChange={(e) => {
                                                    updateFormData('email', e.target.value)
                                                    if (!emailTouched) setEmailTouched(true)
                                                }}
                                                onBlur={() => setEmailTouched(true)}
                                                placeholder="example@email.com"
                                                className={cn(
                                                    "pr-10 pl-10 h-12 border-2 transition-all",
                                                    emailTouched && formData.email && !emailError && "border-green-500 focus:border-green-500",
                                                    emailTouched && emailError && "border-destructive focus:border-destructive",
                                                    !emailTouched && "focus:border-gold focus:ring-gold/20"
                                                )}
                                                dir="ltr"
                                                disabled={isLoading}
                                            />
                                            {/* Validation Icon */}
                                            <div className="absolute left-3 top-3.5">
                                                <AnimatePresence mode="wait">
                                                    {emailTouched && emailValidation.isChecking && (
                                                        <motion.div
                                                            key="checking"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                        >
                                                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                        </motion.div>
                                                    )}
                                                    {emailTouched && !emailValidation.isChecking && formData.email && !emailError && (
                                                        <motion.div
                                                            key="valid"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                        >
                                                            <Check className="size-4 text-green-500" />
                                                        </motion.div>
                                                    )}
                                                    {emailTouched && !emailValidation.isChecking && emailError && (
                                                        <motion.div
                                                            key="invalid"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                        >
                                                            <X className="size-4 text-destructive" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        {/* Email Error Message */}
                                        <AnimatePresence mode="wait">
                                            {emailTouched && emailError && (
                                                <motion.p
                                                    key="email-error"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-xs text-destructive"
                                                >
                                                    {emailError}
                                                </motion.p>
                                            )}
                                            {emailTouched && formData.email && !emailError && (
                                                <motion.p
                                                    key="email-success"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-xs text-green-600 dark:text-green-500"
                                                >
                                                    ✓ ایمیل معتبر است
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-semibold">رمز عبور</Label>
                                        <div className="relative group">
                                            <Lock className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => updateFormData('password', e.target.value)}
                                                placeholder="حداقل ۶ کاراکتر"
                                                className={cn(
                                                    "pr-10 h-12 border-2 transition-all",
                                                    formData.password && !passwordError && "border-green-500 focus:border-green-500",
                                                    passwordError && "border-destructive focus:border-destructive",
                                                    !formData.password && "focus:border-gold focus:ring-gold/20"
                                                )}
                                                dir="ltr"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {/* Password Error Message */}
                                        <AnimatePresence mode="wait">
                                            {passwordError && (
                                                <motion.p
                                                    key="password-error"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-xs text-destructive"
                                                >
                                                    {passwordError}
                                                </motion.p>
                                            )}
                                            {formData.password && !passwordError && (
                                                <motion.p
                                                    key="password-success"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-xs text-green-600 dark:text-green-500"
                                                >
                                                    ✓ رمز عبور قوی است
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-semibold">تکرار رمز عبور</Label>
                                        <div className="relative group">
                                            <Lock className="absolute right-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                                placeholder="تکرار رمز عبور"
                                                className={cn(
                                                    "pr-10 h-12 border-2 transition-all",
                                                    formData.confirmPassword && !confirmPasswordError && "border-green-500 focus:border-green-500",
                                                    confirmPasswordError && "border-destructive focus:border-destructive",
                                                    !formData.confirmPassword && "focus:border-gold focus:ring-gold/20"
                                                )}
                                                dir="ltr"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {/* Confirm Password Error Message */}
                                        <AnimatePresence mode="wait">
                                            {confirmPasswordError && (
                                                <motion.p
                                                    key="confirm-error"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-xs text-destructive"
                                                >
                                                    {confirmPasswordError}
                                                </motion.p>
                                            )}
                                            {formData.confirmPassword && !confirmPasswordError && (
                                                <motion.p
                                                    key="confirm-success"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="text-xs text-green-600 dark:text-green-500"
                                                >
                                                    ✓ رمز عبور مطابقت دارد
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-border/50" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-3 text-muted-foreground font-medium">
                                                یا ثبت‌نام با
                                            </span>
                                        </div>
                                    </div>

                                    {/* Google Sign Up */}
                                    <Button
                                        type="button"
                                        size="lg"
                                        className="w-full h-12 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                                        onClick={async () => {
                                            setIsLoading(true)
                                            try {
                                                await signInWithGoogle()
                                            } catch {
                                                setError('خطا در ثبت‌نام با Google')
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
                                        ثبت‌نام با Google
                                    </Button>
                                </motion.div>
                            )}

                            {/* Step 2: Profile Setup - Beautiful & Clean */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5"
                                >
                                    {/* Username Input */}
                                    <UsernameInput
                                        value={formData.username}
                                        onChange={(value) => updateFormData('username', value)}
                                        onValidationChange={setIsUsernameValid}
                                        autoFocus
                                        required
                                    />

                                    {/* Gender Selection - Beautiful Compact Buttons */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">جنسیت</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'male', label: 'مرد', icon: '👨' },
                                                { value: 'female', label: 'زن', icon: '👩' },
                                                { value: 'prefer_not_to_say', label: 'نمیگم', icon: '🙋' }
                                            ].map(({ value, label, icon }) => (
                                                <Button
                                                    key={value}
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => updateFormData('gender', value)}
                                                    disabled={isLoading}
                                                    className={cn(
                                                        "h-auto py-3 flex flex-col items-center gap-1.5 border-2 transition-all",
                                                        formData.gender === value
                                                            ? "border-gold bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg shadow-gold/30 hover:from-gold-600 hover:to-gold-700"
                                                            : "border-border hover:border-gold/50 hover:bg-muted/50"
                                                    )}
                                                >
                                                    <span className="text-2xl">{icon}</span>
                                                    <span className="text-xs font-semibold">{label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Birth Date - Fast Inline Iranian Calendar */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">تاریخ تولد (شمسی)</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Year - First in RTL */}
                                            <select
                                                value={formData.birthDate ? new Date(formData.birthDate).getFullYear() : ''}
                                                onChange={(e) => {
                                                    const year = parseInt(e.target.value)
                                                    const current = formData.birthDate || new Date(2000, 0, 1)
                                                    const newDate = new Date(year, current.getMonth(), current.getDate())
                                                    updateFormData('birthDate', newDate)
                                                }}
                                                className="h-12 border-2 rounded-md px-3 focus:border-gold focus:ring-gold/20 transition-all bg-background"
                                                disabled={isLoading}
                                                required
                                            >
                                                <option value="">سال</option>
                                                {Array.from({ length: 60 }, (_, i) => 1403 - i).map(year => (
                                                    <option key={year} value={year + 621}>{year}</option>
                                                ))}
                                            </select>

                                            {/* Month - Middle */}
                                            <select
                                                value={formData.birthDate ? new Date(formData.birthDate).getMonth() + 1 : ''}
                                                onChange={(e) => {
                                                    const month = parseInt(e.target.value) - 1
                                                    const current = formData.birthDate || new Date(2000, 0, 1)
                                                    const newDate = new Date(current.getFullYear(), month, current.getDate())
                                                    updateFormData('birthDate', newDate)
                                                }}
                                                className="h-12 border-2 rounded-md px-3 focus:border-gold focus:ring-gold/20 transition-all bg-background"
                                                disabled={isLoading}
                                                required
                                            >
                                                <option value="">ماه</option>
                                                {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'].map((month, i) => (
                                                    <option key={i} value={i + 1}>{month}</option>
                                                ))}
                                            </select>

                                            {/* Day - Last */}
                                            <select
                                                value={formData.birthDate ? new Date(formData.birthDate).getDate() : ''}
                                                onChange={(e) => {
                                                    const day = parseInt(e.target.value)
                                                    const current = formData.birthDate || new Date(2000, 0, 1)
                                                    const newDate = new Date(current.getFullYear(), current.getMonth(), day)
                                                    updateFormData('birthDate', newDate)
                                                }}
                                                className="h-12 border-2 rounded-md px-3 focus:border-gold focus:ring-gold/20 transition-all bg-background"
                                                disabled={isLoading}
                                                required
                                            >
                                                <option value="">روز</option>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            تاریخ تولد خود را با تقویم شمسی وارد کنید
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Choose Avatar */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <AvatarSelector
                                        selected={formData.avatar}
                                        onSelect={(avatar) => updateFormData('avatar', avatar)}
                                        userName={formData.fullName}
                                        googlePhotoUrl={googlePhotoUrl}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={handlePrevious}
                                    disabled={isLoading}
                                    className="flex-1 h-12 font-medium border-2 hover:bg-muted/50 transition-colors"
                                >
                                    <ArrowRight className="ml-2 size-5" />
                                    قبلی
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className={`${currentStep > 1 ? 'flex-1' : 'w-full'} h-12 bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 hover:from-gold-600 hover:via-gold-700 hover:to-gold-600 text-white font-semibold shadow-lg shadow-gold-500/30 hover:shadow-xl hover:shadow-gold-500/40 transition-all duration-300`}
                                >
                                    بعدی
                                    <ArrowLeft className="mr-2 size-5" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className={`${currentStep > 1 ? 'flex-1' : 'w-full'} h-12 bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 hover:from-gold-600 hover:via-gold-700 hover:to-gold-600 text-white font-semibold shadow-lg shadow-gold-500/30 hover:shadow-xl hover:shadow-gold-500/40 transition-all duration-300`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="ml-2 size-5 animate-spin" />
                                            در حال ثبت‌نام...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="ml-2 size-5" />
                                            تکمیل ثبت‌نام
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </form>

                <CardFooter className="flex flex-col space-y-4 pt-4 border-t">
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">قبلاً ثبت‌نام کرده‌اید؟</span>{' '}
                        <Link href="/auth/login" className="text-gold hover:text-gold/80 font-semibold transition-colors">
                            وارد شوید
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
