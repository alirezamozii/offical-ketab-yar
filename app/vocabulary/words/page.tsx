'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Search, Trash2, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface VocabularyWord {
  id: string
  word: string
  definition: string
  translation: string
  context?: string
  mastery_level: number
  created_at: string
  books?: {
    title: string
    slug: string
  }
}

function WordsListContent() {
  const searchParams = useSearchParams()
  const bookId = searchParams.get('bookId')

  const [words, setWords] = useState<VocabularyWord[]>([])
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadWords()
  }, [bookId])

  useEffect(() => {
    filterWords()
  }, [words, searchQuery])

  const loadWords = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('لطفاً وارد شوید')
        return
      }

      let query = supabase
        .from('vocabulary')
        .select(
          `
          *,
          books (
            title,
            slug
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (bookId) {
        query = query.eq('book_id', bookId)
      }

      const { data, error } = await query

      if (error) throw error

      setWords(data || [])
    } catch (error) {
      console.error('Error loading words:', error)
      toast.error('خطا در بارگذاری کلمات')
    } finally {
      setLoading(false)
    }
  }

  const filterWords = () => {
    if (!searchQuery) {
      setFilteredWords(words)
      return
    }

    const filtered = words.filter(
      w =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.translation.includes(searchQuery)
    )
    setFilteredWords(filtered)
  }

  const deleteWord = async (id: string) => {
    try {
      const { error } = await supabase.from('vocabulary').delete().eq('id', id)

      if (error) throw error

      setWords(words.filter(w => w.id !== id))
      toast.success('کلمه حذف شد')
    } catch (error) {
      console.error('Error deleting word:', error)
      toast.error('خطا در حذف کلمه')
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
            <span
              key={i}
              className="rounded bg-gold-500/30 px-1 font-bold text-gold-900 dark:text-gold-100"
            >
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
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gold-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/vocabulary">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
        </Link>
        <h1 className="mb-2 bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-4xl font-bold text-transparent">
          لیست کلمات
        </h1>
        <p className="text-muted-foreground">{words.length.toLocaleString('fa-IR')} کلمه</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی کلمات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
            dir="rtl"
          />
        </div>
      </div>

      {/* Words List */}
      {filteredWords.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p className="mb-2 text-lg">کلمه‌ای یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredWords.map((word, index) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Word */}
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-gold-600">{word.word}</h3>
                          <button
                            onClick={() => {
                              const audio = new Audio(
                                `https://api.dictionaryapi.dev/media/pronunciations/en/${word.word}-us.mp3`
                              )
                              audio.play().catch(() => {
                                toast.error('تلفظ در دسترس نیست')
                              })
                            }}
                            className="hover:bg-gold/20 rounded-full p-1 transition-colors"
                            aria-label="تلفظ کلمه"
                          >
                            <Volume2 className="h-4 w-4 text-gold-600" />
                          </button>
                        </div>

                        {/* Translation */}
                        <p className="mb-2 text-lg font-semibold">{word.translation}</p>

                        {/* Definition */}
                        <p className="mb-3 text-muted-foreground">{word.definition}</p>

                        {/* Context */}
                        {word.context && (
                          <div className="mb-3 rounded-lg bg-muted/50 p-3">
                            <p className="mb-1 text-sm text-muted-foreground">متن:</p>
                            <p className="text-sm leading-relaxed">
                              {highlightWordInContext(word.context, word.word)}
                            </p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {word.books && (
                            <Link
                              href={`/books/${word.books.slug}`}
                              className="flex items-center gap-1 transition-colors hover:text-gold-600"
                            >
                              <BookOpen className="h-3 w-3" />
                              {word.books.title}
                            </Link>
                          )}
                          <span>{new Date(word.created_at).toLocaleDateString('fa-IR')}</span>
                          <Badge variant="secondary">سطح {word.mastery_level}</Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWord(word.id)}
                        className="hover:bg-red-500/10 hover:text-red-500"
                        aria-label="حذف کلمه"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default function WordsListPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gold-600" />
          </div>
        </div>
      }
    >
      <WordsListContent />
    </Suspense>
  )
}
