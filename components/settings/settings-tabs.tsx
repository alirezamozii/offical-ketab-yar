'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, BookOpen, Shield } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Agent 2: Dynamic imports for heavy components
const ReadingSettings = dynamic<{ userId: string }>(
  () => import('./reading-settings'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
)

const NotificationSettings = dynamic<{ userId: string; userEmail: string }>(
  () => import('./notification-settings'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
)

const PrivacySettings = dynamic<{ userId: string; userEmail: string }>(
  () => import('./privacy-settings'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
)

interface SettingsTabsProps {
  userId: string
  userEmail: string
}

function SettingsTabs({ userId, userEmail }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('reading')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="reading" className="gap-2">
          <BookOpen className="size-4" />
          <span className="hidden sm:inline">تنظیمات خواندن</span>
          <span className="sm:hidden">خواندن</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="size-4" />
          <span className="hidden sm:inline">اعلان‌ها</span>
          <span className="sm:hidden">اعلان</span>
        </TabsTrigger>
        <TabsTrigger value="privacy" className="gap-2">
          <Shield className="size-4" />
          <span className="hidden sm:inline">حریم خصوصی</span>
          <span className="sm:hidden">امنیت</span>
        </TabsTrigger>
      </TabsList>

      {/* Reading Settings Tab */}
      <TabsContent value="reading" className="mt-6">
        <ReadingSettings userId={userId} />
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="mt-6">
        <NotificationSettings userId={userId} userEmail={userEmail} />
      </TabsContent>

      {/* Privacy & Security Tab */}
      <TabsContent value="privacy" className="mt-6">
        <PrivacySettings userId={userId} userEmail={userEmail} />
      </TabsContent>
    </Tabs>
  )
}
