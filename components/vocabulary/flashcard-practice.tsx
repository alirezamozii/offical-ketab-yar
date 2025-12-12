'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Brain, Check, Languages, Loader2, Volume2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface VocabularyWord {
    id: string
    word: string
    definition: string
    translation: string
    context?: string
    mastery_level: number
    last_reviewed_at?: string
    next_review_at?: string
    book_id?: string
    books?: {
        title: string
        slug: string
    }
}

interface FlashcardPracticeProps {
    bookId?: string
    mode: 'all' | 'book'
}

interface DictionaryData {
    definition: string
    synonyms: string[]
    antonyms: string[]
    phonetic?: string
    audioUrl?: string
}

export function FlashcardPractice({ bookId, mode }: FlashcardPracticeProps) {
    const [words, setWords] = useState<VocabularyWord[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showAnswer, setShowAnswer] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingDefinition, setLoadingDefinition] = useState(false)
    const [loadingTranslation, setLoadingTranslation] = useState(false)
    const [stats, setStats] = useState({
        correct: 0,
        incorrect: 0,
        total: 0
    })
    const [dictionaryData, setDictionaryData] = useState<DictionaryData | null>(null)
    const [translatedDefinition, setTranslatedDefinition] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        loadWords()
    }, [bookId, mode])

    const loadWords = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('لطفاً وارد شوید')
                router.push('/auth/login')
                return
            }

            let query = supabase
                .from('vocabulary')
                .select(`
          *,
          books (
            title,
            slug
          )
        `)
                .eq('user_id', user.id)

            if (mode === 'book' && bookId) {
                query = query.eq('book_id', bookId)
            }

            const { data, error } = await query

            if (error) throw error

            const sortedWords = sortBySpacedRepetition(data || [])
            setWords(sortedWords)
            setStats({ ...stats, total: sortedWords.length })
        } catch (error) {
            console.error('Error loading words:', error)
            toast.error('خطا در بارگذاری کلمات')
        } finally {
            setLoading(false)
        }
    }

    const sortBySpacedRepetition = (words: VocabularyWord[]) => {
        const now = new Date()
        return words.sort((a, b) => {
            const aNextReview = a.next_review_at ? new Date(a.next_review_at) : now
            const bNextReview = b.next_review_at ? new Date(b.next_review_at) : now

            if (aNextReview < now && bNextReview >= now) return -1
            if (bNextReview < now && aNextReview >= now) return 1
            if (a.mastery_level !== b.mastery_level) {
                return a.mastery_level - b.mastery_level
            }

            const aLastReview = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0
            const bLastReview = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0
            return aLastReview - bLastReview
        })
    }

    const calculateNextReviewDate = (masteryLevel: number, wasCorrect: boolean) => {
        const now = new Date()
        let daysToAdd = 0

        if (wasCorrect) {
            switch (masteryLevel) {
                case 0: daysToAdd = 1; break
                case 1: daysToAdd = 3; break
                case 2: daysToAdd = 7; break
                case 3: daysToAdd = 14; break
                case 4: daysToAdd = 30; break
                case 5: daysToAdd = 90; break
                default: daysToAdd = 180; break
            }
        } else {
            daysToAdd = masteryLevel === 0 ? 0.5 : 1
        }

        now.setDate(now.getDate() + daysToAdd)
        return now.toISOString()
    }

    // Fetch definition from Free Dictionary API
    const fetchDefinition = async (word: string) => {
        setLoadingDefinition(true)
        try {
            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
            )

            if (!response.ok) {
                throw new Error('Word not found')
            }

            const data = await response.json()
            const firstEntry = data[0]

            interface PhoneticEntry {
                audio?: string
            }

            interface Definition {
                definition: string
                synonyms?: string[]
                antonyms?: string[]
            }

            interface Meaning {
                definitions?: Definition[]
            }

            const audioUrl = firstEntry.phonetics?.find((p: PhoneticEntry) => p.audio)?.audio
            const meanings: Meaning = firstEntry.meanings?.[0]
            const definition = meanings?.definitions?.[0]?.definition || 'No definition available'

            const synonyms = Array.from(
                new Set(
                    meanings?.definitions?.flatMap((d: Definition) => d.synonyms || []) || []
                )
            ).slice(0, 5) as string[]

            const antonyms = Array.from(
                new Set(
                    meanings?.definitions?.flatMap((d: Definition) => d.antonyms || []) || []
                )
            ).slice(0, 5) as string[]

            setDictionaryData({
                definition,
                synonyms,
                antonyms,
                phonetic: firstEntry.phonetic,
                audioUrl
            })
        } catch (error) {
            console.error('Error fetching definition:', error)
            toast.error('خطا در دریافت تعریف')
            setDictionaryData({
                definition: 'Definition not available',
                synonyms: [],
                antonyms: []
            })
        } finally {
            setLoadingDefinition(false)
        }
    }

    // Translate definition using Google Cloud Translation API
    const translateDefinition = async () => {
        if (!dictionaryData?.definition) return

        setLoadingTranslation(true)
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: dictionaryData.definition,
                    targetLanguage: 'fa'
                })
            })

            if (!response.ok) throw new Error('Translation failed')

            const data = await response.json()
            setTranslatedDefinition(data.translatedText)
        } catch (error) {
            console.error('Error translating:', error)
            toast.error('خطا در ترجمه')
        } finally {
            setLoadingTranslation(false)
        }
    }

    const handleAnswer = async (isCorrect: boolean) => {
        const currentWord = words[currentIndex]

        const newMasteryLevel = isCorrect
            ? Math.min(currentWord.mastery_level + 1, 7)
            : Math.max(currentWord.mastery_level - 1, 0)

        const nextReviewDate = calculateNextReviewDate(newMasteryLevel, isCorrect)

        try {
            const { error } = await supabase
                .from('vocabulary')
                .update({
                    mastery_level: newMasteryLevel,
                    last_reviewed_at: new Date().toISOString(),
                    next_review_at: nextReviewDate
                })
                .eq('id', currentWord.id)

            if (error) throw error

            setStats({
                ...stats,
                correct: isCorrect ? stats.correct + 1 : stats.correct,
                incorrect: !isCorrect ? stats.incorrect + 1 : stats.incorrect
            })

            setTimeout(() => {
                if (currentIndex < words.length - 1) {
                    setCurrentIndex(currentIndex + 1)
                    setShowAnswer(false)
                    setDictionaryData(null)
                    setTranslatedDefinition(null)
                } else {
                    toast.success('تمرین تمام شد! 🎉')
                    router.push('/vocabulary')
                }
            }, 500)
        } catch (error) {
            console.error('Error updating word:', error)
            toast.error('خطا در ذخیره پیشرفت')
        }
    }

    const handleDontKnow = () => {
        setShowAnswer(true)
        fetchDefinition(words[currentIndex].word)
    }

    const playAudio = () => {
        if (dictionaryData?.audioUrl) {
            const audio = new Audio(dictionaryData.audioUrl)
            audio.play().catch(() => {
                toast.error('تلفظ در دسترس نیست')
            })
        }
    }

    const highlightWordInContext = (context: string, word: string) => {
        if (!context) return null

        const regex = new RegExp(`\\b(${word})\\b`, 'gi')
        const parts = context.split(regex)

        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <span key={i} className="bg-beige-300 text-gold-800 dark:bg-gold-500/30 dark:text-gold-100 px-1 rounded font-bold">
                            {part}
                        </span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </div>
        )
    }

    if (words.length === 0) {
        return (
            <div className="container mx-auto p-8" dir="rtl">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">کلمه‌ای برای تمرین وجود ندارد</p>
                        <Button onClick={() => router.push('/vocabulary')} className="mt-4">
                            بازگشت به واژگان
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentWord = words[currentIndex]
    const progress = ((currentIndex + 1) / words.length) * 100

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col" dir="rtl">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">تمرین فلش‌کارت</h1>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                            ✓ {stats.correct}
                        </Badge>
                        <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                            ✗ {stats.incorrect}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>پیشرفت</span>
                        <span>{currentIndex + 1} / {words.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            {/* Flashcard */}
            <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-2xl"
                    >
                        <Card className="border-2 border-gold/30 shadow-2xl">
                            <CardContent className="pt-8 pb-8">
                                {/* Word */}
                                <div className="text-center mb-6">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <h2 className="text-5xl font-bold text-gold-700 dark:text-gold-400">
                                            {currentWord.word}
                                        </h2>
                                        {dictionaryData?.audioUrl && (
                                            <button
                                                onClick={playAudio}
                                                className="p-3 hover:bg-primary/10 rounded-full transition-colors"
                                            >
                                                <Volume2 className="h-6 w-6 text-primary" />
                                            </button>
                                        )}
                                    </div>

                                    {dictionaryData?.phonetic && (
                                        <p className="text-sm text-muted-foreground">{dictionaryData.phonetic}</p>
                                    )}

                                    {currentWord.books && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{currentWord.books.title}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Context with Highlighting */}
                                {currentWord.context && (
                                    <div className="bg-muted/50 p-4 rounded-lg mb-6">
                                        <p className="text-sm text-muted-foreground mb-1">متن:</p>
                                        <p className="text-base leading-relaxed">
                                            {highlightWordInContext(currentWord.context, currentWord.word)}
                                        </p>
                                    </div>
                                )}

                                {/* Answer Section */}
                                <AnimatePresence>
                                    {showAnswer && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4"
                                        >
                                            {loadingDefinition ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                </div>
                                            ) : dictionaryData && (
                                                <>
                                                    {/* Definition */}
                                                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm text-muted-foreground">تعریف:</p>
                                                            <button
                                                                onClick={translateDefinition}
                                                                disabled={loadingTranslation}
                                                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                                            >
                                                                {loadingTranslation ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Languages className="h-3 w-3" />
                                                                )}
                                                                {translatedDefinition ? 'پنهان کردن' : 'ترجمه به فارسی'}
                                                            </button>
                                                        </div>
                                                        <p className="text-base mb-2">{dictionaryData.definition}</p>

                                                        {translatedDefinition && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="mt-3 pt-3 border-t border-blue-500/20"
                                                            >
                                                                <p className="text-sm text-muted-foreground mb-1">ترجمه:</p>
                                                                <p className="text-base font-semibold">{translatedDefinition}</p>
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    {/* Synonyms */}
                                                    {dictionaryData.synonyms.length > 0 && (
                                                        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                                                            <p className="text-sm text-muted-foreground mb-2">مترادف‌ها:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {dictionaryData.synonyms.map((syn, i) => (
                                                                    <Badge key={i} variant="secondary" className="bg-green-500/20">
                                                                        {syn}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Antonyms */}
                                                    {dictionaryData.antonyms.length > 0 && (
                                                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                                                            <p className="text-sm text-muted-foreground mb-2">متضادها:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {dictionaryData.antonyms.map((ant, i) => (
                                                                    <Badge key={i} variant="secondary" className="bg-red-500/20">
                                                                        {ant}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mastery Level */}
                                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                        <span>سطح تسلط:</span>
                                                        <div className="flex gap-1">
                                                            {[...Array(7)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`h-2 w-6 rounded-full ${i < currentWord.mastery_level
                                                                        ? 'bg-gold-600'
                                                                        : 'bg-muted'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Buttons */}
                                <div className="mt-8 flex gap-3 justify-center">
                                    {!showAnswer ? (
                                        <>
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                onClick={handleDontKnow}
                                                className="border-red-500/50 hover:bg-red-500/10 hover:text-red-700 px-8"
                                            >
                                                <X className="ml-2 h-5 w-5" />
                                                نمی‌دانم
                                            </Button>
                                            <Button
                                                size="lg"
                                                onClick={() => handleAnswer(true)}
                                                className="bg-green-600 hover:bg-green-700 px-8"
                                            >
                                                <Check className="ml-2 h-5 w-5" />
                                                می‌دانم
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="lg"
                                            onClick={() => handleAnswer(false)}
                                            variant="bronze"
                                            className="px-8"
                                        >
                                            بعدی
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
