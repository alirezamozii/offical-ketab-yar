"use client"

import { useEffect, useState } from "react"

import Image from "next/image"

import { BookOpen, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"


interface ReadingHistoryProps {
  userId: string
  limit?: number
  preview?: boolean
}

interface ReadingSession {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  coverImage: string | null
  startPage: number
  endPage: number
  pagesRead: number
  startTime: string
  endTime: string
  duration: number
  book: {
    slug: string
  }
}

function ReadingHistory({ userId, limit, preview = false }: ReadingHistoryProps) {
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = limit || 5

  const supabase = createClient()

  useEffect(() => {
    const fetchReadingHistory = async () => {
      try {
        setIsLoading(true)

        const { data, error } = await supabase.rpc("get_reading_sessions", {
          user_id_param: userId,
          page_param: page,
          page_size_param: pageSize,
        })

        if (error) throw error

        if (data) {
          if (page === 1) {
            setReadingSessions(data)
          } else {
            setReadingSessions((prev) => [...prev, ...data])
          }

          setHasMore(data.length === pageSize)
        }
      } catch (error) {
        console.error("خطا در دریافت تاریخچه مطالعه:", error)
        toast.error("خطا در دریافت تاریخچه مطالعه")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReadingHistory()
  }, [page, pageSize, supabase, userId])

  // تبدیل مدت زمان به فرمت خوانا
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقیقه`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) {
      return `${hours} ساعت`
    }

    return `${hours} ساعت و ${remainingMinutes} دقیقه`
  }

  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Unused for now - can be implemented later if needed
  // const handleDelete = async (id: string) => {
  //   try {
  //     const { error } = await supabase
  //       .from("reading_history")
  //       .delete()
  //       .eq("id", id)

  //     if (error) throw error

  //     toast.success("تاریخچه مطالعه با موفقیت حذف شد")
  //   } catch (error) {
  //     console.error("Error deleting reading history:", error)
  //     toast.error("خطا در حذف تاریخچه مطالعه")
  //   }
  // }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">تاریخچه مطالعه</h2>
      </div>

      {isLoading && page === 1 ? (
        <div className="flex items-center justify-center py-12">
          <div className="border-primary size-12 animate-spin rounded-full border-4 border-t-transparent"></div>
        </div>
      ) : readingSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="text-muted-foreground mb-4 size-16 opacity-20" />
            <p className="mb-2 text-xl font-medium">هنوز مطالعه‌ای ثبت نشده است</p>
            <p className="text-muted-foreground max-w-md text-center">
              با مطالعه کتاب‌ها، تاریخچه مطالعه شما در اینجا نمایش داده خواهد شد.
            </p>
            <Button className="mt-4" asChild>
              <a href="/library">مشاهده کتابخانه</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {readingSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="shrink-0">
                      <div className="relative aspect-[2/3] w-16 overflow-hidden rounded-md">
                        <Image
                          src={session.coverImage || "/images/placeholder.svg"}
                          alt={`Cover of ${session.bookTitle}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    </div>

                    <div className="grow">
                      <h3 className="mb-1 text-lg font-bold">{session.bookTitle}</h3>
                      <p className="text-muted-foreground mb-3 text-sm">{session.bookAuthor}</p>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex items-center">
                          <BookOpen className="text-muted-foreground mr-2 size-4" />
                          <div>
                            <p className="text-sm font-medium">صفحات خوانده شده</p>
                            <p className="text-muted-foreground text-sm">
                              {session.pagesRead} صفحه (از {session.startPage} تا {session.endPage})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="text-muted-foreground mr-2 size-4" />
                          <div>
                            <p className="text-sm font-medium">مدت مطالعه</p>
                            <p className="text-muted-foreground text-sm">{formatDuration(session.duration)}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="text-muted-foreground mr-2 size-4" />
                          <div>
                            <p className="text-sm font-medium">تاریخ مطالعه</p>
                            <p className="text-muted-foreground text-sm">{formatDate(session.startTime)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/books/${session.book.slug}/read?page=${session.endPage}`}>ادامه مطالعه</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!preview && hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} disabled={isLoading}>
                {isLoading ? "در حال بارگذاری..." : "بارگذاری بیشتر"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
