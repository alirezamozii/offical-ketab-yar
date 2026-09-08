import { safeJsonLd } from '@/lib/json-ld'
import { SITE } from '@/lib/site'
import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'سوالات متداول — بوکزی',
  description:
    'پاسخ سوال‌های رایج درباره بوکزی و نحوه استفاده از آن: مطالعه دوزبانه، دیکشنری، هایلایت، واژگان و هوش مصنوعی. راهنمای کامل کاربران.',
  keywords: [
    'سوالات متداول بوکزی',
    'راهنما بوکزی',
    'نحوه استفاده از بوکزی',
    'دیکشنری هوشمند',
    'هایلایت',
    'واژگان',
    'هوش مصنوعی',
    'پرسش و پاسخ',
    'FAQ bookzi',
    'how to use',
  ],
  alternates: { canonical: `${SITE.url}/help` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/help`,
    title: 'سوالات متداول بوکزی',
    description:
      'پاسخ سوال‌های رایج درباره مطالعه دوزبانه، دیکشنری، هایلایت، واژگان و هوش مصنوعی در بوکزی.',
    siteName: 'بوکزی',
    images: [
      {
        url: '/api/og?title=FAQ&subtitle=Frequently%20asked%20questions',
        width: 1200,
        height: 630,
        alt: 'سوالات متداول بوکزی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوالات متداول بوکزی',
    description: 'پاسخ سوال‌های رایج درباره نحوه استفاده از بوکزی.',
    images: ['/api/og?title=FAQ&subtitle=Frequently%20asked%20questions'],
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

const FAQS = [
  {
    q: 'آیا استفاده از بوکزی رایگان است؟',
    a: 'بله. مطالعه کتاب‌ها، دیکشنری، ذخیره واژگان و هایلایت‌ها رایگان است. برخی ویژگی‌های پیشرفته در نسخه پریمیوم قرار دارند.',
  },
  {
    q: 'چگونه شروع به خواندن کنم؟',
    a: 'به بخش کتابخانه بروید، کتابی را انتخاب کنید و روی «شروع مطالعه» بزنید. متن انگلیسی همراه با ترجمه فارسی نمایش داده می‌شود.',
  },
  {
    q: 'چطور معنی یک کلمه را ببینم؟',
    a: 'در حالت مطالعه، کلمه را با موس یا انگشت انتخاب کنید. منوی کوچکی ظاهر می‌شود؛ روی آیکون کتاب بزنید تا دیکشنری هوشمند باز شود.',
  },
  {
    q: 'آیا می‌توانم هایلایت کنم؟',
    a: 'بله. متنی را انتخاب کنید و یکی از رنگ‌های هایلایت را بزنید. هایلایت‌ها برای هر کتاب ذخیره می‌شوند و از پنل هایلایت‌ها قابل مرورند.',
  },
  {
    q: 'هوش مصنوعی چطور کمک می‌کند؟',
    a: 'با زدن آیکون چت در نوار بالای صفحه مطالعه، می‌توانید درباره متن صفحه، کلمات یا پیرنگ کتاب سوال بپرسید.',
  },
  {
    q: 'واژگان ذخیره‌شده کجا هستند؟',
    a: 'در بخش «واژگان» از منوی بالا یا نوار پایین. می‌توانید آن‌ها را جستجو، تلفظ بشنوید یا حذف کنید.',
  },
]

// FAQ structured data — every FAQ item gets a Question/Answer pair so search
// engines can render rich FAQ snippets.
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE.url}/help#faq`,
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  })),
}

export default function HelpPage() {
  return (
    <>
      <script
        id="help-faq-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8 space-y-3 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <HelpCircle className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          سوالات متداول
        </h1>
        <p className="text-muted-foreground">
          اگر سوال شما اینجا نبود، با ما در ارتباط باشید.
        </p>
      </header>

      <section aria-label="پاسخ سوال‌های متداول" className="space-y-3">
        {FAQS.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-border/60 bg-card px-4 shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-right font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-4 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </section>

      <div className="mt-10 text-center">
        <Link
          href="/support"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          تماس با پشتیبانی
        </Link>
      </div>
      </div>
    </>
  )
}
