'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Copy, Trash2, X } from 'lucide-react'

interface Highlight {
    page: number
    text: string
    color: string
    id: string
    timestamp: number
}

interface HighlightsPanelProps {
    highlights: Highlight[]
    theme: 'light' | 'sepia' | 'dark'
    onClose: () => void
    onDelete: (id: string) => void
    onCopy: (text: string) => void
    onJumpToPage: (page: number) => void
}

export function HighlightsPanel({
    highlights,
    theme,
    onClose,
    onDelete,
    onCopy,
    onJumpToPage
}: HighlightsPanelProps) {
    // Group highlights by page
    const highlightsByPage = highlights.reduce((acc, highlight) => {
        if (!acc[highlight.page]) {
            acc[highlight.page] = []
        }
        acc[highlight.page].push(highlight)
        return acc
    }, {} as Record<number, Highlight[]>)

    const sortedPages = Object.keys(highlightsByPage)
        .map(Number)
        .sort((a, b) => a - b)

    const getColorClass = (color: string) => {
        const colors = {
            yellow: theme === 'dark'
                ? 'bg-yellow-500/30 border-yellow-500/50'
                : 'bg-yellow-200 border-yellow-400',
            orange: theme === 'dark'
                ? 'bg-orange-500/30 border-orange-500/50'
                : 'bg-orange-200 border-orange-400',
            gold: theme === 'dark'
                ? 'bg-gold-500/30 border-gold-500/50'
                : 'bg-gold-200 border-gold-400'
        }
        return colors[color as keyof typeof colors] || colors.yellow
    }

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
                "fixed inset-y-0 right-0 w-96 border-l shadow-2xl z-50 flex flex-col backdrop-blur-xl",
                theme === 'light' && "bg-gradient-to-br from-gold-50/98 to-amber-50/98 border-gold-300",
                theme === 'sepia' && "bg-gradient-to-br from-amber-100/98 to-amber-50/98 border-amber-400",
                theme === 'dark' && "bg-gradient-to-br from-[#0f0e0c]/98 to-[#1a1612]/98 border-gold-700"
            )}
        >
            {/* Header */}
            <div className={cn(
                "p-5 border-b flex items-center justify-between",
                theme === 'dark' ? 'border-gold-700' : 'border-gold-300'
            )}>
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">هایلایت‌ها</h2>
                    <Badge className="bg-primary hover:bg-primary">
                        {highlights.length}
                    </Badge>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
                        <X className="h-5 w-5" />
                    </Button>
                </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {highlights.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4 opacity-50">✨</div>
                        <p className={cn(
                            "text-lg font-medium",
                            theme === 'dark' ? 'text-gold-400' : 'text-gold-700'
                        )}>
                            هنوز هایلایتی ندارید
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            متن را انتخاب کنید و رنگ دلخواه را انتخاب کنید
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {sortedPages.map((page) => (
                            <motion.div
                                key={page}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-3"
                            >
                                {/* Page Header */}
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-px flex-1",
                                        theme === 'dark' ? 'bg-gold-700' : 'bg-gold-300'
                                    )} />
                                    <button
                                        onClick={() => onJumpToPage(page)}
                                        className={cn(
                                            "text-sm font-bold px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105",
                                            theme === 'dark'
                                                ? 'bg-gold-900/30 text-gold-400 hover:bg-gold-900/50'
                                                : 'bg-beige-200 text-gold-700 hover:bg-beige-300'
                                        )}
                                    >
                                        صفحه {(page + 1).toLocaleString('fa-IR')}
                                    </button>
                                    <div className={cn(
                                        "h-px flex-1",
                                        theme === 'dark' ? 'bg-gold-700' : 'bg-gold-300'
                                    )} />
                                </div>

                                {/* Highlights for this page */}
                                {highlightsByPage[page].map((highlight) => (
                                    <motion.div
                                        key={highlight.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ scale: 1.02 }}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                                            theme === 'dark'
                                                ? 'bg-[#1a1612]/50 hover:bg-[#1a1612]/80'
                                                : 'bg-white/50 hover:bg-white/80',
                                            getColorClass(highlight.color)
                                        )}
                                        onClick={() => onJumpToPage(page)}
                                    >
                                        {/* Color indicator */}
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "w-1 h-full rounded-full flex-shrink-0",
                                                highlight.color === 'yellow' && (theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-600'),
                                                highlight.color === 'orange' && (theme === 'dark' ? 'bg-orange-500' : 'bg-orange-600'),
                                                highlight.color === 'gold' && (theme === 'dark' ? 'bg-gold-500' : 'bg-gold-600')
                                            )} />

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-relaxed line-clamp-3">
                                                    {highlight.text}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-3">
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onCopy(highlight.text)
                                                            }}
                                                            className="h-8 px-2 hover:bg-beige-100 dark:hover:bg-gold-900/30 rounded-lg"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>

                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onDelete(highlight.id)
                                                            }}
                                                            className="h-8 px-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>

                                                    <div className="flex-1" />

                                                    <ChevronRight className="h-4 w-4 opacity-50" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    )
}
