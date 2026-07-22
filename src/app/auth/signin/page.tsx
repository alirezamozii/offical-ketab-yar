'use client'

/**
 * /auth/signin — Ketab-Yar sign-in page (premium edition)
 *
 * Brand: warm sepia/bronze (matches the main site theme).
 * Mobile-first, RTL Persian, large touch targets.
 *
 * Enhancements:
 *   - Animated entrance (framer-motion fade + slide)
 *   - Decorative floating book/quill icons in background
 *   - Subtle paper-texture overlay
 *   - Glowing brand block with pulse animation
 *   - Polished Google button with hover lift
 *   - Trust indicators (stats row)
 *   - Animated error display
 */

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense, useSyncExternalStore } from 'react'
import { GoogleIcon } from '@/components/icons/google-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMounted } from '@/hooks/use-mounted'
import {
  BookOpen,
  Loader2,
  AlertCircle,
  Sparkles,
  Globe,
  Feather,
  Library,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// On the client we can't read server env vars, so we detect whether Google
// is configured by fetching /api/auth/providers on mount (see googleReady state).

// Brand palette (warm sepia/bronze) — light mode
const BRAND_LIGHT = {
  bg: 'linear-gradient(135deg, #f5f2ed 0%, #ebe4d9 50%, #ddd0bd 100%)',
  cardBg: 'rgba(250, 249, 247, 0.95)',
  cardBorder: 'rgba(205, 184, 154, 0.4)',
  ink: '#3a2b20',
  muted: '#8a6847',
  goldDark: '#a67f56',
  statBg: 'rgba(250, 249, 247, 0.6)',
  statBorder: 'rgba(205, 184, 154, 0.25)',
  bronze: '#ddd0bd',
  gold: '#b8956a',
  bronzeDark: '#8a6847',
  brown: '#6d523a',
  brownDark: '#523d2c',
  creamLight: '#faf9f7',
  creamDark: '#ebe4d9',
  codeBg: '#ebe4d9',
  shadowColor: 'rgba(109, 82, 58, 0.2)',
}

// Brand palette — dark mode (warm dark brown, NOT pure black)
const BRAND_DARK = {
  bg: 'linear-gradient(135deg, #1a1410 0%, #261d16 50%, #2d231a 100%)',
  cardBg: 'rgba(38, 29, 22, 0.9)',
  cardBorder: 'rgba(184, 149, 106, 0.25)',
  ink: '#f5f2ed',
  muted: '#cdb89a',
  goldDark: '#b8956a',
  statBg: 'rgba(38, 29, 22, 0.6)',
  statBorder: 'rgba(184, 149, 106, 0.2)',
  bronze: '#5a4634',
  gold: '#b8956a',
  bronzeDark: '#a67f56',
  brown: '#8a6847',
  brownDark: '#a67f56',
  creamLight: '#2d231a',
  creamDark: '#1a1410',
  codeBg: '#1a1410',
  shadowColor: 'rgba(0, 0, 0, 0.5)',
}

function SignInForm() {
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'
  const error = params.get('error')
  const reduceMotion = useReducedMotion()

  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Read theme from localStorage via useSyncExternalStore so SSR + first
  // client render agree ('light'), then the browser snapshot kicks in
  // without an extra render. `overrideTheme` lets the user toggle.
  const storedTheme = useSyncExternalStore(
    () => () => {},
    () => {
      const stored = localStorage.getItem('ky-signin-theme')
      if (stored === 'dark' || stored === 'light') return stored
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
      return 'light'
    },
    () => 'light' as 'light' | 'dark',
  )
  const [overrideTheme, setOverrideTheme] = useState<'light' | 'dark' | null>(null)
  const theme = overrideTheme ?? storedTheme
  const mounted = useMounted()
  const [googleReady, setGoogleReady] = useState(false)

  // Check if Google provider is configured (server-side env var).
  // setState only happens inside async .then() — safe.
  useEffect(() => {
    let active = true
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((d) => {
        if (active) setGoogleReady(!!d.google)
      })
      .catch(() => {
        if (active) setGoogleReady(false)
      })
    return () => {
      active = false
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setOverrideTheme(next)
    localStorage.setItem('ky-signin-theme', next)
  }

  const B = theme === 'dark' ? BRAND_DARK : BRAND_LIGHT

  const errorMessages: Record<string, string> = {
    OAuthSignin: 'اتصال به گوگل ناموفق بود. دوباره تلاش کنید.',
    OAuthCallback: 'گوگل دسترسی را رد کرد.',
    OAuthCreateAccount: 'ساخت حساب کاربری ناموفق بود.',
    Callback: 'خطا در بازگشت از احراز هویت.',
    AccessDenied: 'دسترسی رد شد — ممکن است حساب شما مسدود باشد.',
    Configuration: 'تنظیمات احراز هویت ناقص است. GOOGLE_CLIENT_ID را در .env تنظیم کنید.',
    default: 'خطایی رخ داد. دوباره تلاش کنید.',
  }
  const errMsg = error ? errorMessages[error] || errorMessages.default : ''

  async function handleGoogle() {
    setLoading(true)
    await signIn('google', { callbackUrl })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col relative overflow-hidden"
      dir="rtl"
      style={{
        background: B.bg,
      }}
    >
      {/* ─── Decorative background layer ─────────────────────────────────── */}
      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, ${B.brown} 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, ${B.brown} 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, ${B.brown} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 80px 80px, 60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Floating decorative book icons */}
      {!reduceMotion && (
        <>
          <motion.div
            className="absolute top-[10%] left-[8%] opacity-[0.07] pointer-events-none"
            animate={{
              y: [0, -20, 0],
              rotate: [-8, -12, -8],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          >
            <BookOpen className="w-32 h-32" style={{ color: B.brown }} strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute bottom-[12%] right-[6%] opacity-[0.06] pointer-events-none"
            animate={{
              y: [0, 15, 0],
              rotate: [12, 8, 12],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            aria-hidden="true"
          >
            <Feather className="w-28 h-28" style={{ color: B.brown }} strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute top-[60%] left-[15%] opacity-[0.05] pointer-events-none"
            animate={{
              y: [0, -12, 0],
              rotate: [-5, -10, -5],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            aria-hidden="true"
          >
            <Library className="w-24 h-24" style={{ color: B.brown }} strokeWidth={1} />
          </motion.div>
        </>
      )}

      {/* Radial glow behind the brand block */}
      <div
        className="absolute top-[18%] left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${B.gold}40 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      {/* ─── Top gradient border ─────────────────────────────────────────── */}
      <div
        className="h-1.5 w-full relative z-10"
        style={{
          background: `linear-gradient(to left, ${B.gold}, ${B.bronzeDark}, ${B.brown}, ${B.bronzeDark}, ${B.gold})`,
        }}
      />

      {/* ─── Theme toggle button (top-left) ──────────────────────────────── */}
      {mounted && (
        <button
          onClick={toggleTheme}
          className="fixed top-5 left-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-[transform,opacity,colors,border-color,background-color] hover:scale-110 active:scale-95"
          style={{
            background: B.cardBg,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${B.cardBorder}`,
            color: B.muted,
            boxShadow: `0 4px 12px ${B.shadowColor}`,
          }}
          aria-label={theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      )}

      {/* ─── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-7"
        >
          {/* ─── Brand block ────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-white mb-5 relative"
              style={{
                background: `linear-gradient(135deg, ${B.gold} 0%, ${B.bronzeDark} 50%, ${B.brown} 100%)`,
                boxShadow: `0 20px 40px -12px ${B.bronzeDark}66, 0 0 0 1px ${B.gold}33`,
              }}
              animate={
                reduceMotion
                  ? {}
                  : {
                      boxShadow: [
                        `0 20px 40px -12px ${B.bronzeDark}66, 0 0 0 1px ${B.gold}33`,
                        `0 20px 50px -8px ${B.bronzeDark}88, 0 0 0 4px ${B.gold}22`,
                        `0 20px 40px -12px ${B.bronzeDark}66, 0 0 0 1px ${B.gold}33`,
                      ],
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <BookOpen className="w-10 h-10" strokeWidth={1.5} />
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 rounded-3xl overflow-hidden"
                aria-hidden="true"
              >
                <motion.div
                  className="absolute -inset-y-4 -left-1/2 w-1/2 opacity-30"
                  style={{
                    background: `linear-gradient(to right, transparent, white, transparent)`,
                    filter: 'blur(8px)',
                  }}
                  animate={{ x: ['0%', '400%'] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 2,
                  }}
                />
              </motion.div>
            </motion.div>
            <h1
              className="text-4xl font-extrabold tracking-tight mb-2"
              style={{
                color: B.ink,
                fontFamily: 'var(--font-vazirmatn), system-ui',
              }}
            >
              کتاب‌یار
            </h1>
            <p className="text-sm" style={{ color: B.bronzeDark }}>
              پلتفرم هوشمند مطالعه دوزبانه کتاب‌های انگلیسی
            </p>
          </motion.div>

          {/* ─── Error display ──────────────────────────────────────────── */}
          {errMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{errMsg}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* ─── Sign-in card ───────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card
              className="shadow-2xl relative overflow-hidden"
              style={{
                background: `${B.creamLight}f2`,
                backdropFilter: 'blur(16px)',
                borderColor: `${B.bronze}66`,
                boxShadow: `0 25px 50px -12px ${B.brown}33, 0 0 0 1px ${B.bronze}40`,
              }}
            >
              {/* Card top accent line */}
              <div
                className="absolute top-0 inset-x-0 h-px"
                style={{
                  background: `linear-gradient(to left, transparent, ${B.gold}, transparent)`,
                }}
              />
              <CardContent className="p-6 sm:p-8 space-y-5">
                {googleReady ? (
                  <>
                    <div className="text-center space-y-1 mb-2">
                      <h2
                        className="text-xl font-bold"
                        style={{ color: B.ink }}
                      >
                        ورود به حساب
                      </h2>
                      <p className="text-xs" style={{ color: B.bronzeDark }}>
                        با حساب گوگل خود وارد شوید
                      </p>
                    </div>

                    <motion.div
                      whileHover={reduceMotion ? {} : { scale: 1.02, y: -1 }}
                      whileTap={reduceMotion ? {} : { scale: 0.98 }}
                      onHoverStart={() => setHovered(true)}
                      onHoverEnd={() => setHovered(false)}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-3 h-14 text-base font-medium transition-[transform,opacity,colors,border-color,background-color] relative overflow-hidden"
                        style={{
                          background: hovered ? '#fff' : '#fefdfb',
                          borderColor: hovered ? B.gold : B.bronze,
                          borderWidth: '2px',
                          boxShadow: hovered
                            ? `0 8px 20px -6px ${B.bronzeDark}33`
                            : `0 2px 8px -2px ${B.brown}1a`,
                        }}
                        onClick={handleGoogle}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2
                            className="w-5 h-5 animate-spin"
                            style={{ color: B.bronzeDark }}
                          />
                        ) : (
                          <motion.div
                            animate={reduceMotion ? {} : { rotate: [0, -8, 0] }}
                            transition={{ duration: 0.4 }}
                          >
                            <GoogleIcon className="w-6 h-6" />
                          </motion.div>
                        )}
                        <span style={{ color: B.ink }}>
                          {loading ? 'در حال اتصال...' : 'ادامه با گوگل'}
                        </span>
                      </Button>
                    </motion.div>

                    {/* Trust line */}
                    <div
                      className="flex items-center justify-center gap-2 text-xs pt-1"
                      style={{ color: B.goldDark }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#22c55e' }}
                      />
                      <span>ورود امن از طریق Google OAuth</span>
                    </div>
                  </>
                ) : (
                  /* ─── Setup instructions (Google not configured) ─── */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Alert
                      style={{
                        background: B.creamLight,
                        borderColor: B.bronze,
                      }}
                    >
                      <AlertCircle
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: B.bronzeDark }}
                      />
                      <AlertDescription
                        className="text-xs space-y-3"
                        style={{ color: B.brownDark }}
                      >
                        <div>
                          <strong className="block text-sm mb-1" style={{ color: B.ink }}>
                            ⚙️ ورود با گوگل هنوز فعال نیست
                          </strong>
                          برای فعال‌سازی، این مراحل را دنبال کنید:
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 pr-1">
                          <li>
                            به{' '}
                            <a
                              href="https://console.cloud.google.com/apis/credentials"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium"
                              style={{ color: B.bronzeDark }}
                            >
                              Google Cloud Console
                            </a>{' '}
                            بروید
                          </li>
                          <li>یک OAuth 2.0 Client ID بسازید (Web application)</li>
                          <li>
                            Redirect URI را روی{' '}
                            <code
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                              style={{
                                background: B.creamDark,
                                color: B.brown,
                              }}
                              dir="ltr"
                            >
                              {typeof window !== 'undefined'
                                ? window.location.origin
                                : 'https://yourdomain.com'}
                              /api/auth/callback/google
                            </code>{' '}
                            تنظیم کنید
                          </li>
                          <li>
                            مقادیر{' '}
                            <code
                              className="px-1 py-0.5 rounded text-[10px] font-mono"
                              style={{ background: B.creamDark, color: B.brown }}
                            >
                              GOOGLE_CLIENT_ID
                            </code>{' '}
                            و{' '}
                            <code
                              className="px-1 py-0.5 rounded text-[10px] font-mono"
                              style={{ background: B.creamDark, color: B.brown }}
                            >
                              GOOGLE_CLIENT_SECRET
                            </code>{' '}
                            را در فایل{' '}
                            <code
                              className="px-1 py-0.5 rounded text-[10px] font-mono"
                              style={{ background: B.creamDark, color: B.brown }}
                            >
                              .env
                            </code>{' '}
                            قرار دهید
                          </li>
                          <li>سرور را ری‌استارت کنید</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Trust stats ────────────────────────────────────────────── */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-2.5"
          >
            {[
              { icon: Library, label: 'کتاب‌های کلاسیک' },
              { icon: Sparkles, label: 'هوش مصنوعی' },
              { icon: Globe, label: 'دوزبانه' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={i}
                  whileHover={reduceMotion ? {} : { y: -2 }}
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: `${B.creamLight}99`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${B.bronze}40`,
                  }}
                >
                  <Icon
                    className="w-5 h-5 mx-auto mb-1.5"
                    style={{ color: B.goldDark }}
                    strokeWidth={1.5}
                  />
                  <div
                    className="text-[11px] font-medium"
                    style={{ color: B.brownDark }}
                  >
                    {item.label}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* ─── Footer ─────────────────────────────────────────────────── */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-4 text-xs pb-6"
            style={{ color: B.bronzeDark }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:underline transition-colors"
              style={{ color: B.bronzeDark }}
            >
              <ChevronLeft className="w-3 h-3" />
              بازگشت به خانه
            </Link>
            <span style={{ color: B.bronze }}>·</span>
            <Link href="/support" className="hover:underline">
              پشتیبانی
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: BRAND_LIGHT.creamLight }}
        >
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: BRAND_LIGHT.bronzeDark }}
          />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
