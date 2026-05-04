'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Check, Loader2, Trash2, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

interface Word {
    id: string
    word: string
    definition: string
    context?: string | null
    status: string
    level: string
    review_count: number
    correct_count: number
    incorrect_count: number
    next_review_at: string
    created_at: string
    books?: { title: string; slug: string } | null
}

interface VocabularyWordCardProps {
    word: Word
    userId: string
}

export function VocabularyWordCard({ word, userId }: VocabularyWordCardProps) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const accuracy = word.review_count > 0
        ? Math.round((word.correct_count / word.review_count) * 100)
        : 0

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            case 'learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'reviewing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            case 'mastered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'new': return 'جدید'
            case 'learning': return 'یادگیری'
            case 'reviewing': return 'مرور'
            case 'mastered': return 'تسلط'
            default: return status
        }
    }

    const getLevelLabel = (level: string) => {
        switch (level) {
            case 'beginner': return 'مبتدی'
            case 'intermediate': return 'متوسط'
            case 'advanced': return 'پیشرفته'
            default: return level
        }
    }

    const playPronunciation = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word.word)
            utterance.lang = 'en-US'
            window.speechSynthesis.speak(utterance)
        } else {
            toast.error('مرورگر شما از تلفظ پشتیبانی نمی‌کند')
        }
    }

    const deleteWordMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('user_words')
                .delete()
                .eq('id', word.id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vocabulary', userId] })
            queryClient.invalidateQueries({ queryKey: ['vocabulary-stats', userId] })
            toast.success('کلمه حذف شد')
        },
        onError: () => {
            toast.error('خطا در حذف کلمه')
        },
    })

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold">{word.word}</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={playPronunciation}
                                    aria-label="تلفظ کلمه"
                                    title="تلفظ کلمه"
                                >
                                    <Volume2 className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{word.definition}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteWordMutation.mutate()}
                            disabled={deleteWordMutation.isPending}
                            aria-label="حذف کلمه"
                            title="حذف کلمه"
                        >
                            {deleteWordMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin text-destructive" />
                            ) : (
                                <Trash2 className="w-3 h-3 text-destructive" />
                            )}
                        </Button>
                    </div>

                    {/* Context */}
                    {word.context && (
                        <p className="text-xs text-muted-foreground italic">
                            "{word.context}"
                        </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getStatusColor(word.status)}>
                            {getStatusLabel(word.status)}
                        </Badge>
                        <Badge variant="outline" className={getLevelColor(word.level)}>
                            {getLevelLabel(word.level)}
                        </Badge>
                    </div>

                    {/* Book Source */}
                    {word.books && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="w-3 h-3" />
                            <span>{word.books.title}</span>
                        </div>
                    )}

                    {/* Progress */}
                    {word.review_count > 0 && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">دقت</span>
                                <span className={cn(
                                    "font-medium",
                                    accuracy >= 80 ? "text-green-600" :
                                        accuracy >= 50 ? "text-yellow-600" :
                                            "text-red-600"
                                )}>
                                    {accuracy}%
                                </span>
                            </div>
                            <Progress value={accuracy} className="h-1" />
                            <p className="text-xs text-muted-foreground">
                                {word.review_count} مرور • {word.correct_count} درست • {word.incorrect_count} نادرست
                            </p>
                        </div>
                    )}

                    {/* Mastered Badge */}
                    {word.status === 'mastered' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center justify-center gap-1 text-green-600 text-sm font-medium"
                        >
                            <Check className="w-4 h-4" />
                            <span>تسلط کامل!</span>
                        </motion.div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
