import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import { getHighestRatedBooks } from '@/lib/data'
import { BookX, Home, Library, Search } from 'lucide-react'
import Link from 'next/link'

export default async function BookNotFound() {

  const popular = await getHighestRatedBooks(4)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <BookX className="h-10 w-10" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          کتاب یافت نشد
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          شاید آدرس را اشتباه وارد کرده‌اید یا این کتاب از پلی‌لیست حذف شده است.
          می‌توانید به کتابخانه برگردید یا بین کتاب‌ها جست‌وجو کنید.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="glow" size="lg">
            <Link href="/library">
              <Library className="h-4 w-4" />
              بازگشت به کتابخانه
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/search">
              <Search className="h-4 w-4" />
              جست‌وجوی کتاب
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/">
              <Home className="h-4 w-4" />
              خانه
            </Link>
          </Button>
        </div>
      </div>

      {/* Popular books */}
      {popular.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-center text-xl font-bold">
            ممکن است این‌ها را بپسندید
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {popular.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
