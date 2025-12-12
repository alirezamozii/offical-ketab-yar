'use client'

/**
 * XP Progress Bar Component
 * Beautiful animated progress bar for XP and level
 */

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { xpProgressToNextLevel } from '@/lib/utils/gamification'
import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'

interface XPProgressBarProps {
    xp: number
    showDetails?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function XPProgressBar({ xp, showDetails = true, size = 'md', className = '' }: XPProgressBarProps) {
    const progress = xpProgressToNextLevel(xp)

    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    }

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Level and Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="flex items-center gap-1"
                    >
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                        <span className={`font-bold text-[#D4AF37] ${textSizes[size]}`}>
                            سطح {progress.currentLevel}
                        </span>
                    </motion.div>
                    <Badge variant="outline" className="text-[#D4AF37] border-[#D4AF37]/30">
                        {progress.levelTitle}
                    </Badge>
                </div>

                {showDetails && !progress.isMaxLevel && (
                    <span className={`text-muted-foreground ${textSizes[size]}`}>
                        {progress.xpProgress.toLocaleString('fa-IR')} / {progress.xpNeeded.toLocaleString('fa-IR')} XP
                    </span>
                )}

                {progress.isMaxLevel && (
                    <Badge variant="outline" className="text-[#D4AF37] border-[#D4AF37]/30">
                        حداکثر سطح! 🏆
                    </Badge>
                )}
            </div>

            {/* Progress Bar */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="origin-left"
            >
                <Progress
                    value={progress.progressPercentage}
                    className={`${sizeClasses[size]} bg-[#D4AF37]/10`}
                    indicatorClassName="bg-gradient-to-r from-[#D4AF37] to-[#C9A961]"
                />
            </motion.div>

            {/* Details */}
            {showDetails && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{xp.toLocaleString('fa-IR')} XP کل</span>
                    </div>
                    {!progress.isMaxLevel && (
                        <span>
                            {(progress.xpForNextLevel - xp).toLocaleString('fa-IR')} XP تا سطح {progress.nextLevel}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * Compact XP Badge (for header)
 */
export function XPBadge({ xp, className = '' }: { xp: number; className?: string }) {
    const progress = xpProgressToNextLevel(xp)

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 ${className}`}
        >
            <Zap className="h-4 w-4 text-[#D4AF37]" />
            <div className="flex flex-col">
                <span className="text-xs font-bold text-[#D4AF37]">
                    سطح {progress.currentLevel}
                </span>
                <span className="text-[10px] text-muted-foreground">
                    {xp.toLocaleString('fa-IR')} XP
                </span>
            </div>
        </motion.div>
    )
}
