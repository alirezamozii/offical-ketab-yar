import { BookOpen, Calendar, Clock, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type SupabaseProgress = {
  id: string
  current_page: number
  completion_percentage: number
  last_read_at: string
  books: {
    id: string
    page_count: number
  }
}

export async function ReadingStats() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // دریافت آمار مطالعه کاربر
  const { data: userProgress } = await supabase
    .from("user_progress")
    .select(`
      id,
      current_page,
      completion_percentage,
      last_read_at,
      books:book_id(
        id,
        page_count
      )
    `)
    .eq("user_id", user.id) as { data: SupabaseProgress[] | null }

  // محاسبه آمار
  const totalBooks = userProgress?.length || 0
  const completedBooks = userProgress?.filter(p => p.completion_percentage >= 100).length || 0
  const totalPages = userProgress?.reduce((sum, p) => sum + p.current_page, 0) || 0

  // محاسبه روزهای متوالی مطالعه (فرضی)
  const streak = 5

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">آمار مطالعه شما</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <BookOpen className="size-4 text-purple-500" />
              <span className="text-sm font-medium">کتاب‌ها</span>
            </div>
            <p className="text-2xl font-bold">{totalBooks}</p>
            <p className="text-muted-foreground text-xs">{completedBooks} کتاب تکمیل شده</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="size-4 text-indigo-500" />
              <span className="text-sm font-medium">صفحات</span>
            </div>
            <p className="text-2xl font-bold">{totalPages}</p>
            <p className="text-muted-foreground text-xs">صفحه مطالعه شده</p>
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="size-5 text-purple-500" />
            <span className="font-medium">روزهای متوالی مطالعه</span>
          </div>
          <div className="mb-2 flex items-end gap-1">
            <span className="text-3xl font-bold">{streak}</span>
            <span className="text-muted-foreground mb-1 text-sm">روز</span>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${i < 5 ? "bg-gradient-to-r from-purple-500 to-indigo-500" : "bg-muted"
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" />
            <span className="text-sm font-medium">پیشرفت کلی</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted h-2.5 w-full rounded-full">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                style={{ width: `${totalBooks ? (completedBooks / totalBooks) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium">
              {totalBooks ? Math.round((completedBooks / totalBooks) * 100) : 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
