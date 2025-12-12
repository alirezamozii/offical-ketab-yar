'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Eye, Heart, Lock, Star, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface BookDetailClientProps {
  book: any
  analytics: any
}

export function BookDetailClient({ book, analytics }: BookDetailClientProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Get user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // Handle author - can be string or object
  const authorName = typeof book.author === 'string' 
    ? book.author 
    : book.author?.name || book.authors?.name || 'نویسنده ناشناس'
  
  const isPremium = book.is_premium || false
  const freePages = book.free_preview_pages || 20

  const handleStartReading = async () => {
    setIsLoading(true)

    // Track book view
    try {
      await fetch('/api/books/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      })
    } catch (error) {
      console.error('Failed to track view:', error)
    }

    router.push(`/books/read/${book.slug}`)
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('برای لایک کردن کتاب، ابتدا وارد شوید')
      router.push('/auth/login')
      return
    }

    setIsLiked(!isLiked)
    toast.success(isLiked ? 'کتاب از علاقه‌مندی‌ها حذف شد' : 'کتاب به علاقه‌مندی‌ها اضافه شد')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Book Cover & Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-24 overflow-hidden border-2 border-beige-300 dark:border-gold-500/20">
              <CardContent className="p-6">
                {/* Book Cover */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-2xl">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={`جلد کتاب ${book.title}`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold-400/20 to-gold-600/20">
                      <BookOpen className="h-24 w-24 text-gold-500" />
                    </div>
                  )}

                  {/* Premium Badge */}
                  {isPremium && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-gold-500 to-gold-600 text-white">
                        <Lock className="mr-1 h-3 w-3" />
                        پرمیوم
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {/* Agent 3: Primary CTA with attractive design */}
                  <Button
                    onClick={handleStartReading}
                    disabled={isLoading}
                    variant="glow"
                    size="xl"
                    className="w-full text-lg"
                  >
                    <BookOpen className="ml-2 h-5 w-5" />
                    {isPremium ? `خواندن ${freePages} صفحه رایگان` : 'شروع مطالعه رایگان'}
                  </Button>

                  {/* Like Button */}
                  <Button
                    onClick={handleLike}
                    variant="outline"
                    className="w-full"
                  >
                    <Heart className={cn('ml-2 h-5 w-5', isLiked && 'fill-red-500 text-red-500')} />
                    {isLiked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                  </Button>
                </div>

                {/* Book Stats */}
                <div className="mt-6 space-y-3">
                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {analytics?.total_views && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{analytics.total_views.toLocaleString('fa-IR')} بازدید</span>
                      </div>
                    )}

                    {analytics?.average_rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{analytics.average_rating.toFixed(1)} ({analytics.total_ratings})</span>
                      </div>
                    )}

                    {book.total_pages && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{book.total_pages.toLocaleString('fa-IR')} صفحه</span>
                      </div>
                    )}

                    {book.level && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>سطح {book.level}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Book Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Title & Author */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient-bronze">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-xl text-muted-foreground mb-4">{book.subtitle}</p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href={`/authors/${book.author_id}`}
                  className="text-lg text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {authorName}
                </Link>
                <Badge variant="outline">{book.language === 'english' ? 'انگلیسی' : 'فارسی'}</Badge>
                {book.publication_year && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {book.publication_year}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {book.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">درباره کتاب</h2>
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                    {book.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* What You Get */}
            <Card className="border-2 border-beige-300 dark:border-gold-500/20">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">با مطالعه این کتاب چه چیزی دریافت می‌کنید؟</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-gold-500/15 p-1">
                      <BookOpen className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                    </div>
                    <div>
                      <p className="font-semibold">مطالعه دوزبانه</p>
                      <p className="text-sm text-muted-foreground">
                        متن انگلیسی با ترجمه فارسی در کنار هم
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-gold-600/15 p-1">
                      <Star className="h-4 w-4 text-gold-700 dark:text-gold-300" />
                    </div>
                    <div>
                      <p className="font-semibold">دیکشنری هوشمند</p>
                      <p className="text-sm text-muted-foreground">
                        معنی هر کلمه را با یک کلیک دریافت کنید
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-gold-700/15 p-1">
                      <TrendingUp className="h-4 w-4 text-gold-800 dark:text-gold-200" />
                    </div>
                    <div>
                      <p className="font-semibold">سیستم XP و پیشرفت</p>
                      <p className="text-sm text-muted-foreground">
                        با هر صفحه‌ای که می‌خوانید XP کسب کنید
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-gold-400/15 p-1">
                      <Heart className="h-4 w-4 text-gold-500 dark:text-gold-500" />
                    </div>
                    <div>
                      <p className="font-semibold">ذخیره واژگان</p>
                      <p className="text-sm text-muted-foreground">
                        کلمات جدید را ذخیره کنید و با فلش‌کارت تمرین کنید
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Teaser (Agent 3: FOMO Psychology) */}
            {isPremium && (
              <Card className="border-2 border-gold-500 bg-gradient-to-br from-beige-100 to-beige-50 dark:from-gold-500/8 dark:to-gold-600/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-gold-500 p-3">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {freePages} صفحه اول رایگان، بقیه با اشتراک پرمیوم
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        با اشتراک پرمیوم به بیش از 1000 کتاب کامل، واژگان نامحدود و ویژگی‌های ویژه دسترسی داشته باشید.
                      </p>
                      <Link href="/subscription">
                        <Button variant="premium">
                          مشاهده پلان‌های اشتراک
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
