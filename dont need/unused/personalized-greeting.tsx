'use client'

import { motion } from 'framer-motion'
import { BookOpen, Coffee, Moon, Sparkles, Sun, Sunrise, Sunset } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PersonalizedGreetingProps {
    userName?: string
    streakDays?: number
    level?: number
    xp?: number
    booksRead?: number
}

export function PersonalizedGreeting({ userName, streakDays = 0, level = 1, xp = 0, booksRead = 0 }: PersonalizedGreetingProps) {
    const [greeting, setGreeting] = useState('')
    const [icon, setIcon] = useState<React.ReactNode>(null)
    const [motivationalMessage, setMotivationalMessage] = useState('')

    useEffect(() => {
        const hour = new Date().getHours()
        let timeGreeting = ''
        let timeIcon: React.ReactNode = null

        // Time-based greeting (Agent 3: Personalization)
        if (hour >= 5 && hour < 12) {
            timeGreeting = 'صبح بخیر'
            timeIcon = <Sunrise className="w-6 h-6 text-orange-400" />
        } else if (hour >= 12 && hour < 14) {
            timeGreeting = 'ظهر بخیر'
            timeIcon = <Sun className="w-6 h-6 text-yellow-500" />
        } else if (hour >= 14 && hour < 18) {
            timeGreeting = 'عصر بخیر'
            timeIcon = <Coffee className="w-6 h-6 text-amber-600" />
        } else if (hour >= 18 && hour < 21) {
            timeGreeting = 'عصر بخیر'
            timeIcon = <Sunset className="w-6 h-6 text-orange-500" />
        } else {
            timeGreeting = 'شب بخیر'
            timeIcon = <Moon className="w-6 h-6 text-blue-400" />
        }

        setGreeting(timeGreeting)
        setIcon(timeIcon)

        // Motivational messages based on streak and level (Agent 3: Psychology)
        const messages = []

        if (streakDays === 0) {
            messages.push('امروز روز عالی برای شروع یک استریک جدید است! 🔥')
        } else if (streakDays < 7) {
            messages.push(`استریک ${streakDays} روزه! به همین روال ادامه بده 💪`)
        } else if (streakDays < 30) {
            messages.push(`وای! استریک ${streakDays} روزه! تو واقعاً عالی هستی! 🌟`)
        } else if (streakDays < 100) {
            messages.push(`استریک ${streakDays} روزه! تو یک افسانه‌ای! 🏆`)
        } else {
            messages.push(`استریک ${streakDays} روزه! تو الهام‌بخش دیگران هستی! 👑`)
        }

        if (level >= 10) {
            messages.push(`سطح ${level}! تو یک استاد واقعی هستی! 🎓`)
        } else if (level >= 5) {
            messages.push(`سطح ${level}! پیشرفت فوق‌العاده‌ای داری! 📈`)
        }

        setMotivationalMessage(messages[Math.floor(Math.random() * messages.length)])

    }, [streakDays, level, xp, booksRead])

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 via-[#C9A961]/10 to-[#B8956A]/10 border border-[#D4AF37]/20 p-6 md:p-8"
        >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-grid-pattern" />
            </div>

            {/* Floating Sparkles */}
            <motion.div
                animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute top-4 right-4"
            >
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </motion.div>

            <motion.div
                animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                }}
                className="absolute bottom-4 left-4"
            >
                <BookOpen className="w-5 h-5 text-[#C9A961]" />
            </motion.div>

            {/* Content */}
            <div className="relative">
                {/* Greeting */}
                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                        }}
                    >
                        {icon}
                    </motion.div>

                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl md:text-3xl font-bold text-foreground"
                        >
                            {greeting}
                            {userName && (
                                <span className="text-[#D4AF37]">، {userName}</span>
                            )}
                            {!userName && <span className="text-[#D4AF37]">!</span>}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-muted-foreground text-sm md:text-base mt-1"
                        >
                            آماده‌ای برای یک روز پر از یادگیری؟
                        </motion.p>
                    </div>
                </div>

                {/* Motivational Message */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-[#D4AF37]/20 to-[#C9A961]/20 rounded-xl p-4 border border-[#D4AF37]/30"
                >
                    <p className="text-sm md:text-base text-foreground/90 font-medium">
                        {motivationalMessage}
                    </p>
                </motion.div>

                {/* Quick Stats */}
                {(streakDays > 0 || level > 1) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-wrap gap-4 mt-4"
                    >
                        {streakDays > 0 && (
                            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 border border-border">
                                <span className="text-2xl">🔥</span>
                                <div>
                                    <div className="text-xs text-muted-foreground">استریک</div>
                                    <div className="text-sm font-bold text-[#D4AF37]">
                                        {streakDays} روز
                                    </div>
                                </div>
                            </div>
                        )}

                        {level > 1 && (
                            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 border border-border">
                                <span className="text-2xl">⭐</span>
                                <div>
                                    <div className="text-xs text-muted-foreground">سطح</div>
                                    <div className="text-sm font-bold text-[#D4AF37]">
                                        {level}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

// Compact version for mobile/small spaces
export function CompactGreeting({ userName }: { userName?: string }) {
    const [greeting, setGreeting] = useState('')

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) setGreeting('صبح بخیر')
        else if (hour >= 12 && hour < 18) setGreeting('روز بخیر')
        else setGreeting('شب بخیر')
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
        >
            <span className="text-lg font-semibold">
                {greeting}
                {userName && <span className="text-[#D4AF37]">، {userName}</span>}
            </span>
            <motion.span
                animate={{ rotate: [0, 20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
                👋
            </motion.span>
        </motion.div>
    )
}
