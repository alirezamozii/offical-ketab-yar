import { ListenGameClient } from '@/components/vocabulary/listen-game-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'بازی شنیداری — تلفظ را بشنو و بنویس',
  description:
    'کلمه را با تلفظ انگلیسی گوش کن و املای درست را تایپ کن. با هر پاسخ درست XP بگیر!',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ListenGamePage() {
  return <ListenGameClient />
}
