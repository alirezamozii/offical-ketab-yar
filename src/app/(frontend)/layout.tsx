import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { safeJsonLd } from '@/lib/json-ld'
import { SkipLink } from '@/components/layout/skip-link'
import { RegisterSW } from '@/components/pwa/register-sw'
import { SITE } from '@/lib/site'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { WebVitals } from '@/components/analytics/WebVitals'
import '@/app/globals.css'

const vazirmatn = localFont({
  src: '../../../public/fonts/Vazirmatn-subset.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
  weight: '100 900',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

const SITE_URL = SITE.url

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'بوکزی | زیست‌بومِ کتاب‌های دوزبانه',
    template: '%s | بوکزی',
  },
  description:
    'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی، دیکشنری در لحظه، واژگان‌ساز و استودیوی کوت.',
  applicationName: 'بوکزی',
  category: 'education',
  // ─── PWA icons (PNG, satisfies Chrome's installability criteria) ──────────
  // The manifest icons (declared in /public/manifest.json) handle the PWA
  // install prompt; these <link rel="icon"> / "apple-touch-icon" entries
  // cover browser tabs, bookmarks, and iOS home-screen adds. Audit 08 §D-6
  // flagged that the old SVG-only setup failed Chrome's PNG-icon check.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  keywords: [
    'بوکزی',
    'Bookzi',
    'زیست‌بوم کتاب‌های دوزبانه',
    'کتاب انگلیسی',
    'مطالعه آنلاین',
    'یادگیری زبان',
    'کتاب دوزبانه',
    'کتاب رایگان',
    'هوش مصنوعی',
    'دیکشنری هوشمند',
    'English books',
    'bilingual reading',
    'learn English with books',
    'کتاب‌های انگلیسی با زیرنویس',
    'ترجمه فارسی کتاب',
    'مطالعه کتاب با AI',
    'واژگان انگلیسی',
    'داستان انگلیسی',
  ],
  authors: [{ name: 'تیم بوکزی' }],
  creator: 'بوکزی',
  publisher: 'بوکزی',
  manifest: '/manifest.json',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_URL,
    siteName: 'بوکزی',
    title: 'بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description:
      'کتاب‌های انگلیسی را با ترجمه موازی فارسی، دیکشنری در لحظه، فلش‌کارت و استودیوی کوت بخوانید.',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'بوکزی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description: 'مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی و هوش مصنوعی در بوکزی',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: 'بوکزی',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  verification: {
    google: '',
    yandex: '',
    yahoo: '',
  },
  other: {
    'google-site-verification': '',
    'msvalidate.01': '',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // viewport-fit=cover — required for `env(safe-area-inset-*)` to work on
  // iPhone with notch / Dynamic Island. Without this, the safe-area insets
  // all resolve to 0 and our bottom-nav / header safe-area padding is a no-op.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#b8956a' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1612' },
  ],
}

/** Global Organization + WebSite structured data, rendered once in <head>. */
const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'بوکزی',
  alternateName: 'Bookzi',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.svg`,
    width: 512,
    height: 512,
  },
  image: `${SITE_URL}/logo.svg`,
  description:
    'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی، دیکشنری در لحظه، واژگان‌ساز و استودیوی کوت.',
  foundingDate: '2024',
  foundingLocation: {
    '@type': 'Place',
    name: 'Iran',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Iran',
  },
  knowsAbout: [
    'English language learning',
    'Bilingual reading',
    'Artificial intelligence for education',
    'English literature',
    'Persian translation',
    'Spaced repetition vocabulary',
  ],
  sameAs: [
    SITE.social.twitter,
    SITE.social.instagram,
    SITE.social.telegram,
    SITE.social.github,
    SITE.social.youtube,
  ],
  email: SITE.email,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/support`,
      email: SITE.email,
      availableLanguage: ['Persian', 'English'],
      areaServed: 'IR',
    },
  ],
}

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'بوکزی',
  alternateName: 'Bookzi',
  url: SITE_URL,
  inLanguage: 'fa-IR',
  publisher: { '@id': `${SITE_URL}/#organization` },
  description:
    'پلتفرم هوشمند مطالعه دوزبانه کتاب‌های انگلیسی با هوش مصنوعی، دیکشنری و واژگان‌ساز.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/library?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);addEventListener('DOMContentLoaded',function(){var b=document.getElementById('theme-toggle');if(b)b.addEventListener('click',function(){var n=!document.documentElement.classList.contains('dark');document.documentElement.classList.toggle('dark',n);localStorage.setItem('theme',n?'dark':'light')})})}catch(e){}",
          }}
        />
        {/* The browser locale is Persian (fa-IR). Provide an English fallback
            via an alternate-language link for SEO + screen readers.
            H-19: the previous `hrefLang="en"` line pointed at `${SITE_URL}/en`
            — there is NO `/en` route, so Google would crawl it and 404. Only
            the canonical fa-IR + x-default remain. */}
        <link rel="alternate" hrefLang="fa-IR" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationLd) }}
        />
        <script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteLd) }}
        />
      </head>
      <body
        className={`${vazirmatn.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        {/* SkipLink must be the FIRST focusable element on every page so
            keyboard users can immediately bypass the header / nav. */}
        <SkipLink />
        {/* Registered immediately (not behind the deferred/interaction
            gates): nothing renders, and without it the app cannot work
            offline on the first minutes of a fresh visit. */}
        <RegisterSW />
        <ConditionalLayout>{children}</ConditionalLayout>
        {process.env.NEXT_PUBLIC_SENTRY_DSN ? <WebVitals /> : null}
      </body>
    </html>
  )
}
