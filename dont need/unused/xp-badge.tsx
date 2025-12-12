"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface XPBadgeProps {
    xp: number
    level?: number
    showAnimation?: boolean
    size?: "sm" | "md" | "lg"
    className?: string
}

export function XPBadge({
    xp,
    level,
    showAnimation = false,
    size = "md",
    className
}: XPBadgeProps) {
    const sizes = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
    }

    return (
        <motion.div
            initial={showAnimation ? { scale: 0, opacity: 0 } : false}
            animate={showAnimation ? { scale: 1, opacity: 1 } : false}
            transition={{ type: "spring", duration: 0.5 }}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-white font-semibold shadow-lg shadow-gold-500/30 will-change-transform",
                sizes[size],
                className
            )}
        >
            <Sparkles className="w-4 h-4" />
            <span>{xp} XP</span>
            {level && (
                <>
                    <span className="opacity-50">•</span>
                    <span>Lvl {level}</span>
                </>
            )}
        </motion.div>
    )
}

interface XPRewardProps {
    amount: number
    position?: { x: number; y: number }
    onComplete?: () => void
}

export function XPReward({ amount, position, onComplete }: XPRewardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -50, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={onComplete}
            className="absolute z-50 pointer-events-none"
            style={position ? { left: position.x, top: position.y } : {}}
        >
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xl">
                <Sparkles className="w-5 h-5" />
                +{amount} XP
            </div>
        </motion.div>
    )
}
