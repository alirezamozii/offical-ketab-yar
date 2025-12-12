'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { useLibraryStore } from '@/lib/store/library-store'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronDown, Filter, Grid3x3, List, Search, Sparkles, Star, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'

interface Category {
  id: string | number
  name: string
  slug: string
  _id?: string
  bookCount?: number
}

interface LibraryHeaderProps {
  categories: Category[]
}

export function LibraryHeader({ categories }: LibraryHeaderProps) {
  const { viewMode, setViewMode } = useLibraryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [ratingRange, setRatingRange] = useState([0, 5])
  const [sortBy, setSortBy] = useState('popular')

  const languages = ['English', 'Persian']

  // Use categories from Sanity (passed as prop)
  const availableGenres = categories.map(c => c.name)

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedLanguages([])
    setRatingRange([0, 5])
    setSearchQuery('')
  }

  const activeFiltersCount = selectedGenres.length + selectedLanguages.length + (ratingRange[0] > 0 || ratingRange[1] < 5 ? 1 : 0)

  return (
    <div className="relative border-b bg-gradient-to-b from-background via-background to-muted/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 sticky top-16 z-40 shadow-lg">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 bg-gold-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="h-8 w-8 text-gold-600 dark:text-gold-500" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-700 via-gold-600 to-gold-500 dark:from-gold-600 dark:via-gold-500 dark:to-gold-400 bg-clip-text text-transparent">
              کتابخانه
            </h1>
          </div>
          <p className="text-gray-700 dark:text-muted-foreground text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold-600 dark:text-gold-500" />
            کاوش در بیش از 1000 کتاب برتر
          </p>
        </motion.div>

        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Enhanced Search */}
          <motion.div
            className="relative flex-1"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Search className="h-5 w-5 text-gold-600 dark:text-gold-500" />
              </motion.div>
            </div>
            <Input
              placeholder="جستجوی کتاب، نویسنده یا ژانر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-base border-2 border-gold-500/20 focus:border-gold-500/50 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-gold-500/20"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Genre Dropdown */}
          {availableGenres.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Button
                    variant="outline"
                    className="h-12 border-2 border-gold-500/30 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-gold-600/60 transition-all duration-300 gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-gold-600 dark:text-gold-500" />
                    <span>ژانرها</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                    {selectedGenres.length > 0 && (
                      <Badge className="mr-1 h-5 w-5 p-0 flex items-center justify-center bg-gold-600 text-white">
                        {selectedGenres.length}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 max-h-[400px] overflow-y-auto"
                dir="rtl"
              >
                <DropdownMenuLabel className="text-right">انتخاب ژانر</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-right mb-2"
                    onClick={() => setSelectedGenres([])}
                  >
                    <BookOpen className="ml-2 h-4 w-4" />
                    همه کتاب‌ها
                  </Button>
                  {availableGenres.map((genre) => (
                    <DropdownMenuItem
                      key={genre}
                      className="cursor-pointer text-right"
                      onClick={() => handleGenreToggle(genre)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{genre}</span>
                        {selectedGenres.includes(genre) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-2 w-2 rounded-full bg-gold-600"
                          />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}



          {/* Enhanced Sort */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[220px] h-12 border-2 border-gold-500/30 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-gold-600/60 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-gold-600 dark:text-gold-500" />
                  <SelectValue placeholder="مرتب‌سازی" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    پرخواننده‌ترین
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    جدیدترین
                  </div>
                </SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    بالاترین امتیاز
                  </div>
                </SelectItem>
                <SelectItem value="title-asc">عنوان (الف-ی)</SelectItem>
                <SelectItem value="title-desc">عنوان (ی-الف)</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Enhanced View Mode with Morphing Background - FIXED */}
          <div className="hidden md:flex items-center gap-2 border-2 border-gold-500/30 rounded-xl p-1.5 bg-background/80 backdrop-blur-sm shadow-lg relative">
            {/* Morphing Background Indicator - FIXED: Grid=left(0), List=right(44) */}
            <motion.div
              className="absolute top-1.5 left-1.5 w-9 h-9 bg-gradient-to-r from-gold-600 to-gold-500 rounded-lg shadow-lg shadow-gold-500/30"
              animate={{
                x: viewMode === 'grid' ? 0 : 44
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25
              }}
            />

            {/* Grid Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                  ? 'text-white hover:bg-transparent'
                  : 'hover:bg-gold-500/10'
                  }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* List Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${viewMode === 'list'
                  ? 'text-white hover:bg-transparent'
                  : 'hover:bg-gold-500/10'
                  }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Enhanced Filters Button */}
          <Sheet>
            <SheetTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="relative h-12 border-2 border-gold-500/30 bg-gradient-to-r from-gold-500/15 to-gold-400/15 hover:from-gold-500/25 hover:to-gold-400/25 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-gold-600/60 transition-all duration-300"
                >
                  <Filter className="ml-2 h-5 w-5 text-gold-700 dark:text-gold-600" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">فیلترها</span>
                  <AnimatePresence>
                    {activeFiltersCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -left-2"
                      >
                        <Badge className="h-6 w-6 p-0 flex items-center justify-center bg-gradient-to-r from-gold-600 to-gold-500 shadow-lg shadow-gold-500/50 animate-pulse">
                          {activeFiltersCount}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>فیلترها</SheetTitle>
                <SheetDescription>
                  کتاب‌های مورد نظر خود را پیدا کنید
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Genres */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">ژانر</Label>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`genre-${category.id}`}
                          checked={selectedGenres.includes(category.slug)}
                          onCheckedChange={() => handleGenreToggle(category.slug)}
                        />
                        <Label
                          htmlFor={`genre-${category.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">زبان</Label>
                  <div className="space-y-3">
                    {languages.map((language) => (
                      <div key={language} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`lang-${language}`}
                          checked={selectedLanguages.includes(language)}
                          onCheckedChange={() => handleLanguageToggle(language)}
                        />
                        <Label
                          htmlFor={`lang-${language}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {language === 'English' ? 'انگلیسی' : 'فارسی'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    امتیاز: {ratingRange[0]} - {ratingRange[1]}
                  </Label>
                  <Slider
                    min={0}
                    max={5}
                    step={0.5}
                    value={ratingRange}
                    onValueChange={setRatingRange}
                    className="mt-2"
                  />
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                  >
                    <X className="ml-2 h-4 w-4" />
                    پاک کردن فیلترها
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Enhanced Active Filters */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gold-500/5 to-gold-400/5 border border-gold-500/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gold-700 dark:text-gold-600" />
                  <span className="text-sm font-semibold text-gold-800 dark:text-gold-400">
                    فیلترهای فعال ({activeFiltersCount})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs hover:bg-gold-500/10 hover:text-gold-700 dark:hover:text-gold-600"
                >
                  <X className="h-3 w-3 ml-1" />
                  پاک کردن همه
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedGenres.map((genre, index) => (
                  <motion.div
                    key={genre}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-2 pr-3 pl-1 py-1.5 bg-gold-500/15 text-gold-800 dark:text-gold-400 border border-gold-500/40 hover:bg-gold-500/25 transition-colors"
                    >
                      <Sparkles className="h-3 w-3 text-gold-700 dark:text-gold-500" />
                      {categories.find(c => c.slug === genre)?.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full hover:bg-gold-500/30"
                        onClick={() => handleGenreToggle(genre)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
                {selectedLanguages.map((language, index) => (
                  <motion.div
                    key={language}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2, delay: (selectedGenres.length + index) * 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-2 pr-3 pl-1 py-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                    >
                      {language === 'English' ? 'انگلیسی' : 'فارسی'}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full hover:bg-blue-500/30"
                        onClick={() => handleLanguageToggle(language)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
                {(ratingRange[0] > 0 || ratingRange[1] < 5) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2, delay: (selectedGenres.length + selectedLanguages.length) * 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-2 pr-3 pl-1 py-1.5 bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25 transition-colors"
                    >
                      <Star className="h-3 w-3 text-amber-700 dark:text-amber-500" />
                      امتیاز: {ratingRange[0]}-{ratingRange[1]}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full hover:bg-amber-500/30"
                        onClick={() => setRatingRange([0, 5])}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
