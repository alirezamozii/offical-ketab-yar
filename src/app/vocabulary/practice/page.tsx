import { PracticeClient } from '@/components/vocabulary/practice-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تمرین واژگان',
  description: 'با فلش‌کارت و آزمون چندگزینه‌ای، واژگان ذخیره‌شده را تمرین کنید.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VocabularyPracticePage() {
  return <PracticeClient />
}
