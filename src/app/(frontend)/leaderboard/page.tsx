import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client'
import type { Metadata } from 'next'
import { NextRequest } from 'next/server'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'لیدربورد — رتبه‌بندی خوانندگان',
  description:
    'رتبه‌بندی برترین خوانندگان کتاب‌یار — امروز، این هفته، این ماه، امسال و همه‌زمان‌ها. با مطالعه روزانه XP جمع کنید و وارد فهرست برترین‌ها شوید.',
  keywords: [
    'لیدربورد کتاب‌یار',
    'رتبه‌بندی خوانندگان',
    'برترین خوانندگان',
    'امتیاز مطالعه',
    'XP',
    'سطح کتاب‌یار',
    'رقابت مطالعه',
    'leaderboard',
  ],
  alternates: { canonical: `${SITE.url}/leaderboard` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/leaderboard`,
    title: 'لیدربورد کتاب‌یار — رتبه‌بندی خوانندگان',
    description:
      'رتبه‌بندی برترین خوانندگان کتاب‌یار در دوره‌های روزانه، هفتگی، ماهانه، سالانه و همه‌زمان‌ها.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Leaderboard&subtitle=Top%20readers',
        width: 1200,
        height: 630,
        alt: 'لیدربورد کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'لیدربورد کتاب‌یار',
    description: 'رتبه‌بندی برترین خوانندگان کتاب‌یار در دوره‌های مختلف.',
    images: ['/api/og?title=Leaderboard&subtitle=Top%20readers'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime'

interface LeaderboardEntry {
  rank: number
  ownerId: string
  name: string
  avatar: string
  xpGained: number
  pagesRead: number
  totalXP: number
  level: number
  levelTitle: string
  isCurrentUser: boolean
  rankChange: number
}

interface LeaderboardResponse {
  period: Period
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  currentUserRankChange: number
  totalUsers: number
}

async function fetchInitial(period: Period): Promise<LeaderboardResponse | null> {
  try {
    // H-18: import the route handler directly instead of issuing a self-HTTP
    // fetch to `http://localhost:3000/api/leaderboard`. A self-fetch (a)
    // doubles latency (the request re-enters Next's edge runtime + re-runs
    // auth/cookies/rate-limit middleware), (b) breaks if the base URL is
    // mis-configured (NEXT_PUBLIC_APP_URL pointing at a different host, or
    // server-side firewall blocking localhost), and (c) bypasses request-
    // scoped context (e.g. cookies, draft mode, revalidate tags). Direct
    // handler invocation keeps everything in-process.
    const { GET } = await import('@/app/api/leaderboard/route')
    const url = new URL(`/api/leaderboard?period=${period}`, SITE.url)
    const req = new NextRequest(url)
    const res = await GET(req)
    if (!res.ok) return null
    return (await res.json()) as LeaderboardResponse
  } catch {
    return null
  }
}

export default async function LeaderboardPage() {
  const initial = await fetchInitial('weekly')
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          لیدربورد کتاب‌یار
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          با مطالعه روزانه XP جمع کن، سطح بگیر و وارد فهرست برترین‌ها شو. هرچه
          استمرار بیشتر، امتیاز بیشتر.
        </p>
      </header>
      <LeaderboardClient initialPeriod="weekly" initialData={initial} />
    </div>
  )
}
