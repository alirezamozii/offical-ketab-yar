'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Play, Sparkles, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {

  return (
    <section className="relative min-h-[100vh] overflow-hidden bg-gradient-to-br from-warm-50 via-warm-100 to-warm-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced background elements - Agent 3 Psychology */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,97,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.15),transparent_50%)]" />
        {/* Subtle dot pattern for depth */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-30" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content - Fixed Text Overflow */}
          <div className="space-y-8 text-center lg:text-right overflow-hidden">
            {/* Badge */}
            <div className="inline-block">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-beige-200 dark:bg-gold-500/10 border border-beige-300 dark:border-gold-500/20">
                <Sparkles className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                <span className="text-sm font-semibold text-gold-700 dark:text-gold-400">
                  پلتفرم مطالعه هوشمند با AI
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/15 dark:bg-gold-500/20">
                  <TrendingUp className="h-3 w-3 text-gold-700 dark:text-gold-400" />
                  <span className="text-xs font-bold text-gold-700 dark:text-gold-400">جدید</span>
                </div>
              </div>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.1] break-words">
                <span className="inline-block bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent">
                  کتاب‌یار
                </span>
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground/90 break-words">
                همراه هوشمند مطالعه
              </h2>
            </div>

            {/* Description - Fixed Overflow */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              تجربه‌ای متفاوت در دنیای کتاب با هوش مصنوعی Gemini، پشتیبانی دوزبانه و ورق زدن واقعی صفحات. یادگیری زبان انگلیسی هرگز این‌قدر لذت‌بخش نبوده
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="xl"
                variant="glow"
                className="group text-lg px-10"
                asChild
              >
                <Link href="/library">
                  <BookOpen className="h-5 w-5" />
                  شروع مطالعه رایگان
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group text-lg px-8 h-14 transition-all duration-200"
                asChild
              >
                <Link href="/about">
                  <Play className="h-5 w-5 ml-2" />
                  تماشای ویدیو معرفی
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-foreground">+50,000</div>
                  <div className="text-xs text-muted-foreground">کاربر فعال</div>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-foreground">4.9/5</div>
                  <div className="text-xs text-muted-foreground">از 2,500+ نظر</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right content - Book showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-2xl mx-auto">
              {/* Floating books */}
              <motion.div
                className="absolute top-0 right-0 w-48 h-64 rounded-lg shadow-2xl overflow-hidden transform rotate-6"
                animate={{
                  y: [0, -20, 0],
                  rotate: [6, 8, 6],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <BookOpen className="h-20 w-20 text-white/90" />
                </div>
              </motion.div>

              <motion.div
                className="absolute top-20 left-0 w-56 h-72 rounded-lg shadow-2xl overflow-hidden transform -rotate-6"
                animate={{
                  y: [0, 20, 0],
                  rotate: [-6, -8, -6],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-white/90" />
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-0 right-1/4 w-52 h-68 rounded-lg shadow-2xl overflow-hidden transform rotate-3"
                animate={{
                  y: [0, -15, 0],
                  rotate: [3, 5, 3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-gold-600 to-gold-800 flex items-center justify-center">
                  <BookOpen className="h-22 w-22 text-white/90" />
                </div>
              </motion.div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/20 via-transparent to-gold-400/20 blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-medium">اسکرول کنید</span>
          <div className="w-6 h-10 rounded-full border-2 border-gold-500/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-gold-500"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
