import { SpellGameClient } from '@/components/vocabulary/spell-game-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'بازی هجی‌کردن — املای کلمه را بنویس',
  description:
    'معنی فارسی را ببین و املای درست انگلیسی را تایپ کن. با هر پاسخ درست XP بگیر!',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SpellGamePage() {
  return <SpellGameClient />
}
