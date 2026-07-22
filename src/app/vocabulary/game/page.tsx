import { VocabGameClient } from '@/components/vocabulary/vocab-game-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'بازی واژگان',
  description: 'با بازی کردن، واژگان را یاد بگیر و XP بگیر!',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VocabGamePage() {
  return <VocabGameClient />
}
