'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { xpForNextLevel, xpProgressInLevel, xpProgressPercentage } from '@/types/gamification'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface XPDisplayProps {
  currentXP: number
  level: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function XPDisplay({
  currentXP,
  level,
  className,
  showLabel = true,
  size = 'md'
}: XPDisplayProps) {
  const xpNeeded = xpForNextLevel(level)
  const xpInLevel = xpProgressInLevel(currentXP, level)
  const progressPercent = xpProgressPercentage(currentXP, level)

  const sizeClasses = {
    sm: {
      badge: 'w-8 h-8 text-xs',
      text: 'text-xs',
      icon: 'w-3 h-3',
      progress: 'h-1'
    },
    md: {
      badge: 'w-10 h-10 text-sm',
      text: 'text-xs',
      icon: 'w-3 h-3',
      progress: 'h-1.5'
    },
    lg: {
      badge: 'w-12 h-12 text-base',
      text: 'text-sm',
      icon: 'w-4 h-4',
      progress: 'h-2'
    }
  }

  const sizes = sizeClasses[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3', className)}
    >
      {/* Level Badge */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8956A] text-white font-bold shadow-lg cursor-pointer',
          sizes.badge
        )}
        title={`سطح ${level}`}
      >
        {level}
      </motion.div>

      {/* XP Progress */}
      <div className="flex-1 min-w-[120px]">
        {showLabel && (
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Zap className={cn('text-[#D4AF37]', sizes.icon)} />
              <span className={cn('font-medium', sizes.text)}>
                {xpInLevel.toLocaleString('fa-IR')} XP
              </span>
            </div>
            <span className={cn('text-muted-foreground', sizes.text)}>
              {xpNeeded.toLocaleString('fa-IR')} XP
            </span>
          </div>
        )}
        <Progress
          value={progressPercent}
          className={cn('bg-muted', sizes.progress)}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A961]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </Progress>
        {showLabel && (
          <p className={cn('text-muted-foreground mt-1 text-center', sizes.text)}>
            {Math.floor(progressPercent)}% تا سطح بعدی
          </p>
        )}
      </div>
    </motion.div>
  )
}
