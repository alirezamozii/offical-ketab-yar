'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  cn,
} from '@/lib/utils'
import { getRankColor, getRankEmoji, toPersianNumber } from '@/lib/gamification'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, BookOpen, Crown, Minus, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys, fetchLeaderboard } from '@/lib/api/queries'

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

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 'daily', label: 'امروز' },
  { value: 'weekly', label: 'هفته' },
  { value: 'monthly', label: 'ماه' },
  { value: 'yearly', label: 'سال' },
  { value: 'alltime', label: 'همیشه' },
]

const TOP3_GRADIENTS: Record<number, string> = {
  1: 'from-yellow-500/15 via-amber-400/5 to-transparent',
  2: 'from-gray-400/15 via-slate-300/5 to-transparent',
  3: 'from-orange-600/15 via-orange-400/5 to-transparent',
}

const TOP3_RING: Record<number, string> = {
  1: 'ring-yellow-500',
  2: 'ring-gray-400',
  3: 'ring-orange-600',
}

interface LeaderboardClientProps {
  initialPeriod?: Period
  initialData?: LeaderboardResponse | null
}

export function LeaderboardClient({
  initialPeriod = 'weekly',
  initialData = null,
}: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<Period>(initialPeriod)

  // Phase 3 R-FE.2: migrated from manual fetch+useState to TanStack Query.
  // Gives automatic caching per period, retry, background refetch.
  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: queryKeys.leaderboard(activeTab),
    queryFn: () => fetchLeaderboard(activeTab) as Promise<LeaderboardResponse>,
    initialData: activeTab === initialPeriod ? (initialData ?? undefined) : undefined,
    staleTime: 60_000,
  })

  const data = queryData ?? null

  const currentUser = useMemo(
    () => data?.entries.find((e) => e.isCurrentUser) ?? null,
    [data],
  )

  return (
    <div className="space-y-6">
      {/* Current user's rank card */}
      {data?.currentUserRank != null && currentUser ? (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-2 border-gold-500/40 bg-gradient-to-br from-gold-500/10 via-transparent to-transparent">
            <CardContent className="pt-5 sm:pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={cn(
                      'text-3xl font-extrabold tabular-nums sm:text-4xl',
                      getRankColor(currentUser.rank),
                    )}
                    aria-label={`رتبه ${currentUser.rank}`}
                  >
                    {getRankEmoji(currentUser.rank)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground sm:text-sm">رتبه شما</p>
                    <p className="text-xl font-bold sm:text-2xl">
                      {toPersianNumber(currentUser.rank)}{' '}
                      <span className="text-sm font-medium text-muted-foreground sm:text-base">
                        از {toPersianNumber(data.totalUsers)}
                      </span>
                    </p>
                  </div>
                  <RankChangeChip delta={data.currentUserRankChange} />
                </div>
                <div className="space-y-1 text-start">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-bold text-gold-600 dark:text-gold-400">
                      {toPersianNumber(currentUser.xpGained)} XP
                    </span>
                    <Zap className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground sm:text-sm">
                    <span>{toPersianNumber(currentUser.pagesRead)} صفحه</span>
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            لیدربورد
          </CardTitle>
          <CardDescription>رتبه‌بندی برترین خوانندگان کتاب‌یار</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Period)}>
            <TabsList className="scroll-x-mobile flex h-auto w-full overflow-x-auto rounded-lg p-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
              {PERIODS.map((p) => (
                <TabsTrigger
                  key={p.value}
                  value={p.value}
                  className="min-w-[64px] flex-shrink-0 px-3 py-1.5 text-xs sm:min-w-0 sm:flex-initial sm:text-sm"
                >
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {PERIODS.map((p) => (
              <TabsContent key={p.value} value={p.value} className="mt-6 space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                ) : !data || data.entries.length === 0 ||
                  // Also show empty state when the only entry is the current
                  // user with zero activity — the board is effectively empty.
                  (data.entries.length === 1 &&
                    data.entries[0].isCurrentUser &&
                    data.entries[0].pagesRead === 0 &&
                    data.entries[0].xpGained === 0) ? (
                  <div className="py-12 text-center">
                    <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-gold-500/20 blur-xl"
                      />
                      <Trophy className="relative h-10 w-10 text-gold-500/70" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      هنوز کسی در این بازه فعالیتی نداشته
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      اولین نفر باش و صدر جدول را از آن خود کن!
                    </p>
                    <a
                      href="/library"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-gold-600/30 transition-[transform,opacity,colors,border-color,background-color] hover:shadow-lg hover:shadow-gold-600/40 active:scale-95"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      شروع مطالعه
                    </a>
                  </div>
                ) : p.value === 'weekly' ? (
                  <WeeklyLayout entries={data.entries} />
                ) : (
                  <div className="scroll-brand stagger-in max-h-[640px] space-y-2 overflow-y-auto pe-1">
                    {data.entries.map((entry, idx) => (
                      <LeaderboardRow
                        key={entry.ownerId || `r-${idx}`}
                        entry={entry}
                        delay={idx * 0.04}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

/** Top-3 podium + compact rows for the rest. Used only on the weekly tab. */
function WeeklyLayout({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)
  // Podium order is 2 - 1 - 3 (1st in the center, tallest)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 items-end gap-1.5 sm:gap-4">
        {podiumOrder.map((entry, i) => {
          if (!entry) return <div key={`empty-${i}`} />
          return <PodiumColumn key={entry.ownerId} entry={entry} />
        })}
      </div>
      {rest.length > 0 ? (
        <div className="scroll-brand stagger-in max-h-[640px] space-y-2 overflow-y-auto pe-1">
          {rest.map((entry, idx) => (
            <LeaderboardRow
              key={entry.ownerId || `r-${idx}`}
              entry={entry}
              delay={idx * 0.04}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PodiumColumn({ entry }: { entry: LeaderboardEntry }) {
  const isFirst = entry.rank === 1
  const isSecond = entry.rank === 2
  const isThird = entry.rank === 3
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + entry.rank * 0.1, type: 'spring', stiffness: 180 }}
      className="flex flex-col items-center"
    >
      {/* Crown for #1 */}
      <div className="mb-1 h-6">
        {isFirst && (
          <motion.span
            animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block text-2xl"
          >
            👑
          </motion.span>
        )}
      </div>

      {/* Avatar */}
      <Avatar
        className={cn(
          'ring-2 ring-offset-1 ring-offset-background sm:ring-4 sm:ring-offset-2',
          'h-12 w-12 sm:h-16 sm:w-16',
          isFirst && 'ring-yellow-500',
          isSecond && 'ring-gray-400',
          isThird && 'ring-orange-600',
        )}
      >
        <AvatarFallback
          className={cn(
            'bg-gradient-to-br font-bold text-white',
            isFirst && 'from-yellow-400 to-amber-600 text-sm sm:text-xl',
            isSecond && 'from-gray-300 to-slate-500 text-sm sm:text-xl',
            isThird && 'from-orange-500 to-orange-700 text-sm sm:text-xl',
          )}
        >
          {entry.avatar}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="mt-2 max-w-[90px] truncate text-center text-xs font-bold sm:text-sm">
        {entry.name}
      </p>
      {entry.isCurrentUser ? (
        <Badge
          variant="outline"
          className="mt-0.5 border-gold-500 px-1.5 py-0 text-[9px] text-gold-600 dark:text-gold-400"
        >
          شما
        </Badge>
      ) : null}

      {/* XP badge */}
      <div className="mt-1 flex items-center gap-1">
        <Zap
          className={cn(
            'h-3 w-3',
            isFirst && 'text-yellow-500',
            isSecond && 'text-gray-400',
            isThird && 'text-orange-600',
          )}
        />
        <span className="text-[11px] font-bold tabular-nums">
          {toPersianNumber(entry.xpGained)}
        </span>
      </div>

      {/* Podium pedestal */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.3 + entry.rank * 0.1, type: 'spring', stiffness: 150 }}
        className={cn(
          'mt-2 w-full max-w-[80px] origin-bottom rounded-t-lg bg-gradient-to-b text-center font-extrabold tabular-nums text-white shadow-lg sm:max-w-[100px]',
          isFirst && 'from-yellow-400 to-amber-600 h-14 sm:h-36',
          isSecond && 'from-gray-300 to-slate-500 h-12 sm:h-28',
          isThird && 'from-orange-500 to-orange-700 h-10 sm:h-20',
        )}
      >
        <div className="flex h-full items-center justify-center pt-1 text-lg sm:pt-2 sm:text-3xl">
          {getRankEmoji(entry.rank)}
        </div>
      </motion.div>
    </motion.div>
  )
}

function RankChangeChip({ delta }: { delta: number }) {
  if (!delta) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        بدون تغییر
      </span>
    )
  }
  if (delta > 0) {
    return (
      <motion.span
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
      >
        <ArrowUp className="h-3 w-3" />
        صعود {toPersianNumber(delta)} رتبه
      </motion.span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400">
      <ArrowDown className="h-3 w-3" />
      سقوط {toPersianNumber(Math.abs(delta))} رتبه
    </span>
  )
}

function LeaderboardRow({
  entry,
  delay,
}: {
  entry: LeaderboardEntry
  delay: number
}) {
  const isTopThree = entry.rank <= 3
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-[transform,opacity,colors,border-color,background-color] hover:shadow-md',
        entry.isCurrentUser
          ? 'border-gold-500 bg-gold-500/5'
          : 'border-border',
        isTopThree && 'bg-gradient-to-l',
        isTopThree && TOP3_GRADIENTS[entry.rank],
      )}
    >
      {isTopThree ? (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.18, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className={cn(
              'h-full w-full bg-gradient-to-l to-transparent',
              entry.rank === 1 && 'from-yellow-500/30',
              entry.rank === 2 && 'from-gray-400/30',
              entry.rank === 3 && 'from-orange-600/30',
            )}
          />
        </motion.div>
      ) : null}

      {isTopThree ? (
        <div className="absolute start-2 top-2">
          <Crown
            className={cn(
              'h-5 w-5',
              entry.rank === 1 && 'text-yellow-500',
              entry.rank === 2 && 'text-gray-400',
              entry.rank === 3 && 'text-orange-600',
            )}
          />
        </div>
      ) : null}

      <div className="relative flex items-center gap-2 sm:gap-4">
        <div
          className={cn(
            'min-w-[40px] text-center text-2xl font-extrabold tabular-nums sm:min-w-[56px] sm:text-3xl',
            getRankColor(entry.rank),
          )}
        >
          {getRankEmoji(entry.rank)}
        </div>

        <Avatar
          className={cn(
            'h-10 w-10 sm:h-12 sm:w-12',
            isTopThree && 'ring-2 ring-offset-1 ring-offset-background sm:ring-2 sm:ring-offset-2',
            isTopThree && TOP3_RING[entry.rank],
          )}
        >
          <AvatarFallback className="bg-gradient-to-br from-gold-500 to-gold-700 text-xs font-bold text-white sm:text-sm">
            {entry.avatar}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{entry.name}</p>
            {entry.isCurrentUser ? (
              <Badge
                variant="outline"
                className="border-gold-500 text-gold-600 dark:text-gold-400"
              >
                شما
              </Badge>
            ) : null}
            {!entry.isCurrentUser && entry.rankChange !== 0 ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[10px] font-bold',
                  entry.rankChange > 0 ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {entry.rankChange > 0 ? (
                  <ArrowUp className="h-2.5 w-2.5" />
                ) : (
                  <ArrowDown className="h-2.5 w-2.5" />
                )}
                {toPersianNumber(Math.abs(entry.rankChange))}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            سطح {toPersianNumber(entry.level)} · {entry.levelTitle}
          </p>
        </div>

        <div className="space-y-1 text-start">
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <span className="text-sm font-bold text-gold-600 dark:text-gold-400 sm:text-base">
              {toPersianNumber(entry.xpGained)}
            </span>
            <Zap className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400 sm:h-4 sm:w-4" />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
            <span>{toPersianNumber(entry.pagesRead)} صفحه</span>
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
