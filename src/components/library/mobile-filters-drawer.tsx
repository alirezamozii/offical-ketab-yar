'use client'

import { Button } from '@/components/ui/button'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface MobileFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeFiltersCount: number
  status: string
  setStatus: (status: any) => void
  minRating: number
  setMinRating: (rating: number) => void
  genre: string
  setGenre: (genre: string) => void
  popularGenres: string[]
  genres: string[]
  statusOptions: readonly { readonly value: string; readonly label: string }[]
  ratingOptions: { value: number; label: string }[]
  activeFilters: any[]
  clearAll: () => void
  filteredCount: number
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'tap-feedback rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function MobileFiltersDrawer({
  open,
  onOpenChange,
  activeFiltersCount,
  status,
  setStatus,
  minRating,
  setMinRating,
  genre,
  setGenre,
  popularGenres,
  genres,
  statusOptions,
  ratingOptions,
  activeFilters,
  clearAll,
  filteredCount,
}: MobileFiltersDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-lg sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فیلتر
          {activeFiltersCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" aria-describedby={undefined} className="max-h-[88vh] overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <Filter className="h-4 w-4 text-primary" />
            فیلترها
          </SheetTitle>
        </SheetHeader>
        <div className="p-5 space-y-4">
          {/* Status pills */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">وضعیت مطالعه</p>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((opt) => (
                <Chip key={opt.value} active={status === opt.value} onClick={() => setStatus(opt.value)}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
          {/* Rating chips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">حداقل امتیاز</p>
            <div className="flex flex-wrap gap-1.5">
              {ratingOptions.map((r) => (
                <Chip key={r.value} active={minRating === r.value} onClick={() => setMinRating(r.value)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
          {/* Genre chips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">ژانر</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={!genre} onClick={() => setGenre('')}>همه</Chip>
              {(popularGenres.length > 0 ? popularGenres : genres).map((g) => (
                <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? '' : g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-md">
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={activeFilters.length === 0} className="gap-1.5">
            <X className="h-4 w-4" />
            پاک کردن
          </Button>
          <Button size="sm" variant="glow" onClick={() => onOpenChange(false)} className="flex-1 max-w-[60%]">
            نمایش {filteredCount.toLocaleString('fa-IR')} کتاب
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
