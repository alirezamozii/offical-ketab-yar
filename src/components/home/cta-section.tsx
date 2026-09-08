import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Gift,
  ImageIcon,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Magnetic } from '@/components/home/magnetic'

const BENEFITS = [
  'کتاب‌های جذاب انگلیسی — رایگان',
  'ترجمه فارسی کنار هر پاراگراف',
  'چت با هوش مصنوعی، برای وقت‌هایی که تنهایی',
]

export function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-600 via-gold-500 to-gold-700 px-6 py-12 shadow-2xl shadow-gold-500/30 sm:px-10 sm:py-14"
      >
        {/* Texture — kept subtle */}
        <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-15" />
        {/* Single soft radial glow — much calmer than 4 mesh spots */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 80% 20%, rgba(255, 245, 215, 0.4), transparent 60%)',
          }}
        />

        {/* Two-column grid: text (right in RTL) + image placeholder (left) */}
        <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ─── Copy + CTAs (right side on desktop RTL) ─── */}
          <div className="space-y-5 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              همین امروز شروع کن
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow sm:text-4xl">
              یادگیری زبان با کتاب، هوش مصنوعی و بازی
            </h2>
            <p className="mx-auto max-w-xl text-base text-white/90 sm:text-lg lg:mx-0">
              اولین کتاب انگلیسی‌ات را همین حالا باز کن — رایگان، بدون ثبت‌نام و
              بدون محدودیت زمانی.
            </p>

            {/* Benefit bullets — right-aligned */}
            <ul className="mx-auto flex max-w-xl flex-col gap-2.5 lg:mx-0">
              {BENEFITS.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 text-sm font-medium text-white/95 sm:text-base"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row lg:justify-start">
              <Magnetic strength={12} className="w-full sm:w-auto">
                <Button
                  asChild
                  size="xl"
                  className="group/cta relative w-full overflow-hidden bg-white text-gold-800 shadow-xl hover:bg-white/90 sm:w-auto"
                >
                  <Link href="/library" prefetch={false} aria-label="ورود به کتابخانه">
                    {/* Shimmer sweep on hover */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold-400/30 to-transparent transition-transform duration-[1100ms] ease-out-expo group-hover/cta:translate-x-full" />
                    </span>
                    <BookOpen className="relative h-5 w-5" />
                    <span className="relative">ورود به کتابخانه</span>
                    <ArrowLeft className="relative h-5 w-5 transition-transform duration-300 ease-out-expo group-hover/cta:-translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="border-white/70 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href="/vocabulary/game" prefetch={false} aria-label="بازی واژگان">
                  <Gift className="h-5 w-5" />
                  بازی واژگان
                </Link>
              </Button>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pt-2 text-xs text-white/80 lg:justify-start">
              <span>رایگان برای همیشه</span>
              <span aria-hidden="true">·</span>
              <span>بدون پرداخت</span>
              <span aria-hidden="true">·</span>
              <span>بدون ثبت‌نام</span>
            </div>
          </div>

          {/* ─── Image placeholder (left side on desktop RTL) ─── */}
          <div
            className="relative hidden lg:block"
            aria-label="محل نمایش تصویر برنامه (به‌زودی)"
          >
            <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-white/30 bg-white/10 shadow-2xl backdrop-blur-sm">
              {/* Centered placeholder icon + label */}
              <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl bg-white/15 blur-md"
                  />
                  <ImageIcon className="relative h-10 w-10" strokeWidth={1.5} />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white/90">
                    محل نمایش تصویر برنامه
                  </p>
                  <p className="text-xs text-white/70">
                    اسکرین‌شات یا موکاپ در اینجا قرار می‌گیرد
                  </p>
                </div>
              </div>
              {/* Decorative corner accents */}
              <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-white/40" aria-hidden="true" />
              <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-white/40" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-white/40" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-white/40" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

