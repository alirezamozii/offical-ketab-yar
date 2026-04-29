'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { motion } from 'framer-motion'
import { Bell, Flame, Mail, Save, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface NotificationSettingsProps {
    userId: string
    userEmail: string
}

function NotificationSettings({ userId, userEmail }: NotificationSettingsProps) {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        readingReminders: true,
        reminderTime: '20:00',
        streakAlerts: true,
        achievementNotifications: true,
        weeklyReport: false,
    })
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Load settings from localStorage (mock)
    useEffect(() => {
        const saved = localStorage.getItem(`notification-settings-${userId}`)
        if (saved) {
            setSettings(JSON.parse(saved))
        }
    }, [userId])

    const handleChange = (key: string, value: string | boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            localStorage.setItem(`notification-settings-${userId}`, JSON.stringify(settings))
            await new Promise(resolve => setTimeout(resolve, 500))

            toast.success('تنظیمات اعلان‌ها ذخیره شد')
            setHasChanges(false)
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('خطا در ذخیره تنظیمات')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="size-5 text-gold" />
                        <CardTitle>اعلان‌های ایمیل</CardTitle>
                    </div>
                    <CardDescription>
                        دریافت اعلان‌ها از طریق ایمیل: {userEmail}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>فعال‌سازی اعلان‌های ایمیل</Label>
                            <p className="text-sm text-muted-foreground">
                                دریافت اطلاعیه‌های مهم از طریق ایمیل
                            </p>
                        </div>
                        <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>گزارش هفتگی</Label>
                            <p className="text-sm text-muted-foreground">
                                خلاصه فعالیت‌های هفتگی شما
                            </p>
                        </div>
                        <Switch
                            checked={settings.weeklyReport}
                            onCheckedChange={(checked) => handleChange('weeklyReport', checked)}
                            disabled={!settings.emailNotifications}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Reading Reminders */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="size-5 text-gold" />
                        <CardTitle>یادآوری مطالعه</CardTitle>
                    </div>
                    <CardDescription>
                        یادآوری روزانه برای ادامه مطالعه
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>فعال‌سازی یادآوری</Label>
                            <p className="text-sm text-muted-foreground">
                                یادآوری روزانه برای حفظ استریک
                            </p>
                        </div>
                        <Switch
                            checked={settings.readingReminders}
                            onCheckedChange={(checked) => handleChange('readingReminders', checked)}
                        />
                    </div>

                    {settings.readingReminders && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label>زمان یادآوری</Label>
                                <Select
                                    value={settings.reminderTime}
                                    onValueChange={(value) => handleChange('reminderTime', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="08:00">صبح (۸:۰۰)</SelectItem>
                                        <SelectItem value="12:00">ظهر (۱۲:۰۰)</SelectItem>
                                        <SelectItem value="18:00">عصر (۱۸:۰۰)</SelectItem>
                                        <SelectItem value="20:00">شب (۲۰:۰۰)</SelectItem>
                                        <SelectItem value="22:00">شب (۲۲:۰۰)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    یادآوری در این ساعت ارسال می‌شود
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Streak Alerts */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Flame className="size-5 text-orange-500" />
                        <CardTitle>هشدارهای استریک</CardTitle>
                    </div>
                    <CardDescription>
                        اعلان‌های مربوط به استریک روزانه شما
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>هشدار خطر از دست دادن استریک</Label>
                            <p className="text-sm text-muted-foreground">
                                اگر امروز مطالعه نکرده‌اید، یادآوری دریافت کنید
                            </p>
                        </div>
                        <Switch
                            checked={settings.streakAlerts}
                            onCheckedChange={(checked) => handleChange('streakAlerts', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Achievement Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="size-5 text-gold" />
                        <CardTitle>اعلان دستاوردها</CardTitle>
                    </div>
                    <CardDescription>
                        اطلاع‌رسانی هنگام کسب دستاوردهای جدید
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>اعلان دستاوردهای جدید</Label>
                            <p className="text-sm text-muted-foreground">
                                هنگام کسب دستاورد جدید به شما اطلاع داده شود
                            </p>
                        </div>
                        <Switch
                            checked={settings.achievementNotifications}
                            onCheckedChange={(checked) => handleChange('achievementNotifications', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            {hasChanges && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky bottom-4"
                >
                    <Card className="border-gold/30 bg-gradient-to-r from-gold/10 to-transparent">
                        <CardContent className="flex items-center justify-between p-4">
                            <p className="text-sm text-muted-foreground">
                                شما تغییراتی ایجاد کرده‌اید
                            </p>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                variant="bronze"
                            >
                                {isSaving ? (
                                    <>
                                        <Save className="ml-2 size-4 animate-pulse" />
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    <>
                                        <Save className="ml-2 size-4" />
                                        ذخیره تغییرات
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    )
}
