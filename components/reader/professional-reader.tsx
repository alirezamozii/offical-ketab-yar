'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/custom-toast'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { useReadingPreferences } from '@/hooks/use-reading-preferences'
import { useReadingProgress } from '@/hooks/use-reading-progress'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, ChevronRight, Highlighter,
  MessageSquare,
  Settings,
  Type, X
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AIChatPanel } from './ai-chat-panel'
import { HighlightsPanel } from './highlights-panel'
import { TextSelectionMenu } from './text-selection-menu'

// --- DYNAMIC IMPORTS ---
const PhysicsPageTurn = dynamic(
  () => import('./physics/PhysicsPageTurn').then((mod) => mod.PhysicsPageTurn),
  { loading: () => null, ssr: false }
)

const WordPopupDictionary = dynamic(
  () => import('./word-popup-dictionary').then((mod) => mod.WordPopupDictionary),
  { loading: () => null, ssr: false }
)

// --- INTERFACES ---
interface BilingualItem {
  english: string
  farsi: string
  type: 'text' | 'heading'
}

interface ReaderPageContent {
  pageNumber: number
  items: BilingualItem[]
}

interface Highlight {
  page: number
  text: string
  color: string
  id: string
  timestamp: number
}

interface ReaderProps {
  book: {
    pages: ReaderPageContent[]
    title: string
    slug: string
    author?: string
  }
}

// --- MAIN COMPONENT ---
export function ProfessionalReader({ book }: ReaderProps) {
  // 1. HOOKS & STATE
  const { preferences, updatePreference } = useReadingPreferences()

  // Layout & UI State
  const [isMobile, setIsMobile] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)
  const [showDictionary, setShowDictionary] = useState(false)

  // Reading State
  const [currentPage, setCurrentPage] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Appearance State
  const [fontSize, setFontSize] = useState(20)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia')
  const [currentLanguage, setCurrentLanguage] = useState<'english' | 'farsi'>('english')
  const [showSubtitles, setShowSubtitles] = useState(true)

  // Interaction State
  const [selectedText, setSelectedText] = useState('')
  const [showTextMenu, setShowTextMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [selectedRange, setSelectedRange] = useState<Range | null>(null)
  const [dictionaryWord, setDictionaryWord] = useState('')
  const [highlights, setHighlights] = useState<Highlight[]>([])

  // Refs
  const pageRef = useRef<HTMLDivElement>(null)
  const totalPages = book.pages.length

  // Helper Functions
  const getCurrentPageItems = () => book.pages[currentPage]?.items || []

  // Progress Tracking
  const { markParagraphAsRead } = useReadingProgress({
    bookId: book.slug,
    chapterNumber: currentPage,
    totalParagraphs: getCurrentPageItems().length
  })

  // Mark read logic
  useEffect(() => {
    const items = getCurrentPageItems()
    if (items.length > 0) {
      items.forEach((_, idx) => markParagraphAsRead(idx))
    }
  }, [currentPage, markParagraphAsRead])

  // --- THEME CONFIGURATION (SOLVED: SOLID COLORS) ---
  // حذف شفافیت (/95) و backdrop-blur برای جلوگیری از تداخل رنگ با تم اصلی سایت
  const themeStyles = {
    light: {
      bg: 'bg-[#faf8f3]', // Solid
      text: 'text-[#2a2a2a]',
      accent: 'text-gold-600',
      headerBg: 'bg-[#faf8f3]', // Solid - No transparency
      headerBorder: 'border-[#e4dcc8]',
      highlight: 'bg-yellow-200', // Solid highlight usually looks better or distinct opacity
      sliderTrack: 'bg-gray-200',
      sliderRange: 'bg-gold-500'
    },
    sepia: {
      bg: 'bg-[#f4ecd8]', // Solid
      text: 'text-[#5f4b32]',
      accent: 'text-[#8a6a4b]',
      headerBg: 'bg-[#f4ecd8]', // Solid
      headerBorder: 'border-[#d9c8a6]',
      highlight: 'bg-orange-200',
      sliderTrack: 'bg-[#e0d0b0]',
      sliderRange: 'bg-[#8a6a4b]'
    },
    dark: {
      bg: 'bg-[#1a1814]', // Solid
      text: 'text-[#e8e4dc]',
      accent: 'text-gold-400',
      headerBg: 'bg-[#1a1814]', // Solid
      headerBorder: 'border-[#3d3830]',
      highlight: 'bg-gold-900',
      sliderTrack: 'bg-[#2a2620]',
      sliderRange: 'bg-gold-500'
    }
  }

  const currentTheme = themeStyles[theme]

  const getCurrentPagePlainText = () => {
    return getCurrentPageItems()
      .map(item => currentLanguage === 'english' ? item.english : item.farsi)
      .join('\n\n')
  }

  // Load & Save State (Effects)
  useEffect(() => {
    if (!book?.slug) return;
    try {
      const stored = localStorage.getItem(`highlights_${book.slug}`)
      if (stored) setHighlights(JSON.parse(stored))
    } catch (e) { console.error(e) }

    try {
      const storedState = localStorage.getItem(`reader_state_${book.slug}`)
      if (storedState) {
        const state = JSON.parse(storedState)
        if (state.currentPage !== undefined) setCurrentPage(state.currentPage)
        if (state.theme) setTheme(state.theme)
        if (state.fontSize) setFontSize(state.fontSize)
        if (state.lineHeight) setLineHeight(state.lineHeight)
        if (state.showSubtitles !== undefined) setShowSubtitles(state.showSubtitles)
      }
    } catch (e) { console.error(e) }
  }, [book.slug])

  useEffect(() => {
    if (!book?.slug) return;
    localStorage.setItem(`highlights_${book.slug}`, JSON.stringify(highlights))
    localStorage.setItem(`reader_state_${book.slug}`, JSON.stringify({
      currentPage, theme, fontSize, lineHeight, showSubtitles, lastReadAt: Date.now()
    }))
  }, [highlights, currentPage, theme, fontSize, lineHeight, showSubtitles, book.slug])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') nextPage()
      if (e.key === 'ArrowRight') prevPage()
      if (e.key === 'Escape') {
        setShowSettings(false)
        setShowChat(false)
        setShowTextMenu(false)
        setShowHighlights(false)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage])

  // Highlight Logic
  const restoreHighlightsToDOM = useCallback(() => {
    const pageHighlights = highlights.filter(h => h.page === currentPage)
    if (pageHighlights.length === 0 || !pageRef.current) return

    // Clean first
    const existing = pageRef.current.querySelectorAll('[data-highlight-id]')
    existing.forEach(span => {
      const parent = span.parentNode
      if (parent) {
        while (span.firstChild) parent.insertBefore(span.firstChild, span)
        parent.removeChild(span)
      }
    })

    const walker = document.createTreeWalker(pageRef.current, NodeFilter.SHOW_TEXT, null)
    const textNodes: Text[] = []
    let node
    while ((node = walker.nextNode())) textNodes.push(node as Text)

    pageHighlights.forEach(highlight => {
      for (const textNode of textNodes) {
        const text = textNode.textContent || ''
        const index = text.indexOf(highlight.text)
        if (index !== -1) {
          try {
            const range = document.createRange()
            range.setStart(textNode, index)
            range.setEnd(textNode, index + highlight.text.length)
            const span = document.createElement('span')
            span.className = `highlight-${highlight.color}`
            span.setAttribute('data-highlight-id', highlight.id)
            const baseColors: Record<string, string> = {
              yellow: 'rgba(251, 209, 32, 0.4)',
              orange: 'rgba(252, 156, 74, 0.4)',
              gold: 'rgba(202, 172, 105, 0.4)'
            }
            span.style.backgroundColor = baseColors[highlight.color] || baseColors.yellow
            span.style.borderRadius = '3px'
            range.surroundContents(span)
            break
          } catch (e) { }
        }
      }
    })
  }, [highlights, currentPage])

  useEffect(() => {
    const timer = setTimeout(restoreHighlightsToDOM, 50)
    return () => clearTimeout(timer)
  }, [currentPage, highlights, currentLanguage, showSubtitles, restoreHighlightsToDOM])

  // Actions
  const goToPage = useCallback((page: number) => {
    if (page < 0 || page >= totalPages || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(page)
      setTimeout(() => setIsTransitioning(false), 250)
    }, 50)
  }, [totalPages, isTransitioning])

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 0 && selection && selection.rangeCount > 0) {
      setSelectedText(text)
      const range = selection.getRangeAt(0)
      setSelectedRange(range.cloneRange())
      const rect = range.getBoundingClientRect()

      if (rect) {
        const menuHeight = 60
        let topPos = rect.top - menuHeight
        if (topPos < 80) {
          topPos = rect.bottom + 10
        }
        setMenuPosition({ x: rect.left + rect.width / 2, y: topPos })
        setShowTextMenu(true)
      }
    } else {
      setShowTextMenu(false)
      setSelectedRange(null)
    }
  }, [])

  const addHighlight = (color: string) => {
    if (selectedText && selectedRange) {
      const id = `highlight-${Date.now()}`
      setHighlights(prev => [...prev, {
        text: selectedText, page: currentPage, color, id, timestamp: Date.now()
      }])
      setShowTextMenu(false)
      window.getSelection()?.removeAllRanges()
      toast.success('Highlight saved')
    }
  }

  const handleShowDictionary = () => {
    if (!selectedText || selectedText.trim().length === 0) return
    const cleanWord = selectedText.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    if (cleanWord.length > 0) {
      setDictionaryWord(cleanWord)
      setShowDictionary(true)
      setShowTextMenu(false)
    } else {
      toast.error("Please select a valid word")
    }
  }

  if (!book || !book.pages || book.pages.length === 0) {
    return <div className="p-10 text-center">Error: No book content found.</div>
  }

  // --- RENDER (ISOLATED FULL SCREEN) ---
  return (
    // z-[9999] = بالاترین لایه ممکن
    // fixed inset-0 = تمام صفحه و ثابت
    // isolate = جلوگیری از تداخل CSS خارجی
    <div className={cn(
      "fixed inset-0 z-[9999] w-screen h-screen flex flex-col isolate overflow-hidden",
      currentTheme.bg,
      currentTheme.text
    )}>

      {/* --- TOP BAR --- */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: showControls ? 0 : -100 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "absolute top-0 left-0 right-0 z-40 border-b shadow-sm h-16 flex items-center transition-colors duration-500",
          currentTheme.headerBg,
          currentTheme.headerBorder
        )}
      >
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* دکمه بازگشت به سایت اصلی */}
            <a href={`/books/${book.slug}`} className="flex items-center hover:opacity-70 transition-opacity">
              <ChevronRight className="h-5 w-5" />
              <span className="font-bold ml-2 truncate max-w-[150px] sm:max-w-xs">{book.title}</span>
            </a>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentLanguage(l => l === 'english' ? 'farsi' : 'english')} className="border px-2">
              {currentLanguage === 'english' ? 'EN' : 'FA'}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowSubtitles(!showSubtitles)} className={showSubtitles ? "bg-black/10 dark:bg-white/10" : ""}>
              <Type className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => { setShowHighlights(!showHighlights); setShowSettings(false); }}>
              <Highlighter className="h-4 w-4" />
              {highlights.filter(h => h.page === currentPage).length > 0 &&
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 rounded-full">
                  {highlights.filter(h => h.page === currentPage).length}
                </span>
              }
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)}>
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => { setShowSettings(!showSettings); setShowHighlights(false); }}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* --- MAIN CONTENT --- */}
      <div
        className="flex-1 w-full h-full relative overflow-hidden"
        onClick={() => setShowControls(!showControls)}
      >
        <PhysicsPageTurn
          pageKey={currentPage}
          onPageTurn={(dir) => dir === 'next' ? nextPage() : prevPage()}
          theme={theme === 'dark' ? 'dark' : 'light'}
          canGoNext={currentPage < totalPages - 1}
          canGoPrev={currentPage > 0}
          className="w-full h-full"
        >
          <div id="reader-content-area" className="w-full h-full overflow-y-auto px-4 pt-20 pb-28 scroll-smooth">
            <div className="max-w-3xl mx-auto min-h-[80vh]">
              <div
                ref={pageRef}
                key={`page-${currentPage}-${theme}`}
                className={cn(
                  "prose prose-lg max-w-none transition-opacity duration-300 ease-out",
                  isTransitioning ? "opacity-0" : "opacity-100"
                )}
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, color: 'inherit' }}
                dir={currentLanguage === 'farsi' ? 'rtl' : 'ltr'}
                onMouseUp={(e) => { e.stopPropagation(); handleTextSelection(); }}
              >
                {getCurrentPageItems().length === 0 ? (
                  <div className="text-center py-20 opacity-50 italic">Page is empty</div>
                ) : (
                  getCurrentPageItems().map((item, idx) => (
                    <div key={idx} className="mb-8 relative group">
                      {item.type === 'heading' ? (
                        <h3 className="text-2xl font-bold mb-4">{currentLanguage === 'english' ? item.english : item.farsi}</h3>
                      ) : (
                        <p>{currentLanguage === 'english' ? item.english : item.farsi}</p>
                      )}
                      <AnimatePresence>
                        {showSubtitles && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 0.75, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                              "mt-2 text-[0.9em] border-l-2 pl-3",
                              theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                            )}
                            dir={currentLanguage === 'farsi' ? 'ltr' : 'rtl'}
                          >
                            {currentLanguage === 'english' ? item.farsi : item.english}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-12 mb-4 text-center text-sm opacity-50">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>
          </div>
        </PhysicsPageTurn>
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showControls ? 0 : 100 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "absolute bottom-0 left-0 right-0 z-40 border-t shadow-lg pb-safe transition-colors duration-500",
          currentTheme.headerBg,
          currentTheme.headerBorder
        )}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-6">
          <Button variant="ghost" onClick={prevPage} disabled={currentPage === 0}>
            <ArrowRight className="mr-2 h-4 w-4" /> Previous
          </Button>
          <div className="flex-1">
            <Slider value={[currentPage]} max={totalPages - 1} step={1} onValueChange={(val) => goToPage(val[0])} className="cursor-pointer" />
          </div>
          <Button variant="ghost" onClick={nextPage} disabled={currentPage === totalPages - 1}>
            Next <ArrowLeft className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {showTextMenu && (
          <TextSelectionMenu
            position={menuPosition} theme={theme} selectedText={selectedText}
            onHighlight={addHighlight} onShowDictionary={handleShowDictionary}
            onAddToVocabulary={() => toast.success('Added to vocab')}
            onCopy={() => { navigator.clipboard.writeText(selectedText); toast.success('Copied'); setShowTextMenu(false) }}
            onAIChat={() => { setShowChat(true); setShowTextMenu(false) }}
            onClose={() => setShowTextMenu(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDictionary && (
          <WordPopupDictionary
            word={dictionaryWord} context={getCurrentPagePlainText().slice(0, 100)} theme={theme}
            onClose={() => setShowDictionary(false)} onSaveWord={() => { }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn("fixed inset-y-0 left-0 w-80 z-[100] shadow-2xl p-6 overflow-y-auto border-r", currentTheme.bg, currentTheme.text)}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}><X /></Button>
            </div>
            {/* Settings content truncated for brevity - same as before */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {['light', 'sepia', 'dark'].map((t) => (
                    <button key={t} onClick={() => setTheme(t as any)} className={cn("p-3 rounded border capitalize", theme === t ? "ring-2 ring-primary border-primary" : "border-gray-300 opacity-70")}>{t}</button>
                  ))}
                </div>
              </div>
              <Separator />
              <div><label className="block mb-2 font-medium">Font Size: {fontSize}px</label><Slider value={[fontSize]} min={12} max={32} step={1} onValueChange={(v) => setFontSize(v[0])} /></div>
              <div><label className="block mb-2 font-medium">Line Height: {lineHeight}</label><Slider value={[lineHeight]} min={1.2} max={2.4} step={0.1} onValueChange={(v) => setLineHeight(v[0])} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHighlights && (
          <motion.div
            initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[100]"
          >
            <HighlightsPanel
              highlights={highlights} currentPage={currentPage} theme={theme}
              onClose={() => setShowHighlights(false)} onDelete={(id) => setHighlights(h => h.filter(x => x.id !== id))}
              onCopy={(text) => navigator.clipboard.writeText(text)} onJumpToPage={goToPage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChat && (
          <AIChatPanel
            bookTitle={book.title} bookAuthor={book.author} currentPage={currentPage + 1}
            currentPageText={getCurrentPagePlainText()} previousPages={[]} selectedText={selectedText}
            theme={theme} onClose={() => setShowChat(false)} isMobile={isMobile}
          />
        )}
      </AnimatePresence>

    </div>
  )
}