import ProfileSettings from '@/components/profile/profile-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'تنظیمات پروفایل | کتاب‌یار',
  description: 'ویرایش پروفایل، تغییر آواتار و نام کاربری',
  robots: {
    index: false,
    follow: false
  }
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/settings')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">تنظیمات پروفایل</h1>
        <p className="text-muted-foreground">
          اطلاعات پروفایل خود را ویرایش کنید
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات شخصی</CardTitle>
          <CardDescription>
            آواتار، نام کاربری و نام کامل خود را تغییر دهید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettings user={user} profile={profile} />
        </CardContent>
      </Card>
    </div>
  )
}
