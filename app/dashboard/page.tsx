import { Dashboard } from '@/components/dashboard/dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'داشبورد | کتاب‌یار',
  description: 'داشبورد مطالعه شما - پیشرفت، استریک، دستاوردها و تنظیمات',
  robots: {
    index: false, // Agent 1: Block from Google
    follow: false
  }
}

// Pure CSR for dashboard (Agent 2: Zero server load)
// Merged: Profile + Dashboard + Settings
export default function DashboardPage() {
  return <Dashboard />
}
