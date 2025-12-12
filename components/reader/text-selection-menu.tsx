'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BookmarkPlus, BookOpen, Copy, MessageSquare, X } from 'lucide-react'

interface TextSelectionMenuProps {
    position: { x: number; y: number }
    theme: 'light' | 'sepia' | 'dark'
    selectedText: string
    onHighlight: (color: string) => void
    onAddToVocabulary?: () => void // Optional - only for single words
    onShowDictionary?: () => void // Show dictionary popup
    onCopy?: () => void // Copy text
    onAIChat: () => void
    onClose: () => void
}

export function TextSelectionMenu({
    position,
    theme,
    selectedText,
    onHighlight,
    onAddToVocabulary,
    onShowDictionary,
    onCopy,
    onAIChat,
    onClose
}: TextSelectionMenuProps) {
    // Check if selected text is a single word (for dictionary)
    const isSingleWord = selectedText.trim().split(/\s+/).length === 1

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
                "fixed z-[120] rounded-xl shadow-2xl p-2 flex gap-1.5 backdrop-blur-xl border-2",
                theme === 'dark'
                    ? "bg-gradient-to-br from-[#1a1612]/98 to-[#0f0e0c]/98 border-gold-600 shadow-gold-900/50"
                    : "bg-gradient-to-br from-gold-50/98 to-amber-50/98 border-gold-400 shadow-gold-300/50"
            )}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, 0)'
            }}
        >
            {/* Highlight Colors - Vibrant realistic highlighter icons */}
            <motion.div
                whileHover={{ scale: 1.15, rotate: 2 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onHighlight('yellow')}
                    title="هایلایت زرد"
                    className="hover:bg-gold-100 dark:hover:bg-gold-900/50 transition-all duration-200 p-2 rounded-lg"
                >
                    <div
                        className="w-8 h-8 rounded-lg border-2 shadow-lg relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgb(251, 209, 32) 0%, rgb(255, 220, 50) 50%, rgb(241, 199, 22) 100%)',
                            borderColor: 'rgb(241, 199, 22)',
                            boxShadow: '0 4px 12px rgba(251, 209, 32, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                            }}
                        />
                    </div>
                </Button>
            </motion.div>

            <motion.div
                whileHover={{ scale: 1.15, rotate: -2 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onHighlight('orange')}
                    title="هایلایت نارنجی"
                    className="hover:bg-gold-100 dark:hover:bg-gold-900/50 transition-all duration-200 p-2 rounded-lg"
                >
                    <div
                        className="w-8 h-8 rounded-lg border-2 shadow-lg relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgb(252, 156, 74) 0%, rgb(255, 170, 90) 50%, rgb(242, 146, 64) 100%)',
                            borderColor: 'rgb(242, 146, 64)',
                            boxShadow: '0 4px 12px rgba(252, 156, 74, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                            }}
                        />
                    </div>
                </Button>
            </motion.div>

            <motion.div
                whileHover={{ scale: 1.15, rotate: 2 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onHighlight('gold')}
                    title="هایلایت طلایی"
                    className="hover:bg-gold-100 dark:hover:bg-gold-900/50 transition-all duration-200 p-2 rounded-lg"
                >
                    <div
                        className="w-8 h-8 rounded-lg border-2 shadow-lg relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgb(202, 172, 105) 0%, rgb(215, 185, 120) 50%, rgb(192, 162, 95) 100%)',
                            borderColor: 'rgb(192, 162, 95)',
                            boxShadow: '0 4px 12px rgba(202, 172, 105, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                            }}
                        />
                    </div>
                </Button>
            </motion.div>

            <div className={cn(
                "w-px mx-1 my-1",
                theme === 'dark' ? 'bg-gold-700' : 'bg-gold-300'
            )} />

            {/* Dictionary - only for single words */}
            {isSingleWord && onShowDictionary && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onShowDictionary}
                        className="hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 p-2 rounded-lg"
                        title="دیکشنری (معنی کلمه)"
                    >
                        <BookOpen className={cn(
                            "h-5 w-5",
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        )} />
                    </Button>
                </motion.div>
            )}

            {/* Add to Vocabulary - only for single words */}
            {isSingleWord && onAddToVocabulary && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onAddToVocabulary}
                        className="hover:bg-gold-100 dark:hover:bg-gold-900/50 transition-all duration-200 p-2 rounded-lg"
                        title="افزودن به واژگان"
                    >
                        <BookmarkPlus className={cn(
                            "h-5 w-5",
                            theme === 'dark' ? 'text-gold-400' : 'text-gold-600'
                        )} />
                    </Button>
                </motion.div>
            )}

            {/* Copy Button */}
            {onCopy && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onCopy}
                        className="hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 p-2 rounded-lg"
                        title="کپی متن"
                    >
                        <Copy className={cn(
                            "h-5 w-5",
                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        )} />
                    </Button>
                </motion.div>
            )}

            {/* AI Chat */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onAIChat}
                    className="hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200 p-2 rounded-lg relative"
                    title="پرسیدن از AI درباره این متن"
                >
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </Button>
            </motion.div>

            <div className={cn(
                "w-px mx-1 my-1",
                theme === 'dark' ? 'bg-gold-700' : 'bg-gold-300'
            )} />

            {/* Close */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="hover:bg-gold-100 dark:hover:bg-gold-900/50 transition-all duration-200 p-2 rounded-lg"
                    title="بستن"
                >
                    <X className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-gold-400' : 'text-gold-600'
                    )} />
                </Button>
            </motion.div>
        </motion.div>
    )
}
