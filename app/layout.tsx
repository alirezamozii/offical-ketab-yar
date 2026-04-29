import { GamificationProvider } from "@/components/gamification/gamification-provider"
import { ConditionalLayout } from "@/components/layout/conditional-layout"
import { NavigationProgress } from "@/components/layout/navigation-progress"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { PWAWrapper } from "@/components/pwa/pwa-wrapper"
import { AuthProvider } from "@/hooks/use-supabase-auth"
import type { Metadata, Viewport } from "next"
import { Inter, Vazirmatn } from "next/font/google"
import { Toaster } from "sonner"
import { Agentation } from "agentation"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ketabyar.ir"),
  title: {
    default: "کتاب‌یار - پلتفرم هوشمند مطالعه دوزبانه با AI",
    template: "%s | کتاب‌یار"
  },
  description: "بیش از 1000 کتاب انگلیسی را رایگان و دوزبانه بخوانید. با هوش مصنوعی Gemini، واژگان هوشمند، گیمیفیکیشن و تجربه مطالعه واقع‌گرایانه. شروع رایگان، بدون نیاز به کارت اعتباری.",
  keywords: ["کتاب انگلیسی", "مطالعه آنلاین", "یادگیری زبان", "کتاب دوزبانه", "کتاب رایگان", "AI", "هوش مصنوعی", "Gemini", "واژگان انگلیسی", "کتاب‌یار", "book reading", "bilingual books"],
  authors: [{ name: "تیم کتاب‌یار" }],
  creator: "کتاب‌یار",
  publisher: "کتاب‌یار",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://ketabyar.ir",
    title: "کتاب‌یار - پلتفرم هوشمند مطالعه دوزبانه با AI",
    description: "بیش از 1000 کتاب انگلیسی را رایگان و دوزبانه بخوانید. با هوش مصنوعی، واژگان هوشمند و گیمیفیکیشن",
    siteName: "کتاب‌یار",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "کتاب‌یار",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "کتاب‌یار - پلتفرم هوشمند مطالعه دوزبانه با AI",
    description: "بیش از 1000 کتاب انگلیسی را رایگان و دوزبانه بخوانید. با هوش مصنوعی، واژگان هوشمند و گیمیفیکیشن",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://ketabyar.ir",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C9A961" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="h-full w-full">
      <head>
        {/* PWA Meta Tags for Native App Feel */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="کتاب‌یار" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} ${vazirmatn.variable} font-vazirmatn antialiased min-h-screen w-full flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <GamificationProvider>
                <PWAWrapper>
                  {/* Global Navigation Progress Bar - Shows on ALL link clicks */}
                  <NavigationProgress />

                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  <Toaster
                    position="bottom-center"
                    richColors
                    toastOptions={{
                      className: 'bottom-nav-safe',
                      style: {
                        marginBottom: 'env(safe-area-inset-bottom)',
                      }
                    }}
                  />
                </PWAWrapper>
              </GamificationProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && (
          <Agentation endpoint="http://localhost:4747" />
        )}
      </body>
    </html>
  )
}
