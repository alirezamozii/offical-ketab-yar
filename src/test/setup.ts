import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// ── Mock localStorage & sessionStorage ──────────────────────────────────────
const mockStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((idx: number) => Object.keys(store)[idx] ?? null),
    get length() {
      return Object.keys(store).length
    },
  }
}

const localStorageMock = mockStorage()
const sessionStorageMock = mockStorage()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
  writable: true,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    configurable: true,
    writable: true,
  })
}

// Export storage mocks so tests can import them if they want to spy/introspect
export { localStorageMock, sessionStorageMock }

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockPrefetch = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: mockPrefetch,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: (url: string) => {
    const err = new Error('NEXT_REDIRECT')
    ;(err as Error & { digest?: string }).digest = `NEXT_REDIRECT;307;${url};default;`
    throw err
  },
}))

vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>()
  return {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, val: unknown) => {
      store.set(key, val)
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(async () => {
      store.clear()
    }),
    keys: vi.fn(async () => Array.from(store.keys())),
  }
})

// ── Mock @/lib/db ──────────────────────────────────────────────────────────
const mockModel = {
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
  count: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  aggregate: vi.fn(),
}

const mockDb = {
  user: { ...mockModel },
  book: { ...mockModel },
  chapter: { ...mockModel },
  bookPage: { ...mockModel },
  review: { ...mockModel },
  vote: { ...mockModel },
  readingProgress: { ...mockModel },
  readingSession: { ...mockModel },
  userStats: { ...mockModel },
  bookDownload: { ...mockModel },
  blogPost: { ...mockModel },
  supportTicket: { ...mockModel },
  imageAsset: { ...mockModel },
  vocabulary: { ...mockModel },
  collection: { ...mockModel },
  userGoal: { ...mockModel },
  readingHistoryDayRow: { ...mockModel },
  userAchievement: { ...mockModel },
  dictionaryEntry: { ...mockModel },
  $transaction: vi.fn((fn) => fn(mockDb)),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// ── Browser APIs Stubs ──────────────────────────────────────────────────────

// IntersectionObserver stub
class IntersectionObserverMock {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(
    public callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    if (options) {
      this.root = options.root ?? null
      this.rootMargin = options.rootMargin ?? ''
    }
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: IntersectionObserverMock,
  writable: true,
})

// ResizeObserver stub
class ResizeObserverMock {
  constructor(public callback: ResizeObserverCallback) {}
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true,
})

// matchMedia stub
Object.defineProperty(globalThis, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
})

// scrollTo / scrollBy stubs
Object.defineProperty(globalThis, 'scrollTo', { value: vi.fn(), writable: true })
Object.defineProperty(globalThis, 'scrollBy', { value: vi.fn(), writable: true })

// requestAnimationFrame stub
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  value: vi.fn().mockImplementation((cb) => setTimeout(() => cb(Date.now()), 0)),
  writable: true,
})
Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  value: vi.fn().mockImplementation((id) => clearTimeout(id)),
  writable: true,
})

// URL.createObjectURL stub
if (typeof URL !== 'undefined') {
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
  URL.revokeObjectURL = vi.fn()
}

// SubtleCrypto stub
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    writable: true,
  })
}
if (typeof globalThis.crypto.subtle === 'undefined') {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
    writable: true,
  })
}

// navigator stubs
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn().mockReturnValue(true),
    writable: true,
  })
  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: vi.fn().mockResolvedValue({
        state: 'prompt',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    },
    writable: true,
  })
}

// SpeechSynthesis stub
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
  onvoiceschanged: null,
  paused: false,
  pending: false,
  speaking: false,
}
Object.defineProperty(globalThis, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
})
class SpeechSynthesisUtteranceMock {
  constructor(public text: string = '') {}
  lang: string = ''
  pitch: number = 1
  rate: number = 1
  voice: SpeechSynthesisVoice | null = null
  volume: number = 1
  onstart = null
  onend = null
  onerror = null
  onpause = null
  onresume = null
  onmark = null
  onboundary = null
}
Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  value: SpeechSynthesisUtteranceMock,
  writable: true,
})
