import { Button } from '@/components/ui/button'
import { BookOpen, Brain, Heart, Languages, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'درباره بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
  description:
    'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. پلتفرمی برای مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی، دیکشنری در لحظه و واژگان‌ساز. مأموریت ما، ترکیب لذت خواندن با یادگیری زبان است.',
  keywords: [
    'درباره بوکزی',
    'بوکزی',
    'Bookzi',
    'زیست‌بوم کتاب‌های دوزبانه',
    'پلتفرم مطالعه دوزبانه',
    'یادگیری زبان با کتاب',
    'دیکشنری هوشمند',
    'مطالعه دوزبانه',
    'بوکزی چیست',
    'تیم بوکزی',
    'مأموریت بوکزی',
    'about bookzi',
  ],
  alternates: { canonical: `${SITE.url}/about` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/about`,
    title: 'درباره بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description:
      'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. پلتفرمی برای مطالعه رمان‌های انگلیسی با ترجمه موازی، دیکشنری و واژگان‌ساز.',
    siteName: 'بوکزی',
    images: [
      {
        url: '/api/og?title=About%20Bookzi&subtitle=The%20Bilingual%20Books%20Ecosystem',
        width: 1200,
        height: 630,
        alt: 'درباره بوکزی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'درباره بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description:
      'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه و مطالعه هوشمند رمان‌های انگلیسی.',
    images: ['/api/og?title=About%20Bookzi&subtitle=The%20Bilingual%20Books%20Ecosystem'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="space-y-8">
        <header className="space-y-3 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
            <BookOpen className="h-7 w-7" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            درباره بوکزی
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            ما باور داریم خواندن کتاب باید لذت‌بخش باشد و یادگیری زبان باید در
            دلِ همین لذت اتفاق بیفتد. بوکزی این دو را با هم ترکیب می‌کند.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Languages,
              title: 'دوزبانه واقعی',
              desc: 'هر پاراگراف انگلیسی، ترجمه فارسی روان در کنارش. نه معنی کلمه‌به‌کلمه، بلکه درک کل متن.',
            },
            {
              icon: Brain,
              title: 'هوش مصنوعی همراه',
              desc: 'هر سوال، هر شکی — یک دستیار هوشمند در کنار صفحه کتاب شما حاضر است.',
            },
            {
              icon: Sparkles,
              title: 'دیکشنری هوشمند',
              desc: 'روی هر کلمه بزنید: معنی، تلفظ، مثال و معادل فارسی، همه در یک لحظه.',
            },
            {
              icon: Heart,
              title: 'ساخته‌شده با عشق',
              desc: 'برای علاقه‌مندان به کتاب و زبان. رایگان، در دسترس و همیشه در حال بهتر شدن.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <f.icon className="mb-3 h-7 w-7 text-gold-600 dark:text-gold-400" />
              <h3 className="mb-1.5 text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild size="xl" variant="glow">
            <Link href="/library">شروع مطالعه</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
