'use client'

import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BookOpen, Flame, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface StreakWarningProps {
    streakDays: number
    lastReadDate: Date
    onDismiss?: () => void
}

function StreakWarning({ streakDays, lastReadDate, onDismiss }: StreakWarningProps) {
    const [show, setShow] = useState(false)
    const [hoursLeft, setHoursLeft] = useState(0)

    useEffect(() => {
        // Calculate hours left until streak expires
        const now = new Date()
        const lastRead = new Date(lastReadDate)
        const hoursSinceLastRead = (now.getTime() - lastRead.getTime()) / (1000 * 60 * 60)
        const hoursRemaining = Math.max(0, 24 - hoursSinceLastRead)

        setHoursLeft(Math.floor(hoursRemaining))

        // Show warning if less than 6 hours left
        if (hoursRemaining > 0 && hoursRemaining < 6 && streakDays > 0) {
            setShow(true)
        }
    }, [lastReadDate, streakDays])

    const handleDismiss = () => {
        setShow(false)
        onDismiss?.()
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
                >
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-2xl border-2 border-orange-400 overflow-hidden">
                        {/* Animated Background */}
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-red-400/20"
                        />

                        {/* Content */}
                        <div className="relative p-6">
                            <div className="flex items-start gap-4">
                                {/* Animated Flame */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, -10, 10, 0],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatDelay: 0.5,
                                    }}
                                    className="flex-shrink-0"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-50" />
                                        <div className="relative w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <Flame className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Message */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                        <h3 className="font-bold text-white text-lg">
                                            استریک در خطر!
                                        </h3>
                                    </div>

                                    <p className="text-white/90 text-sm mb-4">
                                        استریک {streakDays} روزه شما در {hoursLeft} ساعت آینده از بین می‌رود!
                                        همین الان یک صفحه بخوانید تا استریک خود را حفظ کنید.
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg"
                                        >
                                            <Link href="/library">
                                                <BookOpen className="w-4 h-4 ml-2" />
                                                شروع مطالعه
                                            </Link>
                                        </Button>

                                        <Button
                                            onClick={handleDismiss}
                                            size="sm"
                                            variant="ghost"
                                            className="text-white hover:bg-white/20"
                                        >
                                            بعداً
                                        </Button>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={handleDismiss}
                                    className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                                    <span>زمان باقی‌مانده</span>
                                    <span className="font-bold">{hoursLeft} ساعت</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: `${(hoursLeft / 24) * 100}%` }}
                                        className="h-full bg-white rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Toast-style notification (smaller, less intrusive)
function StreakWarningToast({ streakDays, hoursLeft }: { streakDays: number; hoursLeft: number }) {
    const [show, setShow] = useState(true)

    useEffect(() => {
        // Auto-dismiss after 10 seconds
        const timer = setTimeout(() => setShow(false), 10000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="fixed bottom-6 left-6 z-50 max-w-sm"
                >
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-2xl p-4 border-2 border-orange-400">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                }}
                            >
                                <Flame className="w-6 h-6 text-white" />
                            </motion.div>

                            <div className="flex-1">
                                <p className="text-white font-semibold text-sm">
                                    استریک {streakDays} روزه در خطر!
                                </p>
                                <p className="text-white/80 text-xs">
                                    {hoursLeft} ساعت تا پایان
                                </p>
                            </div>

                            <Button
                                asChild
                                size="sm"
                                className="bg-white text-orange-600 hover:bg-gray-100 h-8 px-3 text-xs font-semibold"
                            >
                                <Link href="/library">
                                    مطالعه
                                </Link>
                            </Button>

                            <button
                                onClick={() => setShow(false)}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
