import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { safeJsonLd } from '@/lib/json-ld'
import { CommandPalette } from '@/components/layout/command-palette'
import { OnboardingTrigger } from '@/components/onboarding/onboarding-trigger'
import { SkipLink } from '@/components/layout/skip-link'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { RegisterSW } from '@/components/pwa/register-sw'
import { OfflineBanner } from '@/components/pwa/offline-banner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
import { OnboardingGate } from '@/components/providers/onboarding-gate'
import { SignupPrompt } from '@/components/providers/signup-prompt'
import { SessionSummaryToast } from '@/components/reader/session-summary-toast'
import { MilestoneToast } from '@/components/reader/milestone-toast'
import { QueryProvider } from '@/components/providers/query-provider'
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SITE } from '@/lib/site'
import type { Metadata, Viewport } from 'next'
import { Inter, Vazirmatn } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
})

const SITE_URL = SITE.url

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'کتاب‌یار | مطالعه دوزبانه کتاب انگلیسی با هوش مصنوعی',
    template: '%s | کتاب‌یار',
  },
  description:
    'کتاب‌های کلاسیک انگلیسی را رایگان و دوزبانه بخوانید. ورق زدن واقعی صفحات، دیکشنری هوشمند، واژگان و چت با هوش مصنوعی. یادگیری زبان انگلیسی با کتاب.',
  applicationName: 'کتاب‌یار',
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
    'کتاب انگلیسی',
    'مطالعه آنلاین',
    'یادگیری زبان',
    'کتاب دوزبانه',
    'کتاب رایگان',
    'هوش مصنوعی',
    'دیکشنری',
    'کتاب‌یار',
    'English books',
    'bilingual reading',
    'learn English with books',
    'کتاب‌های کلاسیک انگلیسی',
    'آلیس در سرزمین عجایب',
    'ترجمه فارسی کتاب',
    'مطالعه کتاب با AI',
    'واژگان انگلیسی',
    'داستان انگلیسی',
  ],
  authors: [{ name: 'تیم کتاب‌یار' }],
  creator: 'کتاب‌یار',
  publisher: 'کتاب‌یار',
  manifest: '/manifest.json',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_URL,
    siteName: 'کتاب‌یار',
    title: 'کتاب‌یار - پلتفرم هوشمند مطالعه دوزبانه با AI',
    description:
      'کتاب‌های کلاسیک انگلیسی را رایگان و دوزبانه بخوانید. ورق زدن واقعی، دیکشنری هوشمند و چت با هوش مصنوعی.',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کتاب‌یار - مطالعه دوزبانه با AI',
    description: 'کتاب‌های کلاسیک انگلیسی رایگان با مطالعه دوزبانه و هوش مصنوعی',
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
    title: 'کتاب‌یار',
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
  name: 'کتاب‌یار',
  alternateName: 'Ketab-Yar',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.svg`,
    width: 512,
    height: 512,
  },
  image: `${SITE_URL}/logo.svg`,
  description:
    'پلتفرم هوشمند مطالعه دوزبانه کتاب‌های انگلیسی با هوش مصنوعی، دیکشنری و واژگان‌ساز.',
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
  name: 'کتاب‌یار',
  alternateName: 'Ketab-Yar',
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
        {/* The browser locale is Persian (fa-IR). Provide an English fallback
            via an alternate-language link for SEO + screen readers.
            H-19: the previous `hrefLang="en"` line pointed at `${SITE_URL}/en`
            — there is NO `/en` route, so Google would crawl it and 404. Only
            the canonical fa-IR + x-default remain. */}
        <link rel="alternate" hrefLang="fa-IR" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
      </head>
      <body
        className={`${inter.variable} ${vazirmatn.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        {/* SkipLink must be the FIRST focusable element on every page so
            keyboard users can immediately bypass the header / nav. */}
        <SkipLink />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteLd) }}
        />
        {/* PWA install prompt — listens for beforeinstallprompt and shows a
            dismissible gold-themed banner. Renders null until the event
            fires, so it's a no-op on browsers that don't support PWA
            install (Safari iOS) or when the app is already installed. */}
        <InstallPrompt />
        {/* Service worker registration — registers /sw.js in production
            for offline caching + PWA installability. Skipped in dev to
            avoid stale-content bugs. */}
        <RegisterSW />
        <OfflineBanner />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <SmoothScrollProvider>
                <ConditionalLayout>
                  <OnboardingGate>{children}</OnboardingGate>
                </ConditionalLayout>
              </SmoothScrollProvider>
              <CommandPalette />
              {/* First-run onboarding wizard — renders the multi-step dialog
                  only when the user hasn't completed/skipped it yet. Renders
                  null on subsequent visits. */}
              <OnboardingTrigger />
              {/* Reading Reminders — schedules daily/streak notifications,
                  listens for XP/achievement events, and shows a permission-
                  request banner when reminders are enabled but permission
                  hasn't been granted yet. No-op when notifications aren't
                  supported. */}
              <NotificationsProvider />
              {/* Signup prompt — auto-shown after a guest reads a few pages,
                  nudging them to sign up so their progress is preserved. */}
              <SignupPrompt />
              <SessionSummaryToast />
              <MilestoneToast />
              <Toaster
                position="bottom-center"
                richColors
                toastOptions={{
                  className: 'mb-safe',
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
