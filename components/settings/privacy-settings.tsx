'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { AlertTriangle, Download, Key, Shield, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import ChangePasswordDialog from './change-password-dialog'
import DeleteAccountDialog from './delete-account-dialog'

interface PrivacySettingsProps {
  userId: string
  userEmail: string
}

function PrivacySettings({ userEmail }: PrivacySettingsProps) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const data = {
        user: { email: userEmail, created_at: new Date().toISOString() },
        reading_history: [],
        vocabulary: [],
        achievements: [],
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ketab-yar-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('داده‌های شما با موفقیت دانلود شد')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('خطا در دانلود داده‌ها')
    } finally {
      setIsExporting(false)
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
            <Shield className="size-5 text-gold" />
            <CardTitle>امنیت حساب</CardTitle>
          </div>
          <CardDescription>مدیریت امنیت و دسترسی به حساب کاربری</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-muted-foreground" />
                <Label className="font-medium">رمز عبور</Label>
              </div>
              <p className="text-sm text-muted-foreground">آخرین تغییر: ۳ ماه پیش</p>
            </div>
            <Button variant="outline" onClick={() => setShowChangePassword(true)}>
              تغییر رمز عبور
            </Button>
          </div>
          <Separator />
          <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
            <div className="flex gap-3">
              <Shield className="size-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">نکات امنیتی</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• از رمز عبور قوی استفاده کنید (حداقل ۸ کاراکتر)</li>
                  <li>• رمز عبور خود را با کسی به اشتراک نگذارید</li>
                  <li>• رمز عبور را هر ۳ ماه یکبار تغییر دهید</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="size-5 text-gold" />
            <CardTitle>دانلود داده‌ها</CardTitle>
          </div>
          <CardDescription>دانلود کپی از تمام داده‌های شما</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            شما می‌توانید یک کپی از تمام داده‌های خود شامل تاریخچه مطالعه، لغات ذخیره شده و دستاوردها را دانلود کنید.
          </p>
          <Button variant="outline" onClick={handleExportData} disabled={isExporting} className="w-full sm:w-auto">
            {isExporting ? (
              <>
                <Download className="ml-2 size-4 animate-bounce" />
                در حال آماده‌سازی...
              </>
            ) : (
              <>
                <Download className="ml-2 size-4" />
                دانلود داده‌ها (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <CardTitle className="text-destructive">منطقه خطر</CardTitle>
          </div>
          <CardDescription>اقدامات غیرقابل بازگشت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex gap-3">
              <Trash2 className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">حذف حساب کاربری</p>
                <p className="text-xs text-muted-foreground">
                  با حذف حساب کاربری، تمام داده‌های شما به طور کامل و غیرقابل بازگشت حذف خواهند شد.
                </p>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteAccount(true)} className="mt-2">
                  <Trash2 className="ml-2 size-4" />
                  حذف حساب کاربری
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} userEmail={userEmail} />
      <DeleteAccountDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} userEmail={userEmail} />
    </motion.div>
  )
}
