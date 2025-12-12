"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"

interface StreakFlameProps {
    days: number
    size?: "sm" | "md" | "lg"
    animated?: boolean
    className?: string
}

export function StreakFlame({
    days,
    size = "md",
    animated = true,
    className
}: StreakFlameProps) {
    const sizes = {
        sm: { container: "w-12 h-12", icon: "w-6 h-6", text: "text-sm" },
        md: { container: "w-16 h-16", icon: "w-8 h-8", text: "text-base" },
        lg: { container: "w-24 h-24", icon: "w-12 h-12", text: "text-xl" },
    }

    const flameColor = days >= 30
        ? "text-orange-500"
        : days >= 7
            ? "text-orange-400"
            : "text-orange-300"

    return (
        <motion.div
            animate={animated ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={cn("relative inline-flex items-center justify-center", className)}
        >
            <div className={cn(
                "relative flex items-center justify-center",
                sizes[size].container
            )}>
                <Flame className={cn(sizes[size].icon, flameColor, "drop-shadow-lg")} />
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                        "absolute -bottom-1 font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 px-2 py-0.5 rounded-full shadow-md",
                        sizes[size].text
                    )}
                >
                    {days}
                </motion.span>
            </div>
        </motion.div>
    )
}

interface StreakLostProps {
    onRestart?: () => void
}

export function StreakLost({ onRestart }: StreakLostProps) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg"
        >
            <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
            >
                <Flame className="w-16 h-16 text-gray-400" />
            </motion.div>
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Streak Lost
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't worry! Start a new streak today.
                </p>
            </div>
            {onRestart && (
                <button
                    onClick={onRestart}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-md"
                >
                    Start New Streak
                </button>
            )}
        </motion.div>
    )
}
