import Image from "next/image"
import Link from "next/link"

import { BookOpen, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/server"

interface UserProgress {
  id: string
  current_page: number
  completion_percentage: number
  last_read_at: string
  books: {
    id: string
    title: string
    slug: string
    cover_image: string | null
    page_count: number
    author_id: string
    authors: {
      name: string
    }
  } | null
}

type UserProgressResponse = {
  id: string
  current_page: number
  completion_percentage: number
  last_read_at: string
  books: {
    id: string
    title: string
    slug: string
    cover_image: string | null
    page_count: number
    author_id: string
    authors: {
      name: string
    }
  } | null
}[]

export async function CurrentlyReading() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // دریافت کتاب‌های در حال مطالعه کاربر
  const { data: userProgress } = await supabase
    .from("user_progress")
    .select(`
      id,
      current_page,
      completion_percentage,
      last_read_at,
      books:book_id(
        id,
        title,
        slug,
        cover_image,
        page_count,
        author_id,
        authors:author_id(name)
      )
    `)
    .eq("user_id", user.id)
    .order("last_read_at", { ascending: false })
    .limit(3) as { data: UserProgressResponse | null }

  if (!userProgress || userProgress.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
            <BookOpen className="text-muted-foreground size-8" />
          </div>
          <h3 className="mb-2 text-lg font-medium">هنوز کتابی مطالعه نکرده‌اید</h3>
          <p className="text-muted-foreground mb-4">از کتابخانه ما یک کتاب انتخاب کنید و شروع به مطالعه کنید.</p>
          <Button asChild>
            <Link href="/library">مشاهده کتابخانه</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {userProgress.map((progress: UserProgress) => (
        <Card key={progress.id} className="group overflow-hidden transition-shadow hover:shadow-md">
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              src={progress.books?.cover_image || "/placeholder.svg?height=600&width=400"}
              alt={progress.books?.title || "کتاب"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="line-clamp-1 font-bold text-white">{progress.books?.title}</h3>
              <p className="text-sm text-gray-300">{progress.books?.authors?.name}</p>

              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs text-white">
                  <span>
                    صفحه {progress.current_page} از {progress.books?.page_count}
                  </span>
                  <span>{Math.round(progress.completion_percentage)}%</span>
                </div>
                <Progress value={progress.completion_percentage} className="h-1 bg-white/20">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                </Progress>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-300">
                  <Clock className="mr-1 size-3" />
                  <span>
                    {new Date(progress.last_read_at).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <Button size="sm" className="bg-white text-black hover:bg-gray-200" asChild>
                  <Link href={`/books/${progress.books?.slug}/read?page=${progress.current_page}`}>ادامه مطالعه</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
