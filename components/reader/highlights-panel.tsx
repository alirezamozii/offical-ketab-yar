'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/custom-toast'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Copy, Trash2, Undo2, X } from 'lucide-react'
import { useState } from 'react'

interface Highlight {
    page: number
    text: string
    color: string
    id: string
    timestamp: number
}

interface HighlightsPanelProps {
    highlights: Highlight[]
    currentPage: number
    theme: 'light' | 'sepia' | 'dark'
    onJumpToPage: (page: number) => void
    onDelete: (id: string) => void
    onCopy: (text: string) => void
    onClose: () => void
}

export function HighlightsPanel({
    highlights,
    currentPage,
    theme,
    onJumpToPage,
    onDelete,
    onCopy,
    onClose
}: HighlightsPanelProps) {
    const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([currentPage]))
    const [previousPage, setPreviousPage] = useState<number | null>(null)
    const [showUndo, setShowUndo] = useState(false)

    // Group highlights by page
    const highlightsByPage = highlights.reduce((acc, highlight) => {
        if (!acc[highlight.page]) {
            acc[highlight.page] = []
        }
        acc[highlight.page].push(highlight)
        return acc
    }, {} as Record<number, Highlight[]>)

    // Sort pages
    const sortedPages = Object.keys(highlightsByPage)
        .map(Number)
        .sort((a, b) => a - b)

    const togglePage = (page: number) => {
        const newExpanded = new Set(expandedPages)
        if (newExpanded.has(page)) {
            newExpanded.delete(page)
        } else {
            newExpanded.add(page)
        }
        setExpandedPages(newExpanded)
    }

    const handleJumpToHighlight = (page: number) => {
        // Save current page for undo
        setPreviousPage(currentPage)
        setShowUndo(true)

        // Jump to page
        onJumpToPage(page)

        // Hide undo button after 10 seconds
        setTimeout(() => {
            setShowUndo(false)
            setPreviousPage(null)
        }, 10000)
    }

    const handleUndo = () => {
        if (previousPage !== null) {
            onJumpToPage(previousPage)
            setShowUndo(false)
            setPreviousPage(null)
            toast.success('بازگشت به صفحه قبلی')
        }
    }

    const getColorClass = (color: string) => {
        const colors = {
            yellow: 'bg-yellow-400/30 border-yellow-500',
            orange: 'bg-orange-400/30 border-orange-500',
            gold: 'bg-gold-400/30 border-gold-500'
        }
        return colors[color as keyof typeof colors] || colors.yellow
    }

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
                'fixed inset-y-0 right-0 w-96 border-l shadow-2xl z-[110] overflow-hidden flex flex-col',
                theme === 'light' && 'bg-gradient-to-br from-gold-50 to-amber-50 border-gold-200',
                theme === 'sepia' && 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300',
                theme === 'dark' && 'bg-gradient-to-br from-[#0f0e0c] to-[#1a1612] border-gold-700'
            )}
        >
            {/* Header */}
            <div className="p-6 border-b border-gold-300 dark:border-gold-700 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold">هایلایت‌ها</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    {highlights.length} هایلایت در {sortedPages.length} صفحه
                </p>
            </div>

            {/* Undo Button (floating) */}
            <AnimatePresence>
                {showUndo && previousPage !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-24 left-4 right-4 z-10"
                    >
                        <Button
                            onClick={handleUndo}
                            className="w-full bg-gold-600 hover:bg-gold-700 text-white shadow-lg"
                            size="sm"
                        >
                            <Undo2 className="h-4 w-4 ml-2" />
                            بازگشت به صفحه {previousPage + 1}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Highlights List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sortedPages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>هنوز هایلایتی ندارید</p>
                        <p className="text-sm mt-2">متن را انتخاب کنید و رنگ دلخواه را بزنید</p>
                    </div>
                ) : (
                    sortedPages.map((page) => {
                        const pageHighlights = highlightsByPage[page]
                        const isExpanded = expandedPages.has(page)
                        const isCurrentPage = page === currentPage

                        return (
                            <motion.div
                                key={page}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'rounded-lg border-2 overflow-hidden transition-all',
                                    isCurrentPage
                                        ? 'border-gold-500 bg-gold-500/10'
                                        : 'border-gold-200 dark:border-gold-800'
                                )}
                            >
                                {/* Page Header */}
                                <button
                                    onClick={() => togglePage(page)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gold-100 dark:hover:bg-gold-900/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </motion.div>
                                        <div className="text-right">
                                            <p className="font-bold">صفحه {page + 1}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {pageHighlights.length} هایلایت
                                            </p>
                                        </div>
                                    </div>
                                    {isCurrentPage && (
                                        <span className="text-xs bg-gold-600 text-white px-2 py-1 rounded-full">
                                            صفحه فعلی
                                        </span>
                                    )}
                                </button>

                                {/* Highlights for this page */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-2 space-y-2 bg-white/50 dark:bg-black/20">
                                                {pageHighlights.map((highlight) => (
                                                    <motion.div
                                                        key={highlight.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={cn(
                                                            'p-3 rounded-lg border-l-4 relative group',
                                                            getColorClass(highlight.color)
                                                        )}
                                                    >
                                                        <p className="text-sm leading-relaxed mb-3 pr-2">
                                                            "{highlight.text}"
                                                        </p>

                                                        {/* Actions */}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleJumpToHighlight(page)}
                                                                className="text-xs h-7"
                                                            >
                                                                رفتن به این هایلایت
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => onCopy(highlight.text)}
                                                                className="h-7 w-7 p-0"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => onDelete(highlight.id)}
                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </motion.div>
    )
}
