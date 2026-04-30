"use client"

import { useState, useEffect } from "react"

import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { BaseWord} from "@/types/vocabulary";

interface RawSuggestedWord {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  level: "beginner" | "intermediate" | "advanced";
  book_id: string;
  books: { title: string }[];
}

interface WordSuggestionsProps {
  userLevel: string
  onAddWord: (word: BaseWord) => void
}

export function WordSuggestions({ userLevel, onAddWord }: WordSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BaseWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setIsLoading(true)
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        // Get user's current words
        const { data: userWords } = await supabase
          .from("user_words")
          .select("word")
          .eq("userId", userData.user.id)

        const userWordSet = new Set(userWords?.map((w: { word: string }) => w.word.toLowerCase()) || [])

        // Get suggested words based on user level
        let query = supabase
          .from("vocabulary_suggestions")
          .select(`
            id,
            word,
            meaning,
            example,
            level,
            book_id,
            books (title)
          `)
          .limit(10)

        if (userLevel === "beginner") {
          query = query.eq("level", "beginner")
        } else if (userLevel === "intermediate") {
          query = query.in("level", ["beginner", "intermediate"])
        }

        const { data: suggestedWords, error } = await query

        if (error) throw error

        // Filter out words the user already has and map to BaseWord type
        const filteredSuggestions: BaseWord[] = (suggestedWords as RawSuggestedWord[])
          .filter(word => !userWordSet.has(word.word.toLowerCase()))
          .map(word => ({
            id: word.id,
            word: word.word,
            meaning: word.meaning,
            level: word.level
          }))

        setSuggestions(filteredSuggestions)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        toast.error("خطا در دریافت پیشنهادات")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [supabase, userLevel])

  const handleAddWord = async (word: BaseWord) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Add word to user's vocabulary
      const { error } = await supabase.from("user_words").insert({
        userId: userData.user.id,
        word: word.word,
        meaning: word.meaning,
        level: word.level,
        status: "learning",
        nextReviewAt: new Date( as any).toISOString()
      })

      if (error) throw error

      onAddWord(word)
      setSuggestions(prev => prev.filter(w => w.id !== word.id))
      toast.success("کلمه به واژگان شما اضافه شد")
    } catch (error) {
      console.error("Error adding word:", error)
      toast.error("خطا در افزودن کلمه")
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex h-32 items-center justify-center">
            <div className="border-primary size-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">پیشنهادات واژگان</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {suggestions.map((word) => (
            <Card key={word.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold">{word.word}</h3>
                  <Badge variant="outline" className={
                    word.level === "beginner" ? "bg-green-50 text-green-600" :
                    word.level === "intermediate" ? "bg-blue-50 text-blue-600" :
                    "bg-purple-50 text-purple-600"
                  }>
                    {word.level === "beginner" ? "مبتدی" :
                     word.level === "intermediate" ? "متوسط" :
                     "پیشرفته"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3 text-sm">{word.meaning}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleAddWord(word)}
                >
                  <Plus className="mr-1 size-4" />
                  افزودن به واژگان
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 