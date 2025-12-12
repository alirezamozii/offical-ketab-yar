"use client"

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface FloatingAIButtonProps {
    onClick: () => void
    theme?: 'light' | 'sepia' | 'dark'
    hasUnreadContext?: boolean
}

export function FloatingAIButton({
    onClick,
    theme = 'sepia',
    hasUnreadContext = false
}: FloatingAIButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            className={cn(
                "fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl",
                "flex items-center justify-center",
                "transition-all duration-300",
                theme === 'dark'
                    ? "bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                    : "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            {/* Pulsing ring */}
            <motion.div
                className="absolute inset-0 rounded-full bg-purple-400"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Icon */}
            <Sparkles className="h-6 w-6 text-white relative z-10" />

            {/* Notification dot */}
            {hasUnreadContext && (
                <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            )}

            {/* Tooltip */}
            <div className={cn(
                "absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap",
                "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
            )}>
                دستیار هوشمند
            </div>
        </motion.button>
    )
}
