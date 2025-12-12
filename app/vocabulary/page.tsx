'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { offlineVocabulary } from '@/lib/offline/vocabulary-storage'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Brain, CloudOff, GraduationCap, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface BookWithWords {
  book_id: string
  book_title: string
  book_slug: string
  word_count: number
  mastered_count: number
  learning_count: number
  new_count: number
}

export default function VocabularyPage() {
  const [books, setBooks] = useState<BookWithWords[]>([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [stats, setStats] = useState({
    total_words: 0,
    mastered: 0,
    learning: 0,
    new: 0
  })
  const supabase = createClient()

  useEffect(() => {
    loadVocabularyBooks()
  }, [])

  const loadVocabularyBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Load from offline storage first (works without login)
      const offlineWords = await offlineVocabulary.getAll()

      if (!user) {
        // Not logged in - use offline data only
        setIsOffline(true)
        processOfflineWords(offlineWords)
        setLoading(false)
        return
      }

      // Get all vocabulary words with book info
      const { data: words, error } = await supabase
        .from('vocabulary')
        .select(`
          id,
          book_id,
          mastery_level,
          books (
            id,
            title,
            slug
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Group by book
      const bookMap = new Map<string, BookWithWords>()
      let totalMastered = 0
      let totalLearning = 0
      let totalNew = 0

      words?.forEach((word) => {
        if (!word.book_id || !word.books) return

        // Handle books as either object or array (Supabase can return either)
        const bookData = Array.isArray(word.books) ? word.books[0] : word.books
        if (!bookData) return

        const bookId = word.book_id
        const bookTitle = typeof bookData.title === 'string'
          ? bookData.title
          : bookData.title?.en || 'Unknown Book'
        const bookSlug = bookData.slug

        if (!bookMap.has(bookId)) {
          bookMap.set(bookId, {
            book_id: bookId,
            book_title: bookTitle,
            book_slug: bookSlug,
            word_count: 0,
            mastered_count: 0,
            learning_count: 0,
            new_count: 0
          })
        }

        const book = bookMap.get(bookId)!
        book.word_count++

        // Categorize by mastery level
        if (word.mastery_level >= 5) {
          book.mastered_count++
          totalMastered++
        } else if (word.mastery_level >= 2) {
          book.learning_count++
          totalLearning++
        } else {
          book.new_count++
          totalNew++
        }
      })

      setBooks(Array.from(bookMap.values()))
      setStats({
        total_words: words?.length || 0,
        mastered: totalMastered,
        learning: totalLearning,
        new: totalNew
      })
    } catch (error) {
      console.error('Error loading vocabulary:', error)

      // Fallback to offline data
      const offlineWords = await offlineVocabulary.getAll()
      processOfflineWords(offlineWords)
      setIsOffline(true)
      toast.error('خطا در بارگذاری - از حافظه محلی استفاده می‌شود')
    } finally {
      setLoading(false)
    }
  }

  const processOfflineWords = (words: any[]) => {
    const bookMap = new Map<string, BookWithWords>()
    let totalMastered = 0
    let totalLearning = 0
    let totalNew = 0

    words.forEach((word) => {
      if (!word.book_id) return

      const bookId = word.book_id
      const bookTitle = 'کتاب ذخیره شده'

      if (!bookMap.has(bookId)) {
        bookMap.set(bookId, {
          book_id: bookId,
          book_title: bookTitle,
          book_slug: bookId,
          word_count: 0,
          mastered_count: 0,
          learning_count: 0,
          new_count: 0
        })
      }

      const book = bookMap.get(bookId)!
      book.word_count++

      if (word.mastery_level >= 5) {
        book.mastered_count++
        totalMastered++
      } else if (word.mastery_level >= 2) {
        book.learning_count++
        totalLearning++
      } else {
        book.new_count++
        totalNew++
      }
    })

    setBooks(Array.from(bookMap.values()))
    setStats({
      total_words: words.length,
      mastered: totalMastered,
      learning: totalLearning,
      new: totalNew
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-12 text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A961] mb-4">
            <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-[#D4AF37] via-[#C9A961] to-[#B8956A] bg-clip-text text-transparent">
            واژگان من
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            مجموعه کلمات ذخیره شده شما برای یادگیری و تمرین
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-base px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20">
              {stats.total_words.toLocaleString('fa-IR')} کلمه
            </Badge>
            {isOffline && (
              <Badge variant="outline" className="text-sm px-3 py-1.5 border-orange-500/30 text-orange-600 bg-orange-500/5">
                <CloudOff className="h-4 w-4 ml-1.5" />
                حالت آفلاین
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12"
        >
          <Card className="bg-gradient-to-br from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent border-[#D4AF37]/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-[#D4AF37]/10">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">مجموع کلمات</p>
                  <p className="text-3xl md:text-4xl font-bold text-[#D4AF37]">
                    {stats.total_words.toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">تسلط کامل</p>
                  <p className="text-3xl md:text-4xl font-bold text-green-600">
                    {stats.mastered.toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Brain className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">در حال یادگیری</p>
                  <p className="text-3xl md:text-4xl font-bold text-blue-600">
                    {stats.learning.toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">جدید</p>
                  <p className="text-3xl md:text-4xl font-bold text-purple-600">
                    {stats.new.toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Practice All Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 md:mb-12 text-center"
        >
          <Link href="/vocabulary/practice?mode=all">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:from-[#C9A961] hover:to-[#B8956A] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
            >
              <Brain className="ml-2 h-6 w-6" />
              تمرین همه کلمات ({stats.total_words.toLocaleString('fa-IR')} کلمه)
            </Button>
          </Link>
        </motion.div>

        {/* Info Card - What is Spaced Repetition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-10 md:mb-12 bg-gradient-to-br from-[#D4AF37]/5 to-transparent border-[#D4AF37]/20 shadow-lg">
            <CardContent className="pt-8 pb-8 px-6 md:px-8">
              <h3 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#D4AF37]/10">
                  <Brain className="h-6 w-6 text-[#D4AF37]" />
                </div>
                💡 سیستم تکرار فاصله‌دار چیست؟
              </h3>
              <ul className="space-y-4 text-sm md:text-base text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] font-bold text-lg">•</span>
                  <span>لغاتی که به درستی پاسخ می‌دهید، با فاصله زمانی بیشتر مرور می‌شوند</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] font-bold text-lg">•</span>
                  <span>لغاتی که اشتباه می‌کنید، زودتر برای مرور مجدد نمایش داده می‌شوند</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] font-bold text-lg">•</span>
                  <span>این روش علمی‌ترین راه برای یادگیری بلندمدت است</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] font-bold text-lg">•</span>
                  <span>با مرور منظم، لغات را برای همیشه یاد خواهید گرفت</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Books List */}
        {books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 mb-6">
                  <BookOpen className="h-12 w-12 opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mb-3">هنوز کلمه‌ای ذخیره نکرده‌اید</h3>
                <p className="text-base mb-6 max-w-md mx-auto">
                  شروع به خواندن کنید و کلمات جدید را ذخیره کنید تا یادگیری خود را آغاز کنید!
                </p>
                <Link href="/library">
                  <Button className="bg-[#D4AF37] hover:bg-[#C9A961]">
                    <BookOpen className="ml-2 h-5 w-5" />
                    رفتن به کتابخانه
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3"
            >
              <BookOpen className="h-8 w-8 text-[#D4AF37]" />
              کتاب‌های من
            </motion.h2>
            <AnimatePresence>
              {books.map((book, index) => (
                <motion.div
                  key={book.book_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Card className="hover:shadow-2xl transition-all duration-300 hover:border-[#D4AF37]/40 bg-gradient-to-br from-background to-muted/5">
                    <CardContent className="pt-8 pb-8 px-6 md:px-8">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1 w-full space-y-5">
                          {/* Book Title */}
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-[#D4AF37]/10">
                              <BookOpen className="h-7 w-7 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold">{book.book_title}</h3>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm md:text-base text-muted-foreground">
                              <span className="font-medium">پیشرفت یادگیری</span>
                              <span className="font-bold text-[#D4AF37]">
                                {book.mastered_count} / {book.word_count} کلمه
                              </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(book.mastered_count / book.word_count) * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                className="h-full bg-gradient-to-r from-[#D4AF37] via-[#C9A961] to-[#B8956A] shadow-lg"
                              />
                            </div>
                          </div>

                          {/* Stats Badges */}
                          <div className="flex gap-3 flex-wrap">
                            <Badge variant="secondary" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 px-3 py-1.5 text-sm">
                              📖 {book.word_count.toLocaleString('fa-IR')} کلمه
                            </Badge>
                            {book.mastered_count > 0 && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20 px-3 py-1.5 text-sm">
                                ✓ {book.mastered_count.toLocaleString('fa-IR')} تسلط
                              </Badge>
                            )}
                            {book.learning_count > 0 && (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/20 px-3 py-1.5 text-sm">
                                📚 {book.learning_count.toLocaleString('fa-IR')} یادگیری
                              </Badge>
                            )}
                            {book.new_count > 0 && (
                              <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 border-purple-500/20 px-3 py-1.5 text-sm">
                                ✨ {book.new_count.toLocaleString('fa-IR')} جدید
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-3 w-full lg:w-auto">
                          <Link href={`/vocabulary/practice?bookId=${book.book_id}`} className="flex-1 lg:flex-none">
                            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:from-[#C9A961] hover:to-[#B8956A] w-full lg:w-40 shadow-lg">
                              <Brain className="ml-2 h-5 w-5" />
                              تمرین
                            </Button>
                          </Link>
                          <Link href={`/vocabulary/words?bookId=${book.book_id}`} className="flex-1 lg:flex-none">
                            <Button variant="outline" className="w-full lg:w-40 border-[#D4AF37]/30 hover:bg-[#D4AF37]/5">
                              <BookOpen className="ml-2 h-5 w-5" />
                              مشاهده کلمات
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
