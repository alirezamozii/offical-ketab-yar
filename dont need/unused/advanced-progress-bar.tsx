"use client"

import { useState, useCallback } from "react"

import { BookMarked } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface AdvancedProgressBarProps {
  currentPage: number
  totalPages: number
  bookmarks?: number[]
  onPageSelect: (page: number) => void
}

export function AdvancedProgressBar({
  currentPage,
  totalPages,
  bookmarks = [],
  onPageSelect,
}: AdvancedProgressBarProps) {
  const [showPopover, setShowPopover] = useState(false)

  const handlePageSelect = useCallback(
    (value: number[]) => {
      onPageSelect(value[0])
    },
    [onPageSelect]
  )

  // تعداد نقاط نمایش داده شده در نوار پیشرفت
  const totalDots = Math.min(totalPages, 20)

  // محاسبه فاصله بین نقاط
  const pageGap = Math.ceil(totalPages / totalDots)

  // ایجاد آرایه نقاط
  const dots = Array.from({ length: totalDots }, (_, i) => (i + 1) * pageGap)

  // درصد پیشرفت
  const progressPercentage = (currentPage / totalPages) * 100

  return (
    <div className="relative w-full">
      <Slider
        value={[currentPage]}
        min={1}
        max={totalPages}
        step={1}
        onValueChange={handlePageSelect}
        className="relative z-10"
      />
      {bookmarks.map((page) => (
        <button
          key={page}
          type="button"
          aria-label={`برو به صفحه ${page}`}
          className={cn(
            "bg-gold-500 absolute top-1/2 z-20 size-3 -translate-y-1/2 cursor-pointer rounded-full",
            "hover:ring-gold-400 focus:ring-gold-400 hover:ring-2 hover:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
          )}
          style={{
            left: `${((page - 1) / (totalPages - 1)) * 100}%`,
          }}
          onClick={() => onPageSelect(page)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onPageSelect(page)
            }
          }}
        />
      ))}

      <div className="relative w-full max-w-md">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onPageSelect(currentPage)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPageSelect(currentPage)
            }
          }}
          className="relative h-2 w-full cursor-pointer rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <div
            className="bg-gold-500 h-full rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="relative mt-1 h-6">
          {dots.map((page, index) => {
            const actualPage = Math.min(page, totalPages)
            const position = (actualPage / totalPages) * 100
            const isBookmarked = bookmarks.some((b) => Math.abs(b - actualPage) <= pageGap / 2)

            return (
              <div key={index} className="absolute top-0 -translate-x-1/2" style={{ left: `${position}%` }}>
                {isBookmarked ? (
                  <BookMarked className="text-gold-500 size-4 cursor-pointer" onClick={() => onPageSelect(actualPage)} />
                ) : (
                  <div
                    className={cn(
                      "size-2 cursor-pointer rounded-full",
                      Math.abs(currentPage - actualPage) <= pageGap / 2 ? "bg-gold-500" : "bg-gray-300 dark:bg-gray-600",
                    )}
                    onClick={() => onPageSelect(actualPage)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground absolute right-0 top-0 -mt-6 text-xs">
            {currentPage} / {totalPages}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="mb-2 text-sm font-medium">رفتن به صفحه</div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="size-8 p-0"
                onClick={() => {
                  const page = Math.max(1, Math.min(totalPages, Math.ceil(totalPages * ((i + 1) / 10))))
                  onPageSelect(page)
                  setShowPopover(false)
                }}
              >
                {Math.ceil(totalPages * ((i + 1) / 10))}
              </Button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="bg-gold-500 size-2 rounded-full" />
              <span className="text-xs">صفحه فعلی</span>
            </div>
            <div className="flex items-center gap-1">
              <BookMarked className="text-gold-500 size-3" />
              <span className="text-xs">بوکمارک</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
