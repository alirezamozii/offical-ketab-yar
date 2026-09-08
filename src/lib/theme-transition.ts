export interface ThemeTransitionOptions {
  /** Target theme to switch to ('light' | 'dark' | 'system') */
  theme: string
  /** Function to apply the theme change (e.g. next-themes setTheme) */
  setTheme: (theme: string) => void
  /** Optional click or touch event to calculate origin coordinates from */
  event?:
    | React.MouseEvent
    | MouseEvent
    | TouchEvent
    | { clientX: number; clientY: number; currentTarget?: EventTarget | null }
    | null
  /** Optional animation duration in ms (default: 450) */
  duration?: number
  /** Optional easing curve (default: 'cubic-bezier(0.4, 0, 0.2, 1)') */
  easing?: string
}

let activeAnimation: Animation | null = null
let isTransitionActive = false
let lastToggleTimestamp = 0
let safetyTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Returns true if a theme transition is currently animating or locked.
 */
export function isThemeTransitionActive(): boolean {
  return isTransitionActive
}

/**
 * Resets module-level transition state (used in unit tests).
 */
export function _resetThemeTransitionStateForTesting(): void {
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
  activeAnimation = null
  isTransitionActive = false
  lastToggleTimestamp = 0
}

/**
 * Synchronously syncs the DOM root classes with the target theme
 * without requiring flushSync (which can trigger React 19 re-entrancy crashes).
 */
function applyDomTheme(theme: string): void {
  if (typeof document === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else if (theme === 'system') {
    const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  }
}

/**
 * Executes a buttery-smooth circular view transition when toggling themes.
 * Bulletproof against rapid spam-clicking to prevent Chromium engine STATUS_BREAKPOINT / "Aw, Snap!" crashes.
 */
export function executeThemeTransition({
  theme,
  setTheme,
  event,
  duration = 400,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
}: ThemeTransitionOptions): void {
  const now = Date.now()

  // 1. MUTEX LOCK & THROTTLE:
  // If a transition is already animating or was invoked less than 150ms ago,
  // drop redundant calls immediately.
  // Spamming DOM mutations or overlapping transitions while Chromium is rendering
  // View Transition pseudo-elements causes Chromium renderer assertion crashes (STATUS_BREAKPOINT / Aw, Snap!).
  if (isTransitionActive || now - lastToggleTimestamp < 150) {
    return
  }

  // 2. Fallback for SSR, environments without View Transitions API, or prefers-reduced-motion
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    typeof (document as unknown as { startViewTransition?: unknown }).startViewTransition !== 'function' ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  ) {
    isTransitionActive = true
    lastToggleTimestamp = now
    try {
      setTheme(theme)
      applyDomTheme(theme)
    } finally {
      setTimeout(() => {
        isTransitionActive = false
      }, 150)
    }
    return
  }

  // Determine the expansion origin coordinates
  let x = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  let y = typeof window !== 'undefined' ? window.innerHeight / 2 : 0

  if (event) {
    if (
      'clientX' in event &&
      typeof event.clientX === 'number' &&
      (event.clientX !== 0 || event.clientY !== 0)
    ) {
      x = event.clientX
      y = event.clientY
    } else if (
      'currentTarget' in event &&
      event.currentTarget &&
      event.currentTarget instanceof HTMLElement
    ) {
      const rect = event.currentTarget.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }
  }

  // Calculate maximum distance to the furthest viewport corner + 30px safety padding
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1920
  const winH = typeof window !== 'undefined' ? window.innerHeight : 1080
  const endRadius =
    Math.ceil(
      Math.hypot(
        Math.max(x, winW - x),
        Math.max(y, winH - y)
      )
    ) + 30

  const doc = document as unknown as {
    startViewTransition?: (callback: () => Promise<void> | void) => {
      ready: Promise<void>
      finished: Promise<void>
      skipTransition?: () => void
    }
  }

  isTransitionActive = true
  lastToggleTimestamp = now

  const unlock = () => {
    if (safetyTimer) {
      clearTimeout(safetyTimer)
      safetyTimer = null
    }
    activeAnimation = null
    isTransitionActive = false
  }

  // Fail-safe unlock timer: Ensures the button is never permanently locked
  // even if the browser drops the transition or pauses execution.
  safetyTimer = setTimeout(unlock, duration + 250)

  try {
    const transition = doc.startViewTransition!(() => {
      setTheme(theme)
      applyDomTheme(theme)
    })

    if (!transition || !transition.ready || !transition.finished) {
      unlock()
      return
    }

    transition.ready
      .then(() => {
        if (!isTransitionActive) return

        try {
          const anim = document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration,
              easing,
              pseudoElement: '::view-transition-new(root)',
              fill: 'forwards',
            }
          )

          activeAnimation = anim
        } catch {
          // If animate throws, browser default transition completes
        }
      })
      .catch(() => {
        // Transition aborted by browser
        unlock()
      })

    transition.finished
      .then(unlock)
      .catch(unlock)
  } catch {
    // If startViewTransition throws synchronously
    unlock()
    setTheme(theme)
    applyDomTheme(theme)
  }
}
