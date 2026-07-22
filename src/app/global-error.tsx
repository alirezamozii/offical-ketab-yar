'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Global error boundary — the last line of defense.
 *
 * This component is rendered when an error propagates all the way up to
 * the root layout, replacing the ENTIRE document (no <head>, no providers,
 * no header/footer/nav). Therefore it MUST:
 *
 *   1. Render its own <html> and <body> tags.
 *   2. Be a client component ('use client').
 *   3. NOT depend on any context provider, theme, or shadcn component
 *      that lives inside the layout chain — because the layout is gone.
 *   4. Inline its own styles so it renders correctly even if the
 *      external CSS bundle fails to load.
 *
 * It still logs to console.error so devs can debug, but never shows raw
 * error details to the user — only a friendly Persian message + a digest.
 *
 * Sentry: the captured exception is forwarded to Sentry with the
 * `boundary: 'global-error'` tag so we can distinguish layout-level
 * crashes from per-route crashes in the Sentry dashboard.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ketab-yar] GLOBAL error boundary (layout crashed):', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    })
    // Forward to Sentry — this is the last-line-of-defense boundary, so
    // capture even errors that broke the layout itself.
    Sentry.captureException(error, {
      tags: {
        boundary: 'global-error',
        digest: error.digest ?? 'no-digest',
      },
      extra: {
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      },
    })
  }, [error])

  // Inline styles — we cannot rely on Tailwind globals.css being applied
  // because layout.tsx (which imports globals.css) is itself replaced by
  // this file when the layout crashes. These values mirror the warm
  // sepia/bronze theme from globals.css.
  const warmLight = '#f3efe8'
  const warmDark = '#1a1612'
  const gold = '#b8956a'
  const goldDeep = '#8a6847'

  return (
    <html lang="fa" dir="rtl">
      <head>
        <title>مشکلی پیش آمد | کتاب‌یار</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Inline CSS — self-contained, no external dependency. */}
        <style>{`
          :root { color-scheme: light dark; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            font-family: 'Vazirmatn', ui-sans-serif, system-ui, -apple-system,
              'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${warmLight};
            color: #2b2520;
            -webkit-font-smoothing: antialiased;
            text-align: center;
          }
          @media (prefers-color-scheme: dark) {
            body { background-color: ${warmDark}; color: #e8ddc7; }
          }
          .card {
            max-width: 32rem;
            width: 100%;
            padding: 2.5rem 1.5rem;
          }
          .glow {
            position: absolute;
            width: 16rem;
            height: 16rem;
            border-radius: 9999px;
            background: ${gold};
            opacity: 0.12;
            filter: blur(72px);
            pointer-events: none;
            z-index: -1;
            top: 25%;
            transform: translateY(-50%);
          }
          .icon-tile {
            width: 5rem;
            height: 5rem;
            margin: 0 auto 1.5rem;
            border-radius: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${gold}26;
            color: ${goldDeep};
          }
          @media (prefers-color-scheme: dark) {
            .icon-tile { color: ${gold}; }
          }
          .brand {
            color: ${goldDeep};
            font-weight: 700;
            font-size: 0.875rem;
            letter-spacing: 0.04em;
            margin-bottom: 2rem;
            display: block;
          }
          @media (prefers-color-scheme: dark) {
            .brand { color: ${gold}; }
          }
          h1 {
            margin: 0 0 0.75rem;
            font-size: 1.875rem;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          @media (min-width: 640px) {
            h1 { font-size: 2.25rem; }
          }
          p {
            margin: 0 auto;
            max-width: 28rem;
            line-height: 1.7;
            opacity: 0.8;
          }
          .digest {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            border: 1px solid ${gold}40;
            font-family: ui-monospace, 'SF Mono', Menlo, monospace;
            font-size: 0.625rem;
            opacity: 0.6;
          }
          .actions {
            margin-top: 2rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
          }
          button, a {
            font-family: inherit;
            font-size: 0.95rem;
            font-weight: 600;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          button {
            border: none;
            color: #fff;
            background: linear-gradient(90deg, ${goldDeep}, ${gold}, ${goldDeep});
            box-shadow: 0 8px 20px -6px ${gold}80;
          }
          button:hover { transform: translateY(-1px); box-shadow: 0 12px 24px -6px ${gold}99; }
          button:active { transform: translateY(0); }
          a {
            background: transparent;
            color: inherit;
            border: 1px solid ${gold}55;
          }
          a:hover { background: ${gold}1a; }
          svg { width: 1rem; height: 1rem; }
          @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
          }
        `}</style>
      </head>
      <body>
        <main role="alert" className="card">
          <span className="glow" aria-hidden="true" />
          <span className="brand">کتاب‌یار</span>

          <div className="icon-tile" aria-hidden="true">
            {/* Inline SVG so we don't depend on lucide-react bundling here
                (it would still work, but inline SVG is maximally safe). */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="40"
              height="40"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1>مشکلی پیش آمد</h1>
          <p>
            خطای جدی‌ای رخ داد که صفحه را نمی‌تواند بارگذاری کند. می‌توانید
            دوباره تلاش کنید یا به صفحه خانه برگردید. اگر مشکل ادامه داشت،
            لطفاً با ما تماس بگیرید.
          </p>

          {error.digest ? (
            <span className="digest">شناسه: {error.digest}</span>
          ) : null}

          <div className="actions">
            <button onClick={reset} type="button">
              {/* refresh / retry icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              تلاش دوباره
            </button>
            <a href="/">
              {/* home icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              بازگشت به خانه
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
