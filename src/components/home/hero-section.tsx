import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ShieldCheck,
  Sparkles,
  Trophy,
  ImageIcon,
  Languages,
} from 'lucide-react'
import Link from 'next/link'
import { Magnetic } from '@/components/home/magnetic'
import { AnimatedGlowBorder } from '@/components/ui/animated-glow-border'
import { RandomBookButton } from '@/components/home/random-book-button'

const VALUE_PILLS = [
  { icon: Languages, label: 'دوزبانه فارسی/انگلیسی' },
  { icon: Brain, label: 'هوش مصنوعی' },
  { icon: Trophy, label: 'بازی‌وارسازی' },
]

export function HeroSection(_props: { booksCount?: number } = {}) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-gold-50 via-beige-100 to-gold-200/60 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(184,149,106,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(212,175,55,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30 dark:opacity-20" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-1/4 top-1/4 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl dark:bg-gold-500/5 transform-gpu"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 md:pb-12 md:pt-14 lg:pb-16 lg:pt-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-3.5 text-center lg:space-y-4 lg:text-start">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/50 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-800 backdrop-blur-md dark:border-gold-500/20 dark:text-gold-300">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
              <span>پلتفرم هوشمند مطالعه دوزبانه</span>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <h1
                id="hero-heading"
                className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl text-foreground"
              >
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-x-8 -inset-y-4 rounded-full bg-gold-500/15 blur-2xl dark:bg-gold-400/20 dark:blur-3xl transform-gpu"
                  />
                  <span className="relative text-gold-600 dark:text-gold-400 font-black">
                    بوکزی
                  </span>
                </span>
                <span className="block text-lg font-extrabold leading-snug text-foreground/90 sm:text-2xl lg:text-3xl mt-1">
                  زیست‌بومِ کتاب‌های دوزبانه
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:justify-start">
              {VALUE_PILLS.map((p) => {
                const Icon = p.icon
                return (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-1 rounded-full border border-gold-400/25 bg-card/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs"
                  >
                    <Icon aria-hidden="true" className="h-3 w-3 text-gold-600 dark:text-gold-400" />
                    {p.label}
                  </span>
                )
              })}
            </div>

            <p className="mx-auto max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed lg:mx-0">
              ترجمه پاراگراف به پاراگراف، دیکشنری فوری، چت هوش مصنوعی و سیستم امتیازدهی. یادگیری انگلیسی با لذت خواندن داستان‌های اصیل.
            </p>

            <div className="flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row sm:gap-3 lg:justify-start pt-1">
              <Magnetic strength={12} className="w-full sm:w-auto">
                <div className="group/cta relative w-full sm:w-auto">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-xl bg-gold-500/25 opacity-40 blur-md transition-opacity duration-300 group-hover/cta:opacity-80"
                  />
                  <Button
                    asChild
                    variant="glow"
                    className="relative h-11 w-full overflow-hidden rounded-xl px-5 text-sm font-bold sm:h-12 sm:rounded-2xl sm:px-7 sm:text-base sm:w-auto"
                  >
                    <Link
                      href="/library"
                      prefetch={false}
                      aria-label="شروع رایگان — ورود به کتابخانه"
                      title="شروع رایگان"
                    >
                      <AnimatedGlowBorder color="rgba(255,255,255,0.9)" thickness={2} />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[1100ms] ease-out-expo group-hover/cta:translate-x-full" />
                      </span>
                      <BookOpen aria-hidden="true" className="relative h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      <span className="relative">شروع رایگان</span>
                      <ArrowLeft aria-hidden="true" className="relative h-4.5 w-4.5 transition-transform duration-300 ease-out-expo group-hover/cta:-translate-x-1 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                </div>
              </Magnetic>

              <Magnetic strength={10} className="w-full sm:w-auto">
                <RandomBookButton className="h-11 w-full rounded-xl text-xs font-semibold sm:h-12 sm:rounded-2xl sm:text-sm sm:w-auto" />
              </Magnetic>
            </div>

            {/* Trust microcopy */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80 sm:text-xs lg:justify-start pt-1">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                بدون ثبت‌نام
              </span>
              <span aria-hidden="true">·</span>
              <span>۱۰۰٪ رایگان</span>
              <span aria-hidden="true">·</span>
              <span>دسترسی آفلاین</span>
            </div>
          </div>

          {/* Image placeholder — LEFT side on desktop (RTL: visual end).
              Per user feedback: "من بعدا سمت چپ لی اوت اینا هالی باشه من
              بعدا یه عکسی از مسکات ما میزارم فعلا درست نشده ولی دوتایی
              لی اوت توبر عکسه".
              This is a placeholder where the user will later drop a
              screenshot/mockup of the app. For now it's an elegant empty
              frame with a subtle gold gradient + icon, so the layout
              looks intentional rather than unfinished.
              Hidden on mobile (saves space, text-only is fine there). */}
          <div
            className="relative hidden lg:block"
            aria-label="محل نمایش تصویر برنامه (به‌زودی)"
          >
            <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/10 via-card to-gold-700/10 shadow-2xl">
              {/* Ambient halos matching the hero palette — GPU radial gradient */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 10% 10%, rgba(212,175,55,0.15) 0%, transparent 60%), radial-gradient(circle at 90% 90%, rgba(138,104,71,0.15) 0%, transparent 60%)',
                }}
              />
              {/* Gilded top hairline */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
              />
              {/* Centered placeholder icon + label */}
              <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/30 to-gold-600/20 text-gold-700 dark:text-gold-300">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl bg-gold-500/20 blur-md"
                  />
                  <ImageIcon className="relative h-10 w-10" strokeWidth={1.5} />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground/80">
                    محل نمایش تصویر برنامه
                  </p>
                  <p className="text-xs text-muted-foreground">
                    اسکرین‌شات یا موکاپ در اینجا قرار می‌گیرد
                  </p>
                </div>
              </div>
              {/* Decorative corner accents — subtle frame detailing */}
              <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-gold-400/40" aria-hidden="true" />
              <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-gold-400/40" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-gold-400/40" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-gold-400/40" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-down indicator — removed per user feedback to save vertical
          space and ensure the hero fits in one viewport without scrolling. */}
    </section>
  )
}


