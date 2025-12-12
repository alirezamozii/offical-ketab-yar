import Image from "next/image"
import Link from "next/link"

import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export async function RecommendedBooks() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from("books")
    .select(`
      id,
      title,
      slug,
      cover_image,
      level,
      author,
      rating
    `)
    .eq('is_active', true)
    .order('read_count', { ascending: false })
    .limit(4)

  if (!books || books.length === 0) {
    return <p className="text-muted-foreground text-center">در حال حاضر کتاب پیشنهادی وجود ندارد.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {books.map((book: { id: string; title: string; slug: string; cover_image: string | null; level: string; author: string; rating: number | null }) => (
        <Link key={book.id} href={`/books/${book.slug}`} className="book-card group">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
            <Image
              src={book.cover_image || "/placeholder.svg?height=600&width=400"}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <Badge
              className={`absolute left-2 top-2 ${book.level === "beginner"
                ? "bg-green-500 hover:bg-green-600"
                : book.level === "intermediate"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-purple-500 hover:bg-purple-600"
                }`}
            >
              {book.level === "beginner" ? "مبتدی" : book.level === "intermediate" ? "متوسط" : "پیشرفته"}
            </Badge>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="line-clamp-1 font-bold text-white">{book.title}</h3>
              <p className="text-sm text-gray-300">{book.author}</p>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-xs text-white">{book.rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
