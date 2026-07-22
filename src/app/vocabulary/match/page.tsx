import { MatchGameClient } from '@/components/vocabulary/match-game-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'بازی تطبیق کلمات — انگلیسی را به فارسی وصل کن',
  description:
    'کلمات انگلیسی را به ترجمه فارسی‌شان وصل کن. هر جفت درست XP می‌آورد و با زنجیره درست، ضریب امتیاز بالا می‌رود!',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MatchGamePage() {
  return <MatchGameClient />
}
