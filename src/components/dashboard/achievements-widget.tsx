'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Lock, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { useAchievements } from '@/hooks/reader/use-achievements'
import { toPersianNumber } from '@/lib/gamification'
import { cn } from '@/lib/utils'

export function AchievementsWidget() {
  const { achievements, unlockedCount, total, newlyUnlocked } = useAchievements()

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <PartyPopper className="h-5 w-5 text-gold-600 dark:text-gold-400" />
          دستاوردها
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {toPersianNumber(unlockedCount)} از {toPersianNumber(total)} باز شده
          </span>
          <span className="rounded-full bg-gold-500/15 px-3 py-1 text-sm font-bold text-gold-700 dark:text-gold-400">
            {toPersianNumber(unlockedCount)} / {toPersianNumber(total)}
          </span>
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1 rounded-full border border-gold-400/40 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-700 transition-colors hover:bg-gold-500/20 dark:text-gold-400"
            aria-label="گالری کامل دستاوردها"
          >
            گالری دستاوردها
            <ChevronLeft className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="stagger-in grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a, i) => {
          const isNew = newlyUnlocked.includes(a.id)
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-4 text-center shadow-sm transition-[transform,opacity,colors,border-color,background-color]',
                a.unlocked
                  ? 'border-gold-400/50 bg-gradient-to-br from-gold-500/10 to-transparent'
                  : 'border-border/60 bg-card/50',
              )}
            >
              {a.unlocked && (
                <div
                  className={cn(
                    'pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br opacity-20 blur-xl',
                    a.color,
                  )}
                />
              )}

              {/* New badge */}
              <AnimatePresence>
                {isNew && (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow"
                  >
                    جدید!
                  </motion.span>
                )}
              </AnimatePresence>

              <div className="relative">
                <motion.div
                  className={cn(
                    'mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl',
                    a.unlocked
                      ? `bg-gradient-to-br ${a.color} shadow-lg`
                      : 'bg-muted grayscale',
                  )}
                  animate={
                    a.unlocked
                      ? { y: [0, -3, 0] }
                      : {}
                  }
                  transition={{
                    duration: 3,
                    repeat: a.unlocked ? Infinity : 0,
                    delay: i * 0.2,
                  }}
                >
                  {a.unlocked ? (
                    <span>{a.icon}</span>
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                </motion.div>

                <h3
                  className={cn(
                    'text-sm font-bold leading-tight',
                    !a.unlocked && 'text-muted-foreground',
                  )}
                >
                  {a.title}
                </h3>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {a.description}
                </p>

                {/* Progress for locked */}
                {!a.unlocked && a.progress !== undefined && a.progress > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {toPersianNumber(Math.round(a.progress))}٪
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
