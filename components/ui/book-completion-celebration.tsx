"use client"

import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, BookOpen, Sparkles, Trophy } from "lucide-react"
import { Button } from "./button"

interface BookCompletionCelebrationProps {
    bookTitle: string
    xpEarned: number
    pagesRead: number
    timeSpent?: string
    onContinue?: () => void
    onChooseNext?: () => void
    show?: boolean
}

export function BookCompletionCelebration({
    bookTitle,
    xpEarned,
    pagesRead,
    timeSpent,
    onContinue,
    onChooseNext,
    show = true,
}: BookCompletionCelebrationProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 50 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="max-w-lg w-full bg-gradient-to-br from-gold-50 via-gold-100 to-gold-200 dark:from-gold-950 dark:via-gold-900 dark:to-gold-800 p-8 rounded-2xl shadow-2xl text-center"
                    >
                        {/* Trophy Animation */}
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 10, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mb-6"
                        >
                            <Trophy className="w-24 h-24 text-gold-600 dark:text-gold-400 mx-auto drop-shadow-lg" />
                        </motion.div>

                        {/* Confetti Effect */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -20, x: Math.random() * 100 - 50, opacity: 1 }}
                                    animate={{
                                        y: 500,
                                        x: Math.random() * 200 - 100,
                                        opacity: 0,
                                        rotate: Math.random() * 360,
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        delay: Math.random() * 0.5,
                                        ease: "easeOut",
                                    }}
                                    className={cn(
                                        "absolute w-3 h-3 rounded-full",
                                        i % 3 === 0 ? "bg-gold-400" : i % 3 === 1 ? "bg-gold-500" : "bg-gold-600"
                                    )}
                                    style={{ left: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>

                        {/* Content */}
                        <h2 className="text-3xl font-bold text-gold-900 dark:text-gold-100 mb-2">
                            Book Complete!
                        </h2>
                        <p className="text-lg text-gold-700 dark:text-gold-300 mb-6">
                            Congratulations on finishing
                            <br />
                            <span className="font-semibold">"{bookTitle}"</span>
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/50 dark:bg-black/20 p-4 rounded-xl"
                            >
                                <Sparkles className="w-6 h-6 text-gold-600 dark:text-gold-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gold-900 dark:text-gold-100">
                                    +{xpEarned} XP
                                </p>
                                <p className="text-sm text-gold-700 dark:text-gold-300">Earned</p>
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/50 dark:bg-black/20 p-4 rounded-xl"
                            >
                                <BookOpen className="w-6 h-6 text-gold-600 dark:text-gold-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gold-900 dark:text-gold-100">
                                    {pagesRead}
                                </p>
                                <p className="text-sm text-gold-700 dark:text-gold-300">Pages Read</p>
                            </motion.div>
                        </div>

                        {timeSpent && (
                            <p className="text-sm text-gold-600 dark:text-gold-400 mb-6">
                                Time spent: {timeSpent}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {onContinue && (
                                <Button
                                    variant="premium"
                                    size="lg"
                                    onClick={onContinue}
                                    className="flex-1"
                                >
                                    Continue Reading
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                            {onChooseNext && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={onChooseNext}
                                    className="flex-1 hover:bg-beige-100 dark:hover:bg-gold-900"
                                >
                                    Choose Next Book
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

interface ChapterCompletionProps {
    chapterNumber: number
    xpEarned: number
    onContinue?: () => void
    show?: boolean
}

export function ChapterCompletion({
    chapterNumber,
    xpEarned,
    onContinue,
    show = true,
}: ChapterCompletionProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-gold-500 to-gold-600 text-white p-4 rounded-xl shadow-lg max-w-sm"
                >
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-8 h-8" />
                        <div className="flex-1">
                            <h3 className="font-bold">Chapter {chapterNumber} Complete!</h3>
                            <p className="text-sm opacity-90">+{xpEarned} XP Earned</p>
                        </div>
                        {onContinue && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onContinue}
                                className="bg-white/20 hover:bg-white/30"
                            >
                                Continue
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
