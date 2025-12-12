'use client'

import { AvatarSelector } from '@/components/auth/avatar-selector'
import { UsernameInput } from '@/components/auth/username-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { type AvatarData } from '@/lib/utils/avatar-utils'
import { motion } from 'framer-motion'
import { AlertCircle, Calendar, CheckCircle2, Loader2, Save, User, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProfileData {
    username: string
    firstName: string
    lastName: string
    birthDate: Date | null
    birthDateJalali: string
    gender: 'male' | 'female' | 'prefer_not_to_say' | ''
    avatar: AvatarData
    bio: string
    website: string
}

export default function ProfileSettingsPage() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useSupabaseAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isUsernameValid, setIsUsernameValid] = useState(true)

    const [profileData, setProfileData] = useState<ProfileData>({
        username: '',
        firstName: '',
        lastName: '',
        birthDate: null,
        birthDateJalali: '',
        gender: '',
        avatar: { type: 'preset', presetId: 1 },
        bio: '',
        website: '',
    })

    const [originalUsername, setOriginalUsername] = useState('')

    // Load profile data
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login')
            return
        }

        if (user) {
            loadProfile()
        }
    }, [user, authLoading, router])

    const loadProfile = async () => {
        try {
            const response = await fetch('/api/profile/update')
            const data = await response.json()

            if (data.success && data.profile) {
                const profile = data.profile

                setProfileData({
                    username: profile.username || '',
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    birthDate: profile.birth_date ? new Date(profile.birth_date) : null,
                    birthDateJalali: profile.birth_date_jalali || '',
                    gender: profile.gender || '',
                    avatar: {
                        type: profile.avatar_type || 'preset',
                        presetId: profile.avatar_preset_id || 1,
                        customUrl: profile.avatar_custom_url || undefined,
                    },
                    bio: profile.bio || '',
                    website: profile.website || '',
                })

                setOriginalUsername(profile.username || '')
            }
        } catch (err) {
            console.error('Error loading profile:', err)
            setError('خطا در بارگذاری پروفایل')
        } finally {
            setIsLoading(false)
        }
    }

    const updateProfileData = (field: keyof ProfileData, value: any) => {
        setProfileData(prev => ({ ...prev, [field]: value }))
        setError('')
        setSuccess('')
    }

    const handleSave = async () => {
        setError('')
        setSuccess('')

        // Validate username if changed
        if (profileData.username !== originalUsername && !isUsernameValid) {
            setError('نام کاربری معتبر نیست یا قبلاً گرفته شده است')
            return
        }

        setIsSaving(true)

        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: profileData.username !== originalUsername ? profileData.username : undefined,
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    birthDate: profileData.birthDate,
                    birthDateJalali: profileData.birthDateJalali,
                    gender: profileData.gender,
                    avatar: profileData.avatar,
                    bio: profileData.bio,
                    website: profileData.website,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'خطا در به‌روزرسانی پروفایل')
            }

            setSuccess('پروفایل با موفقیت به‌روزرسانی شد')
            setOriginalUsername(profileData.username)

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطایی رخ داد'
            setError(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-gold/5 py-8">
            <div className="container max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">تنظیمات پروفایل</h1>
                        <p className="text-muted-foreground mt-2">
                            اطلاعات پروفایل خود را ویرایش کنید
                        </p>
                    </div>

                    {/* Success/Error Alerts */}
                    {success && (
                        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                            <CheckCircle2 className="size-4 text-green-600" />
                            <AlertDescription className="text-green-600">
                                {success}
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Avatar Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="size-5" />
                                تصویر پروفایل
                            </CardTitle>
                            <CardDescription>
                                تصویر پروفایل خود را تغییر دهید
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AvatarSelector
                                selected={profileData.avatar}
                                onSelect={(avatar) => updateProfileData('avatar', avatar)}
                                userName={`${profileData.firstName} ${profileData.lastName}`.trim()}
                            />
                        </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="size-5" />
                                اطلاعات پایه
                            </CardTitle>
                            <CardDescription>
                                نام و نام کاربری خود را ویرایش کنید
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">نام</Label>
                                    <Input
                                        id="firstName"
                                        value={profileData.firstName}
                                        onChange={(e) => updateProfileData('firstName', e.target.value)}
                                        placeholder="نام"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">نام خانوادگی</Label>
                                    <Input
                                        id="lastName"
                                        value={profileData.lastName}
                                        onChange={(e) => updateProfileData('lastName', e.target.value)}
                                        placeholder="نام خانوادگی"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <UsernameInput
                                value={profileData.username}
                                onChange={(value) => updateProfileData('username', value)}
                                onValidationChange={setIsUsernameValid}
                                label="نام کاربری"
                            />

                            {profileData.username !== originalUsername && (
                                <p className="text-xs text-muted-foreground">
                                    💡 تغییر نام کاربری ممکن است بر لینک‌های اشتراک‌گذاری شده تأثیر بگذارد
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Personal Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="size-5" />
                                اطلاعات شخصی
                            </CardTitle>
                            <CardDescription>
                                تاریخ تولد و جنسیت خود را ویرایش کنید
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <JalaliDatePicker
                                value={profileData.birthDate}
                                onChange={(date) => updateProfileData('birthDate', date)}
                                label="تاریخ تولد"
                                required={false}
                            />

                            <div className="space-y-2">
                                <Label>جنسیت</Label>
                                <RadioGroup
                                    value={profileData.gender}
                                    onValueChange={(value) => updateProfileData('gender', value)}
                                >
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="male" id="male-edit" />
                                        <Label htmlFor="male-edit" className="cursor-pointer">مرد</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="female" id="female-edit" />
                                        <Label htmlFor="female-edit" className="cursor-pointer">زن</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="prefer_not_to_say" id="prefer-edit" />
                                        <Label htmlFor="prefer-edit" className="cursor-pointer">ترجیح می‌دهم نگویم</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bio & Website */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-5" />
                                درباره من
                            </CardTitle>
                            <CardDescription>
                                بیوگرافی و وبسایت خود را اضافه کنید
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bio">بیوگرافی</Label>
                                <Textarea
                                    id="bio"
                                    value={profileData.bio}
                                    onChange={(e) => updateProfileData('bio', e.target.value)}
                                    placeholder="چند خط درباره خودتان بنویسید..."
                                    rows={4}
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground text-left" dir="ltr">
                                    {profileData.bio.length}/500
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">وبسایت</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={profileData.website}
                                    onChange={(e) => updateProfileData('website', e.target.value)}
                                    placeholder="https://example.com"
                                    dir="ltr"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || (profileData.username !== originalUsername && !isUsernameValid)}
                            className="flex-1 bg-gold hover:bg-gold/90"
                            size="lg"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="ml-2 size-5 animate-spin" />
                                    در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <Save className="ml-2 size-5" />
                                    ذخیره تغییرات
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                            disabled={isSaving}
                            size="lg"
                        >
                            انصراف
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
