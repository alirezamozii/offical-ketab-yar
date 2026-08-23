import { SITE } from '@/lib/site'
import { SentenceGameClient } from '@/components/vocabulary/sentence-game-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: `${SITE.url}/vocabulary/sentence` },
  title: 'بازی جمله‌سازی — کلمات را بچین و جمله بساز',
  description:
    'ترجمه فارسی را ببین، کلمات انگلیسی را به ترتیب درست بچین تا جمله بسازی. هر جمله درست XP می‌آورد!',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SentenceGamePage() {
  return <SentenceGameClient />
}
