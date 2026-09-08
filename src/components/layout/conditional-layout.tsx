import {
  BookMarked,
  BookOpen,
  Feather,
  Home,
  LayoutDashboard,
  Library,
  Moon,
  Search,
} from 'lucide-react'

const desktopLinks = [
  ['/', 'خانه'],
  ['/library', 'کتابخانه'],
  ['/quotes', 'کوت‌ها'],
  ['/authors', 'نویسندگان'],
  ['/blog', 'بلاگ'],
  ['/vocabulary', 'واژگان'],
  ['/leaderboard', 'لیدربورد'],
] as const

const mobileLinks = [
  ['/', 'خانه', Home],
  ['/library', 'کتابخانه', Library],
  ['/authors', 'نویسندگان', Feather],
  ['/vocabulary', 'واژگان', BookMarked],
  ['/dashboard', 'داشبورد', LayoutDashboard],
] as const

function StaticHeader() {
  return (
    <div className="site-shell-header">
      <header
        role="banner"
        aria-label="سرصفحه اصلی"
        className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gold-500/20 bg-background/95 px-4 backdrop-blur-md sm:h-20 sm:px-10"
      >
        <a
          href="/"
          aria-label="بوکزی — خانه"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white shadow-md shadow-gold-500/30 sm:h-11 sm:w-11 sm:rounded-2xl">
            <BookOpen aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight sm:text-2xl">بوکزی</span>
        </a>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
          {desktopLinks.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-2.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:text-sm"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href="/search"
            aria-label="جستجو"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </a>
          <button
            id="theme-toggle"
            type="button"
            aria-label="تغییر تم روشن/تاریک"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Moon aria-hidden="true" className="h-5 w-5" />
          </button>
          <a
            href="/auth/signin"
            className="inline-flex h-9 items-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 px-4 text-xs font-bold text-white shadow-md sm:text-sm"
          >
            ورود
          </a>
        </div>
      </header>
      <div aria-hidden="true" className="h-16 sm:h-20" />
    </div>
  )
}

function StaticBottomNav() {
  return (
    <nav
      aria-label="ناوبری پایین — دسترسی سریع به بخش‌های اصلی"
      className="site-shell-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch px-2">
        {mobileLinks.map(([href, label, Icon]) => (
          <li key={href} className="flex-1">
            <a
              href={href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell flex min-h-screen flex-col">
      <StaticHeader />
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        aria-label="محتوای اصلی بوکزی"
        className="site-shell-main flex-1 scroll-mt-16 pb-24 outline-none md:pb-0"
      >
        {children}
      </main>
      <StaticBottomNav />
    </div>
  )
}
