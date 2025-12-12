'use client'

import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, BookOpen, ChevronLeft, Sparkles, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CompletionCelebrationProps {
    type: 'chapter' | 'book'
    title: string
    xpEarned: number
    pagesRead: number
    onContinue: () => void
    onGoToLibrary?: () => void
}

export function CompletionCelebration({
    type,
    title,
    xpEarned,
    pagesRead,
    onContinue,
    onGoToLibrary,
}: CompletionCelebrationProps) {
    const [show, setShow] = useState(true)
    const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([])

    useEffect(() => {
        // Generate confetti particles
        const particles = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
        }))
        setConfetti(particles)

        // Play celebration sound (Agent 3 - Psychology)
        if (typeof window !== 'undefined') {
            import('@/lib/utils/sound-effects').then(({ soundEffects }) => {
                soundEffects.celebration()
            }).catch(() => {
                // Silently fail if sound effects not available
            })
        }
    }, [])

    const isBook = type === 'book'

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShow(false)
                            onContinue()
                        }
                    }}
                >
                    {/* Confetti */}
                    {confetti.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{ y: -20, opacity: 1 }}
                            animate={{
                                y: window.innerHeight + 20,
                                opacity: [1, 1, 0],
                                rotate: Math.random() * 360,
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                delay: particle.delay,
                                ease: 'easeIn',
                            }}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${particle.x}%`,
                                backgroundColor: ['#D4AF37', '#C9A961', '#B8956A', '#FFD700'][
                                    Math.floor(Math.random() * 4)
                                ],
                            }}
                        />
                    ))}

                    {/* Main Card */}
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 50 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                        className="relative max-w-lg w-full mx-4 bg-gradient-to-br from-[#D4AF37]/20 to-[#B8956A]/20 backdrop-blur-xl p-8 md:p-12 rounded-3xl border-2 border-[#D4AF37]/30 shadow-2xl"
                    >
                        {/* Animated Icon */}
                        <motion.div
                            animate={{
                                rotate: [0, -10, 10, -10, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                            }}
                            className="flex justify-center mb-6"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl opacity-50" />
                                <div className="relative w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#B8956A] rounded-full flex items-center justify-center shadow-2xl">
                                    {isBook ? (
                                        <Trophy className="w-12 h-12 text-white" />
                                    ) : (
                                        <Award className="w-12 h-12 text-white" />
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-4xl font-bold text-center mb-3 text-white"
                        >
                            {isBook ? '🎉 تبریک! کتاب تمام شد! 🎉' : '✨ فصل تمام شد! ✨'}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center text-gray-200 mb-8 text-lg"
                        >
                            {title}
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 gap-4 mb-8"
                        >
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                                <Sparkles className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                                <div className="text-3xl font-bold text-[#D4AF37] mb-1">
                                    +{xpEarned}
                                </div>
                                <div className="text-sm text-gray-300">XP کسب شده</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                                <BookOpen className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                                <div className="text-3xl font-bold text-[#D4AF37] mb-1">
                                    {pagesRead}
                                </div>
                                <div className="text-sm text-gray-300">صفحه خوانده شده</div>
                            </div>
                        </motion.div>

                        {/* Motivational Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-gradient-to-r from-[#D4AF37]/20 to-[#C9A961]/20 rounded-xl p-4 mb-6 border border-[#D4AF37]/30"
                        >
                            <p className="text-center text-white text-sm">
                                {isBook
                                    ? '🌟 شما یک خواننده واقعی هستید! به کتاب بعدی بروید و سفر یادگیری خود را ادامه دهید.'
                                    : '💪 عالی! به همین روال ادامه دهید. هر صفحه شما را به هدفتان نزدیک‌تر می‌کند.'}
                            </p>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-3"
                        >
                            <Button
                                onClick={() => {
                                    setShow(false)
                                    onContinue()
                                }}
                                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:from-[#C9A961] hover:to-[#B8956A] text-white shadow-lg shadow-[#D4AF37]/30 h-12 text-lg font-semibold"
                            >
                                {isBook ? 'به کتابخانه برو' : 'ادامه مطالعه'}
                                <ChevronLeft className="w-5 h-5 mr-2" />
                            </Button>

                            {isBook && onGoToLibrary && (
                                <Button
                                    onClick={() => {
                                        setShow(false)
                                        onGoToLibrary()
                                    }}
                                    variant="outline"
                                    className="flex-1 border-2 border-[#D4AF37] text-white hover:bg-[#D4AF37]/20 h-12 text-lg"
                                >
                                    <BookOpen className="w-5 h-5 ml-2" />
                                    کتاب‌های بیشتر
                                </Button>
                            )}
                        </motion.div>

                        {/* Close hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-center text-gray-400 text-xs mt-4"
                        >
                            کلیک کنید یا ESC بزنید برای بستن
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Hook for managing completion celebrations
export function useCompletionCelebration() {
    const [celebration, setCelebration] = useState<{
        type: 'chapter' | 'book'
        title: string
        xpEarned: number
        pagesRead: number
    } | null>(null)

    const showCelebration = (
        type: 'chapter' | 'book',
        title: string,
        xpEarned: number,
        pagesRead: number
    ) => {
        setCelebration({ type, title, xpEarned, pagesRead })
    }

    const hideCelebration = () => {
        setCelebration(null)
    }

    return { celebration, showCelebration, hideCelebration }
}
