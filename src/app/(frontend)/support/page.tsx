import { SITE } from '@/lib/site'
import { SupportForm } from '@/components/support/support-form'
import { Mail, MessageCircle, Clock, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'پشتیبانی — کتاب‌یار',
  description:
    'سوال، پیشنهاد یا گزارش مشکل خود را برای ما بفرستید. تیم پشتیبانی کتاب‌یار معمولاً ظرف ۲۴ ساعت پاسخ می‌دهد.',
  keywords: [
    'پشتیبانی کتاب‌یار',
    'تماس با کتاب‌یار',
    'گزارش مشکل',
    'پیشنهاد',
    'سوال',
    'contact us',
    'support',
  ],
  alternates: { canonical: `${SITE.url}/support` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/support`,
    title: 'پشتیبانی کتاب‌یار',
    description:
      'سوال، پیشنهاد یا گزارش مشکل خود را برای تیم کتاب‌یار بفرستید.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Support&subtitle=Get%20in%20touch',
        width: 1200,
        height: 630,
        alt: 'پشتیبانی کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'پشتیبانی کتاب‌یار',
    description: 'سوال، پیشنهاد یا گزارش مشکل خود را برای ما بفرستید.',
    images: ['/api/og?title=Support&subtitle=Get%20in%20touch'],
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

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <header className="mb-8 space-y-3 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <MessageCircle className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          پشتیبانی
        </h1>
        <p className="text-muted-foreground">
          خوشحال می‌شویم نظرتان را بشنویم. معمولاً ظرف ۲۴ ساعت پاسخ می‌دهیم.
        </p>
      </header>

      {/* Quick info cards — response time + privacy */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 text-center shadow-sm">
          <Clock className="mx-auto mb-1.5 h-5 w-5 text-gold-600 dark:text-gold-400" />
          <p className="text-xs font-semibold">زمان پاسخ</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            معمولاً کمتر از ۲۴ ساعت
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 text-center shadow-sm">
          <Mail className="mx-auto mb-1.5 h-5 w-5 text-gold-600 dark:text-gold-400" />
          <p className="text-xs font-semibold">ایمیل مستقیم</p>
          <p className="mt-0.5 break-all text-xs text-muted-foreground" dir="ltr">
            {SITE.email}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 text-center shadow-sm">
          <Shield className="mx-auto mb-1.5 h-5 w-5 text-gold-600 dark:text-gold-400" />
          <p className="text-xs font-semibold">حریم خصوصی</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            اطلاعات شما محرمانه می‌ماند
          </p>
        </div>
      </div>

      <SupportForm />
    </div>
  )
}
