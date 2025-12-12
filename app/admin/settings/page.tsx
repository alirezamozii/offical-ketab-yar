'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AdminSettings {
    site_maintenance: { enabled: boolean; message: string }
    registration_enabled: { enabled: boolean }
    max_free_books: { count: number }
    vocabulary_limit_free: { count: number }
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<AdminSettings>({
        site_maintenance: { enabled: false, message: '' },
        registration_enabled: { enabled: true },
        max_free_books: { count: 3 },
        vocabulary_limit_free: { count: 20 },
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/settings')
            const data = await response.json()
            if (data.success) {
                setSettings(data.settings)
            }
        } catch (error) {
            toast.error('خطا در بارگذاری تنظیمات')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })

            if (response.ok) {
                toast.success('تنظیمات ذخیره شد')
            } else {
                toast.error('خطا در ذخیره تنظیمات')
            }
        } catch (error) {
            toast.error('خطا در ذخیره تنظیمات')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8" dir="rtl">
                <div className="text-center py-12">در حال بارگذاری...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-8" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">⚙️ تنظیمات</h1>
                    <p className="text-muted-foreground">مدیریت تنظیمات سایت</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 ml-2" />
                    {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Site Maintenance */}
                <Card>
                    <CardHeader>
                        <CardTitle>حالت تعمیر و نگهداری</CardTitle>
                        <CardDescription>
                            فعال کردن حالت تعمیر و نگهداری سایت (کاربران نمی‌توانند وارد شوند)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="maintenance">فعال کردن حالت تعمیر</Label>
                            <Switch
                                id="maintenance"
                                checked={settings.site_maintenance.enabled}
                                onCheckedChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        site_maintenance: { ...settings.site_maintenance, enabled: checked },
                                    })
                                }
                            />
                        </div>
                        {settings.site_maintenance.enabled && (
                            <div className="space-y-2">
                                <Label htmlFor="maintenance-message">پیام نمایش داده شده</Label>
                                <Textarea
                                    id="maintenance-message"
                                    placeholder="سایت در حال تعمیر و نگهداری است..."
                                    value={settings.site_maintenance.message}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            site_maintenance: { ...settings.site_maintenance, message: e.target.value },
                                        })
                                    }
                                    rows={3}
                                />
                            </div>
                        )}
                        {settings.site_maintenance.enabled && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <p className="text-sm text-yellow-800">
                                    هشدار: کاربران نمی‌توانند به سایت دسترسی داشته باشند
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Registration */}
                <Card>
                    <CardHeader>
                        <CardTitle>ثبت‌نام کاربران</CardTitle>
                        <CardDescription>مدیریت امکان ثبت‌نام کاربران جدید</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="registration">فعال کردن ثبت‌نام</Label>
                            <Switch
                                id="registration"
                                checked={settings.registration_enabled.enabled}
                                onCheckedChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        registration_enabled: { enabled: checked },
                                    })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Free Books Limit */}
                <Card>
                    <CardHeader>
                        <CardTitle>محدودیت کتاب‌های رایگان</CardTitle>
                        <CardDescription>تعداد کتاب‌هایی که کاربران غیر پرمیوم می‌توانند بخوانند</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="free-books">تعداد کتاب‌های رایگان</Label>
                            <Input
                                id="free-books"
                                type="number"
                                min="0"
                                value={settings.max_free_books.count}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        max_free_books: { count: parseInt(e.target.value) || 0 },
                                    })
                                }
                            />
                            <p className="text-sm text-muted-foreground">
                                کاربران رایگان می‌توانند {settings.max_free_books.count} کتاب بخوانند
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vocabulary Limit */}
                <Card>
                    <CardHeader>
                        <CardTitle>محدودیت واژگان</CardTitle>
                        <CardDescription>تعداد کلماتی که کاربران رایگان می‌توانند ذخیره کنند</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="vocab-limit">تعداد کلمات</Label>
                            <Input
                                id="vocab-limit"
                                type="number"
                                min="0"
                                value={settings.vocabulary_limit_free.count}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        vocabulary_limit_free: { count: parseInt(e.target.value) || 0 },
                                    })
                                }
                            />
                            <p className="text-sm text-muted-foreground">
                                کاربران رایگان می‌توانند {settings.vocabulary_limit_free.count} کلمه ذخیره کنند
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
