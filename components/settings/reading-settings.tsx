'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useReadingPreferences } from '@/hooks/use-reading-preferences'
import { motion } from 'framer-motion'
import { BookOpen, Info, Save, Sparkles, Type } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function ReadingSettings() {
    const { preferences, updatePreference } = useReadingPreferences()
    const [fontSize, setFontSize] = useState([16])
    const [lineHeight, setLineHeight] = useState([1.6])
    const [fontFamily, setFontFamily] = useState('vazirmatn')
    const [pageAnimation, setPageAnimation] = useState(true)
    const [autoSave, setAutoSave] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // TODO: Save to database
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('تنظیمات با موفقیت ذخیره شد')
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
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Type className="size-5 text-gold" />
                        <CardTitle>تنظیمات متن</CardTitle>
                    </div>
                    <CardDescription>ظاهر متن را برای راحتی بیشتر تنظیم کنید</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Font Family */}
                    <div className="space-y-2">
                        <Label>فونت</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vazirmatn">وزیرمتن (پیش‌فرض)</SelectItem>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="system">فونت سیستم</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Font Size */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>اندازه فونت</Label>
                            <span className="text-sm text-muted-foreground">{fontSize[0]}px</span>
                        </div>
                        <Slider
                            value={fontSize}
                            onValueChange={setFontSize}
                            min={12}
                            max={24}
                            step={1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>کوچک</span>
                            <span>بزرگ</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Line Height */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>فاصله خطوط</Label>
                            <span className="text-sm text-muted-foreground">{lineHeight[0].toFixed(1)}</span>
                        </div>
                        <Slider
                            value={lineHeight}
                            onValueChange={setLineHeight}
                            min={1.2}
                            max={2.4}
                            step={0.1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>فشرده</span>
                            <span>باز</span>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <p
                            style={{
                                fontSize: `${fontSize[0]}px`,
                                lineHeight: lineHeight[0],
                                fontFamily: fontFamily === 'vazirmatn' ? 'var(--font-vazirmatn)' : fontFamily === 'inter' ? 'var(--font-inter)' : 'system-ui',
                            }}
                        >
                            این یک متن نمونه است برای پیش‌نمایش تنظیمات شما. This is a sample text to preview your settings.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BookOpen className="size-5 text-gold" />
                        <CardTitle>تنظیمات خواندن</CardTitle>
                    </div>
                    <CardDescription>رفتار کتاب‌خوان را تنظیم کنید</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>انیمیشن ورق زدن صفحه</Label>
                            <p className="text-sm text-muted-foreground">
                                نمایش انیمیشن هنگام تغییر صفحه
                            </p>
                        </div>
                        <Switch checked={pageAnimation} onCheckedChange={setPageAnimation} />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>ذخیره خودکار پیشرفت</Label>
                            <p className="text-sm text-muted-foreground">
                                ذخیره خودکار صفحه فعلی و پیشرفت خواندن
                            </p>
                        </div>
                        <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gold-200 dark:border-gold-800">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-gold-600" />
                        <CardTitle>انیمیشن ورق زدن واقع‌گرایانه</CardTitle>
                    </div>
                    <CardDescription>تجربه ورق زدن صفحات با فیزیک واقعی</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                            <Label className="text-base font-semibold">
                                فعال‌سازی انیمیشن فیزیکی
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                انیمیشن پیشرفته با حس واقعی کاغذ
                            </p>
                        </div>
                        <Switch
                            checked={preferences.physicsPageTurn}
                            onCheckedChange={(checked) => updatePreference('physicsPageTurn', checked)}
                            className="ml-4"
                        />
                    </div>

                    {preferences.physicsPageTurn && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="p-4 rounded-lg border-2 border-gold-500/30 bg-gold-50 dark:bg-gold-950/20">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="size-5 text-gold-600 dark:text-gold-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gold-700 dark:text-gold-300">
                                            ✨ انیمیشن واقع‌گرایانه فعال است
                                        </p>
                                        <p className="text-xs text-gold-600 dark:text-gold-400 mt-1">
                                            برای ورق زدن صفحه، از هر نقطه‌ای روی صفحه بکشید
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                <Info className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    این ویژگی ممکن است در دستگاه‌های ضعیف باعث کندی شود. در صورت مشاهده مشکل، آن را غیرفعال کنید.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save className="size-4" />
                    {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                </Button>
            </div>
        </motion.div>
    )
}
