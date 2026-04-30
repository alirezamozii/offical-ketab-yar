"use client"

import { useState, useEffect, useRef } from "react"

import { useVirtualizer } from "@tanstack/react-virtual"
import { Volume2, BookOpen, Check, Clock, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvancedFlashcardSystem } from "@/components/vocabulary/advanced-flashcard-system"
import { createClient } from "@/lib/supabase/client"

interface DatabaseWord {
  id: string
  word: string
  definition: string
  context: string | null
  book_id: string | null
  status: "new" | "learning" | "reviewing" | "mastered"
  next_review_at: string
  created_at: string
  updated_at: string
  user_id: string
  level: "beginner" | "intermediate" | "advanced"
  books?: {
    id: string
    title: string
  }
}

interface FlashcardWord {
  id: string
  word: string
  meaning: string
  explanation?: string
  example?: string
  status: "learning" | "reviewing" | "mastered"
  next_review_at: string
  level: "beginner" | "intermediate" | "advanced"
  review_count: number
  book_id?: string
  book_title?: string
}

interface VocabularyManagerProps {
  userId: string
}

export function VocabularyManager({ userId }: VocabularyManagerProps) {
  const [words, setWords] = useState<DatabaseWord[]>([])
  const [filteredWords, setFilteredWords] = useState<DatabaseWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const supabase = createClient()

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredWords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  })

  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("user_words")
          .select(`
            id,
            word,
            definition,
            context,
            book_id,
            status,
            next_review_at,
            created_at,
            updated_at,
            user_id,
            level,
            books (
              id,
              title
            )
          `)
          .eq("user_id", userId)
          .order("next_review_at", { ascending: true })

        if (error) throw error

        const formattedWords: DatabaseWord[] = (data || []).map((item) => ({
          id: item.id,
          word: item.word,
          definition: item.definition,
          context: item.context,
          book_id: item.book_id,
          status: item.status,
          next_review_at: item.next_review_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user_id: item.user_id,
          level: item.level,
          books: item.books?.[0] || undefined
        }))

        setWords(formattedWords)
        setFilteredWords(formattedWords)
      } catch (error) {
        console.error("خطا در دریافت واژگان:", error)
        toast.error("خطا در دریافت واژگان")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [userId, supabase])

  const playPronunciation = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error("مرورگر شما از قابلیت تلفظ پشتیبانی نمی‌کند")
    }
  }

  const updateWordStatus = async (wordId: string, newStatus: DatabaseWord["status"]) => {
    try {
      const { error } = await supabase
        .from("user_words")
        .update({
          status: newStatus,
          next_review_at: new Date(
            Date.now( as any) + (newStatus === "mastered" ? 7 : newStatus === "reviewing" ? 3 : 1) * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq("id", wordId)

      if (error) throw error

      const updatedWords = words.map((word) =>
        word.id === wordId
          ? {
              ...word,
              status: newStatus,
              next_review_at: new Date(
                Date.now() + (newStatus === "mastered" ? 7 : newStatus === "reviewing" ? 3 : 1) * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : word,
      )

      setWords(updatedWords)
      setFilteredWords(updatedWords)

      toast.success(
        `وضعیت کلمه به "${newStatus === "mastered" ? "تسلط" : newStatus === "reviewing" ? "مرور" : "یادگیری"}" تغییر یافت`,
      )
    } catch (error) {
      console.error("خطا در به‌روزرسانی وضعیت کلمه:", error)
      toast.error("خطا در به‌روزرسانی وضعیت کلمه")
    }
  }

  useEffect(() => {
    setFilteredWords(activeTab === "all" ? words : words.filter((word) => word.status === activeTab))
  }, [activeTab, words])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "learning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "reviewing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "mastered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "intermediate":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "advanced":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const mapToFlashcardWord = (word: DatabaseWord): FlashcardWord => ({
    id: word.id,
    word: word.word,
    meaning: word.definition,
    example: word.context || undefined,
    status: word.status === "new" ? "learning" : word.status,
    next_review_at: word.next_review_at,
    level: word.level,
    review_count: 0, // This will be updated by the flashcard system
    book_id: word.book_id || undefined,
    book_title: word.books?.title
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت واژگان</CardTitle>
        <CardDescription>کلمات ذخیره شده برای مرور و یادگیری</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">همه ({words.length})</TabsTrigger>
            <TabsTrigger value="learning">
              در حال یادگیری ({words.filter((w) => w.status === "learning").length})
            </TabsTrigger>
            <TabsTrigger value="reviewing">
              در حال مرور ({words.filter((w) => w.status === "reviewing").length})
            </TabsTrigger>
            <TabsTrigger value="mastered">
              تسلط یافته ({words.filter((w) => w.status === "mastered").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
                <p className="text-muted-foreground mt-2 text-sm">در حال بارگذاری واژگان...</p>
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">هیچ کلمه‌ای یافت نشد.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <a href="/library">مرور کتاب‌ها و افزودن کلمات جدید</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div ref={parentRef} className="h-[600px] overflow-auto">
                  <div
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      position: "relative",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                      const word = filteredWords[virtualItem.index]
                      return (
                        <div
                          key={word.id}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <Card>
                            <CardContent className="p-0">
                              <div className="p-4">
                                <div className="mb-2 flex items-center justify-between">
                                  <h3 className="text-lg font-bold">{word.word}</h3>
                                  <Button variant="ghost" size="icon" onClick={() => playPronunciation(word.word)}>
                                    <Volume2 className="size-4" />
                                    <span className="sr-only">تلفظ</span>
                                  </Button>
                                </div>
                                <p className="mb-3 text-sm">{word.definition}</p>
                                <div className="mb-3 flex flex-wrap gap-2">
                                  <Badge variant="outline" className={getLevelColor(word.level)}>
                                    {word.level === "beginner"
                                      ? "مبتدی"
                                      : word.level === "intermediate"
                                        ? "متوسط"
                                        : "پیشرفته"}
                                  </Badge>
                                  <Badge variant="outline" className={getStatusColor(word.status)}>
                                    {word.status === "learning"
                                      ? "در حال یادگیری"
                                      : word.status === "reviewing"
                                        ? "در حال مرور"
                                        : "تسلط یافته"}
                                  </Badge>
                                </div>
                                {word.books && (
                                  <div className="text-muted-foreground mb-3 flex items-center gap-1 text-xs">
                                    <BookOpen className="size-3" />
                                    <span>{word.books.title}</span>
                                  </div>
                                )}
                                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                  <Clock className="size-3" />
                                  <span>مرور بعدی: {formatDate(word.next_review_at)}</span>
                                </div>
                              </div>
                              <div className="flex border-t">
                                {word.status !== "learning" && (
                                  <Button
                                    variant="ghost"
                                    className="h-10 flex-1 rounded-none text-blue-600"
                                    onClick={() => updateWordStatus(word.id, "learning")}
                                  >
                                    <RotateCcw className="mr-1 size-4" />
                                    یادگیری
                                  </Button>
                                )}
                                {word.status !== "reviewing" && (
                                  <Button
                                    variant="ghost"
                                    className="h-10 flex-1 rounded-none text-purple-600"
                                    onClick={() => updateWordStatus(word.id, "reviewing")}
                                  >
                                    <Clock className="mr-1 size-4" />
                                    مرور
                                  </Button>
                                )}
                                {word.status !== "mastered" && (
                                  <Button
                                    variant="ghost"
                                    className="h-10 flex-1 rounded-none text-green-600"
                                    onClick={() => updateWordStatus(word.id, "mastered")}
                                  >
                                    <Check className="mr-1 size-4" />
                                    تسلط
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {words.filter((w) => w.status === "learning" || w.status === "reviewing").length >= 5 && (
                  <div className="mt-8">
                    <AdvancedFlashcardSystem
                      words={words.filter((w) => w.status === "learning" || w.status === "reviewing").map(mapToFlashcardWord)}
                      userLevel="intermediate"
                      onComplete={() => {}}
                      onUpdateStatus={updateWordStatus}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
