'use client'

import React, { useState, useMemo, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Layers,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Eye,
  Sliders,
  Send,
  Save,
  CheckCheck,
  FileCode,
  ArrowRight,
  GitCompare,
  X,
  FileUp,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Tag,
  Plus,
} from 'lucide-react'
import { buildEpubBatchAiPrompt } from '../prompts/ai-prompts'
import { parseEpubFileAction, importFullBookBundleAction } from './content-actions'
import { parseAnyJsonPayload } from '@/lib/json-payload-helpers'

export interface EpubBatchStudioProps {
  onBookCreated?: (slug: string) => void
}

interface PageConflict {
  pageNumber: number
  oldFarsi: string
  newFarsi: string
  action: 'pending' | 'overwrite' | 'keep'
}

export const EpubBatchStudio: React.FC<EpubBatchStudioProps> = ({ onBookCreated }) => {
  // State 1: Upload & Parsed Book
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedBook, setParsedBook] = useState<any | null>(null)
  const [actualPageCountInput, setActualPageCountInput] = useState<string>('')

  // State 2: Selection & Prompt Config
  const [selectedChapterOrder, setSelectedChapterOrder] = useState<number | 'custom'>('custom')
  const [startPage, setStartPage] = useState<number>(1)
  const [endPage, setEndPage] = useState<number>(20)
  const [includeRules, setIncludeRules] = useState<boolean>(true)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  // State 3: Translation Ingestion & Synchronization
  const [persianJsonInput, setPersianJsonInput] = useState<string>('')
  const [syncingPersian, setSyncingPersian] = useState<boolean>(false)
  const [syncLog, setSyncLog] = useState<string>('')
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<number>(1)

  // State 4: Conflicts & Diff Modal
  const [conflicts, setConflicts] = useState<PageConflict[]>([])
  const [activeConflictIdx, setActiveConflictIdx] = useState<number>(0)
  const [pendingMergedPages, setPendingMergedPages] = useState<any[] | null>(null)
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false)
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false)

  // State 5: Book metadata overrides & Commit
  const [bookGenres, setBookGenres] = useState<string[]>(['Fantasy', 'Adventure', 'Young Adult'])
  const [genreInputText, setGenreInputText] = useState<string>('')
  const [bookLevel, setBookLevel] = useState<string>('B1')
  const [coverFrom, setCoverFrom] = useState<string>('#7f1d1d')
  const [coverTo, setCoverTo] = useState<string>('#450a0a')
  const [coverAccent, setCoverAccent] = useState<string>('#f4d35e')
  const [committing, setCommitting] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const jsonBatchFilesRef = useRef<HTMLInputElement | null>(null)
  const restoreDraftRef = useRef<HTMLInputElement | null>(null)

  // Handle EPUB Upload & Parse
  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile)
    setParsing(true)
    setStatusMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const result = await parseEpubFileAction(formData)
      if (result.success && result.data) {
        setParsedBook(result.data)
        setStartPage(1)
        setEndPage(Math.min(25, result.data.totalPages))
        setSelectedChapterOrder(result.data.chapters[0]?.order || 1)
        setStatusMessage({
          type: 'success',
          text: `کتاب «${result.data.title}» با موفقیت تحلیل شد (${result.data.chapters.length} فصل و ${result.data.totalPages} صفحه).`,
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'خطا در تحلیل فایل EPUB.',
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطای غیرمنتظره در استخراج EPUB.',
      })
    } finally {
      setParsing(false)
    }
  }

  const handleRecalculatePages = async () => {
    if (!file || !actualPageCountInput) return
    const parsed = parseInt(actualPageCountInput, 10)
    if (isNaN(parsed) || parsed <= 0) {
      setStatusMessage({ type: 'error', text: 'لطفاً یک عدد معتبر برای تعداد صفحات وارد کنید.' })
      return
    }

    setParsing(true)
    setStatusMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('actualPageCount', parsed.toString())

      const result = await parseEpubFileAction(formData)
      if (result.success && result.data) {
        setParsedBook(result.data)
        setStartPage(1)
        setEndPage(Math.min(25, result.data.totalPages))
        setSelectedChapterOrder(result.data.chapters[0]?.order || 1)
        setStatusMessage({
          type: 'success',
          text: `صفحات کتاب مجدداً بر اساس ${parsed} صفحه واقعی کالیبره و تقطیع شد.`,
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'خطا در تحلیل مجدد.',
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطای غیرمنتظره.',
      })
    } finally {
      setParsing(false)
    }
  }

  // Chapter Quick Selection
  const handleSelectChapter = (chOrder: number) => {
    if (!parsedBook) return
    setSelectedChapterOrder(chOrder)
    const ch = parsedBook.chapters.find((c: any) => c.order === chOrder)
    if (ch) {
      setStartPage(ch.startPage)
      setEndPage(ch.endPage)
      setSelectedPreviewPage(ch.startPage)
    }
  }

  // Filtered pages for batch prompt
  const selectedPages = useMemo(() => {
    if (!parsedBook || !parsedBook.pages) return []
    return parsedBook.pages.filter(
      (p: any) => p.pageNumber >= startPage && p.pageNumber <= endPage,
    )
  }, [parsedBook, startPage, endPage])

  // Selected Chapter Name
  const currentSelectedChapterName = useMemo(() => {
    if (!parsedBook || selectedChapterOrder === 'custom') return undefined
    const ch = parsedBook.chapters.find((c: any) => c.order === selectedChapterOrder)
    return ch?.title
  }, [parsedBook, selectedChapterOrder])

  // Generated Prompt String
  const generatedAiPrompt = useMemo(() => {
    if (!parsedBook || selectedPages.length === 0) return ''
    return buildEpubBatchAiPrompt(selectedPages, {
      bookTitle: parsedBook.title,
      authorName: parsedBook.author?.name,
      chapterTitle: currentSelectedChapterName,
      genres: bookGenres,
      level: bookLevel,
      includeRules,
    })
  }, [parsedBook, selectedPages, currentSelectedChapterName, bookGenres, bookLevel, includeRules])

  // Copy Prompt Action
  const handleCopyPrompt = async () => {
    if (!generatedAiPrompt) return
    try {
      await navigator.clipboard.writeText(generatedAiPrompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2500)
    } catch {
      // Fallback
    }
  }

  // Download Prompt as File
  const handleDownloadPrompt = () => {
    if (!generatedAiPrompt) return
    const blob = new Blob([generatedAiPrompt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parsedBook?.slug || 'book'}_prompt_p${startPage}_to_p${endPage}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Process Ingested Persian Pages with Conflict Detection & Diffing
  const processPersianPagesIngestion = (inputPagesList: any[]) => {
    if (!parsedBook) return

    const faMap = new Map<number, string>()
    for (const p of inputPagesList) {
      const num = Number(p.pageNumber || p.page || 0)
      const faText = p.fa || p.farsi || p.textFa || p.persian || ''
      if (num > 0 && faText.trim()) {
        faMap.set(num, faText.trim())
      }
    }

    if (faMap.size === 0) {
      setStatusMessage({
        type: 'error',
        text: 'هیچ متن ترجمه معتبری با شماره صفحه در فایل/کد ارسالی پیدا نشد.',
      })
      return
    }

    const detectedConflicts: PageConflict[] = []
    let directNewCount = 0

    // Check for conflicts against existing pages
    parsedBook.pages.forEach((p: any) => {
      if (faMap.has(p.pageNumber)) {
        const newText = faMap.get(p.pageNumber)!.trim()
        const oldText = (p.farsi || '').trim()

        if (oldText.length > 0 && oldText !== newText) {
          detectedConflicts.push({
            pageNumber: p.pageNumber,
            oldFarsi: oldText,
            newFarsi: newText,
            action: 'pending',
          })
        } else {
          directNewCount++
        }
      }
    })

    // If conflicts exist, open Diff Modal
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts)
      setActiveConflictIdx(0)
      setPendingMergedPages(inputPagesList)
      setShowConflictModal(true)
      setStatusMessage({
        type: 'error',
        text: `توجه: تعداد ${detectedConflicts.length} صفحه قبلاً ترجمه شده بودند و دارای تفاوت متنی هستند. پنجره بررسی تفاوت‌ها (Diff) باز شد.`,
      })
    } else {
      // Direct merge without conflicts
      applyMerge(inputPagesList, 'overwrite')
      setStatusMessage({
        type: 'success',
        text: `تعداد ${faMap.size} صفحه ترجمه فارسی با موفقیت ادغام و سینک شدند!`,
      })
      setPersianJsonInput('')
    }
  }

  // Apply merge into state
  const applyMerge = (
    inputPagesList: any[],
    conflictStrategy: 'overwrite' | 'keep' | 'custom',
    customConflictMap?: Map<number, 'overwrite' | 'keep'>,
  ) => {
    if (!parsedBook) return

    const faMap = new Map<number, string>()
    for (const p of inputPagesList) {
      const num = Number(p.pageNumber || p.page || 0)
      const faText = p.fa || p.farsi || p.textFa || p.persian || ''
      if (num > 0 && faText.trim()) {
        faMap.set(num, faText.trim())
      }
    }

    let mergedCount = 0
    const updatedPages = parsedBook.pages.map((p: any) => {
      if (faMap.has(p.pageNumber)) {
        const newText = faMap.get(p.pageNumber)!
        const oldText = (p.farsi || '').trim()

        if (!oldText) {
          mergedCount++
          return { ...p, farsi: newText }
        }

        if (conflictStrategy === 'overwrite') {
          mergedCount++
          return { ...p, farsi: newText }
        } else if (conflictStrategy === 'keep') {
          return p
        } else if (conflictStrategy === 'custom' && customConflictMap) {
          const action = customConflictMap.get(p.pageNumber) || 'keep'
          if (action === 'overwrite') {
            mergedCount++
            return { ...p, farsi: newText }
          }
          return p
        }
      }
      return p
    })

    setParsedBook({
      ...parsedBook,
      pages: updatedPages,
    })
  }

  // Handle Conflict Modal Resolution
  const handleResolveConflicts = (globalAction?: 'overwrite_all' | 'keep_all') => {
    if (!pendingMergedPages) return

    if (globalAction === 'overwrite_all') {
      applyMerge(pendingMergedPages, 'overwrite')
      setStatusMessage({
        type: 'success',
        text: 'کلیه ترجمه‌های جدید با موفقیت جایگزین شدند.',
      })
    } else if (globalAction === 'keep_all') {
      applyMerge(pendingMergedPages, 'keep')
      setStatusMessage({
        type: 'success',
        text: 'ترجمه‌های قبلی حفظ شدند و فقط صفحات خالی جدید تکمیل شدند.',
      })
    } else {
      const customMap = new Map<number, 'overwrite' | 'keep'>()
      conflicts.forEach((c) => {
        customMap.set(c.pageNumber, c.action === 'overwrite' ? 'overwrite' : 'keep')
      })
      applyMerge(pendingMergedPages, 'custom', customMap)
      setStatusMessage({
        type: 'success',
        text: 'تصمیمات شما برای صفحات دارای تضاد با موفقیت اعمال شد.',
      })
    }

    setShowConflictModal(false)
    setConflicts([])
    setPendingMergedPages(null)
    setPersianJsonInput('')
  }

  // Ingest Persian Translation from Textarea
  const handleSyncPersianTextarea = () => {
    if (!parsedBook || !persianJsonInput.trim()) {
      setStatusMessage({ type: 'error', text: 'لطفاً کد JSON ترجمه فارسی را وارد کنید.' })
      return
    }

    try {
      const payload = parseAnyJsonPayload(persianJsonInput)
      const inputPages: any[] = Array.isArray(payload.pages)
        ? payload.pages
        : Array.isArray(payload)
          ? payload
          : []

      if (inputPages.length === 0) {
        throw new Error('هیچ صفحه‌ای در خروجی ارسالی یافت نشد (آرایه pages خالی است).')
      }

      processPersianPagesIngestion(inputPages)
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `خطا در پارس و ادغام ترجمه فارسی: ${err?.message || String(err)}`,
      })
    }
  }

  // Multi-File JSON Upload Handler
  const handleBatchJsonFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !parsedBook) return
    setStatusMessage(null)

    const allPagesAggregated: any[] = []
    let parsedFilesCount = 0

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      try {
        const text = await f.text()
        const payload = parseAnyJsonPayload(text)
        const pages = Array.isArray(payload.pages)
          ? payload.pages
          : Array.isArray(payload)
            ? payload
            : []
        allPagesAggregated.push(...pages)
        parsedFilesCount++
      } catch (err) {
        console.warn(`Error reading JSON file ${f.name}:`, err)
      }
    }

    if (allPagesAggregated.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'در فایل‌های آپلود شده هیچ صفحه ترجمه‌ای یافت نشد.',
      })
      return
    }

    processPersianPagesIngestion(allPagesAggregated)
  }

  // Translation Progress Statistics
  const translationStats = useMemo(() => {
    if (!parsedBook || !parsedBook.pages) return { total: 0, translated: 0, percent: 0 }
    const total = parsedBook.pages.length
    const translated = parsedBook.pages.filter((p: any) => p.farsi && p.farsi.trim().length > 0).length
    const percent = total > 0 ? Math.round((translated / total) * 100) : 0
    return { total, translated, percent }
  }, [parsedBook])

  // Active Preview Page Object
  const previewPageObj = useMemo(() => {
    if (!parsedBook || !parsedBook.pages) return null
    return parsedBook.pages.find((p: any) => p.pageNumber === selectedPreviewPage) || parsedBook.pages[0]
  }, [parsedBook, selectedPreviewPage])

  const handleAddGenre = (tag: string) => {
    const clean = tag.trim().replace(/^[,،]+|[,،]+$/g, '')
    if (clean && !bookGenres.includes(clean)) {
      setBookGenres([...bookGenres, clean])
    }
    setGenreInputText('')
  }

  const handleRemoveGenre = (genreToRemove: string) => {
    setBookGenres(bookGenres.filter((g) => g !== genreToRemove))
  }

  // Commit Full Book to Database
  const handleCommitToDatabase = async () => {
    if (!parsedBook) return
    setCommitting(true)
    setStatusMessage(null)

    try {
      const fullBundle = {
        title: parsedBook.title,
        titleFa: parsedBook.titleFa || parsedBook.title,
        slug: parsedBook.slug,
        description: `Official bilingual edition of ${parsedBook.title}`,
        descriptionFa: `نسخه استاندارد دوزبانه کتاب «${parsedBook.titleFa || parsedBook.title}»`,
        level: bookLevel,
        genres: bookGenres,
        pageCount: parsedBook.pages.length,
        coverFrom,
        coverTo,
        coverAccent,
        author: parsedBook.author,
        chapters: parsedBook.chapters,
        pages: parsedBook.pages.map((p: any) => ({
          pageNumber: p.pageNumber,
          english: p.english,
          farsi: p.farsi || p.english,
          type: 'text',
        })),
      }

      const res = await importFullBookBundleAction(JSON.stringify(fullBundle))
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `کتاب «${parsedBook.title}» با موفقیت در پایگاه داده کتاب‌یار ذخیره شد!`,
        })
        if (onBookCreated) onBookCreated(parsedBook.slug)
      } else {
        setStatusMessage({
          type: 'error',
          text: `خطا در ذخیره در دیتابیس: ${res.log}`,
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطا در ثبت کتاب در پایگاه داده.',
      })
    } finally {
      setCommitting(false)
    }
  }

  // Save / Load Workspace Draft
  const handleSaveDraftFile = () => {
    if (!parsedBook) return
    const blob = new Blob([JSON.stringify(parsedBook, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parsedBook.slug}_workspace_draft.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestoreDraftFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const draftFile = e.target.files?.[0]
    if (!draftFile) return
    try {
      const text = await draftFile.text()
      const draft = JSON.parse(text)
      if (draft.title && Array.isArray(draft.pages)) {
        setParsedBook(draft)
        setStartPage(1)
        setEndPage(Math.min(25, draft.pages.length))
        setStatusMessage({
          type: 'success',
          text: `پروژه کاری «${draft.title}» با موفقیت بازیابی شد.`,
        })
      } else {
        throw new Error('فرمت فایل پیش‌نویس نامعتبر است.')
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `خطا در بازیابی پیش‌نویس: ${err?.message || String(err)}`,
      })
    }
  }

  return (
    <div className="epub-batch-studio-container" dir="rtl">
      {/* Banner Messages */}
      {statusMessage && (
        <div
          className={`studio-banner-alert ${
            statusMessage.type === 'success' ? 'banner-success' : 'banner-error'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Step 1: Upload & EPUB Ingestion */}
      {!parsedBook ? (
        <div className="epub-upload-hero-card">
          <div className="upload-hero-icon-wrap">
            <BookOpen className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="upload-hero-title">استخراج و تقطیع هوشمند فایل کتاب (EPUB)</h2>
          <p className="upload-hero-subtitle">
            فایل کتاب را برای استخراج ساختار و صفحات آپلود کنید.
          </p>

          <div
            className="epub-dropzone-box"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0])
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".epub"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
              }}
            />
            <UploadCloud className="w-12 h-12 text-zinc-400 mb-3" />
            <span className="text-base font-semibold text-zinc-200">
              {parsing ? 'در حال تحلیل و استخراج صفحات...' : 'برای انتخاب فایل EPUB کلیک کنید یا فایل را اینجا بکشید'}
            </span>
            <span className="text-xs text-zinc-400 mt-1">پشتیبانی از کلیه فایل‌های استاندارد EPUB ناشران</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            {/* Restore Draft Workspace Button */}
            <button
              type="button"
              onClick={() => restoreDraftRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بازیابی پروژه کاری از فایل JSON</span>
            </button>
            <input
              type="file"
              ref={restoreDraftRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleRestoreDraftFile}
            />
          </div>
        </div>
      ) : (
        /* Step 2 & 3: Workspace & Translation Pipeline */
        <div className="epub-workspace-layout">
          {/* Compact Book Header */}
          <div className="epub-stats-header">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-zinc-100 truncate">{parsedBook.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                  <span className="font-semibold text-zinc-300">{parsedBook.author.name}</span>
                  <span>•</span>
                  <span>{parsedBook.chapters.length} فصل</span>
                  <span>•</span>
                  <span>{parsedBook.totalPages} صفحه</span>
                  <span>•</span>
                  <span>{parsedBook.totalWords.toLocaleString()} کلمه</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="translation-progress-badge-wrap">
              <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                <span>پیشرفت کل ترجمه:</span>
                <span className="font-bold text-amber-400">
                  {translationStats.translated} از {translationStats.total} صفحه ({translationStats.percent}%)
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${translationStats.percent}%` }}
                />
              </div>
            </div>

            {/* Calibration inline box */}
            <div className="calibration-inline-box shrink-0">
              <input
                type="number"
                placeholder="تعداد صفحات..."
                value={actualPageCountInput}
                onChange={(e) => setActualPageCountInput(e.target.value)}
                className="calibration-number-input"
              />
              <button
                type="button"
                onClick={handleRecalculatePages}
                disabled={parsing || !actualPageCountInput}
                className="calibration-submit-btn"
                title="محاسبه مجدد تقطیع صفحات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${parsing ? 'animate-spin' : ''}`} />
                <span>کالیبره</span>
              </button>
              <button
                type="button"
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(parsedBook.title + ' book page count')}`, '_blank')}
                className="calibration-google-btn"
                title="جستجوی تعداد صفحات اصلی در گوگل"
              >
                <span>G</span>
              </button>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveDraftFile}
                title="ذخیره پیش‌نویس پروژه کاری"
                className="action-btn-secondary"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>پیش‌نویس</span>
              </button>
              <button
                type="button"
                onClick={() => setParsedBook(null)}
                className="action-btn-secondary"
              >
                <span>تغییر فایل</span>
              </button>
            </div>
          </div>

          {/* === Two-Column Layout: Right=Chapter+Prompt, Left=Persian Input (in RTL) === */}
          <div className="epub-grid-columns">

            {/* RIGHT COLUMN (In RTL): Chapter Selection + Range + Prompt Generator */}
            <div className="epub-control-card">
              <div className="card-header-bar flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="font-bold text-xs text-zinc-100">۱. انتخاب فصل و بازه صفحات</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="epub-preview-modal-btn"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>پیش‌نمایش صفحات</span>
                </button>
              </div>

              {/* Chapter Chips */}
              <div className="chapter-chips-scroll">
                {parsedBook.chapters.map((ch: any) => {
                  const isSelected = selectedChapterOrder === ch.order
                  const chPages = parsedBook.pages.filter(
                    (p: any) => p.pageNumber >= ch.startPage && p.pageNumber <= ch.endPage,
                  )
                  const isComplete = chPages.every((p: any) => p.farsi && p.farsi.trim().length > 0)
                  const isPartial = !isComplete && chPages.some((p: any) => p.farsi && p.farsi.trim().length > 0)
                  return (
                    <button
                      key={ch.order}
                      type="button"
                      onClick={() => handleSelectChapter(ch.order)}
                      className={`chapter-select-chip ${isSelected ? 'active' : ''} ${isComplete ? 'complete' : isPartial ? 'partial' : ''}`}
                    >
                      <span className="font-semibold text-xs truncate max-w-[170px]">{ch.title}</span>
                      <span className="chip-meta-pill">ص {ch.startPage}-{ch.endPage}</span>
                      {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* Range + Rules — single row */}
              <div className="custom-range-row">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300 font-medium">بازه دلخواه:</span>
                  <span className="text-xs text-zinc-500">از</span>
                  <input type="number" min={1} max={parsedBook.totalPages} value={startPage} onChange={(e) => { setSelectedChapterOrder('custom'); setStartPage(Math.max(1, Number(e.target.value))) }} className="range-number-input" />
                  <span className="text-xs text-zinc-500">تا</span>
                  <input type="number" min={startPage} max={parsedBook.totalPages} value={endPage} onChange={(e) => { setSelectedChapterOrder('custom'); setEndPage(Math.min(parsedBook.totalPages, Number(e.target.value))) }} className="range-number-input" />
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">({selectedPages.length} صفحه)</span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={includeRules} onChange={(e) => setIncludeRules(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-amber-500 w-3.5 h-3.5" />
                  <span>اصول طلایی ترجمه</span>
                </label>
              </div>

              {/* Prompt Buttons */}
              <div className="prompt-action-toolbar">
                <button type="button" onClick={handleCopyPrompt} className="copy-prompt-primary-btn">
                  {copiedPrompt ? (<><Check className="w-4 h-4 text-zinc-950" /><span>پرامپت کپی شد!</span></>) : (<><Copy className="w-4 h-4" /><span>کپی پرامپت آماده هوش مصنوعی ({selectedPages.length} صفحه)</span></>)}
                </button>
                <button type="button" onClick={handleDownloadPrompt} className="download-prompt-icon-btn" title="دانلود فایل متنی پرامپت">
                  <Download className="w-4 h-4" /><span>دانلود .txt</span>
                </button>
              </div>
            </div>

            {/* LEFT COLUMN (In RTL): Persian Translation Ingest & Sync */}
            <div className="epub-control-card">
              <div className="card-header-bar flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h3 className="font-bold text-xs text-zinc-100">۲. ورود ترجمه فارسی هوش مصنوعی</h3>
                </div>
                <button
                  type="button"
                  onClick={() => jsonBatchFilesRef.current?.click()}
                  className="action-btn-secondary"
                  title="آپلود یک یا چند فایل JSON پارت‌های ترجمه شده"
                >
                  <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>آپلود فایل‌های JSON</span>
                </button>
                <input
                  type="file"
                  ref={jsonBatchFilesRef}
                  accept=".json"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleBatchJsonFilesUpload(e.target.files)}
                />
              </div>

              <textarea
                value={persianJsonInput}
                onChange={(e) => setPersianJsonInput(e.target.value)}
                placeholder='کد JSON دریافتی از هوش مصنوعی را اینجا Paste کنید...'
                className="persian-json-textarea"
              />

              <button
                type="button"
                disabled={syncingPersian || !persianJsonInput.trim()}
                onClick={handleSyncPersianTextarea}
                className="sync-persian-btn"
              >
                {syncingPersian ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ادغام و تراز پاراگراف‌ها...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>ادغام و سینک ترجمه روی صفحات</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* === Bottom Settings & Commit Card === */}
          <div className="epub-settings-bottom-card">
            <div className="epub-settings-grid">
              
              {/* Level Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>سطح سختی زبان کتاب (CEFR Level):</span>
                </label>
                <div className="cefr-levels-row">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
                    const isActive = bookLevel === lvl
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setBookLevel(lvl)}
                        className={`cefr-level-btn ${isActive ? 'active' : ''}`}
                      >
                        {lvl}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tag-Based Genre Manager */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ژانرهای کتاب (نام ژانر را بنویسید و Enter بزنید):</span>
                </label>
                
                <div className="genre-tag-box">
                  {bookGenres.map((genre) => (
                    <span key={genre} className="genre-tag-pill">
                      {genre}
                      <button
                        type="button"
                        onClick={() => handleRemoveGenre(genre)}
                        className="genre-tag-remove"
                        title="حذف این ژانر"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={genreInputText}
                    onChange={(e) => setGenreInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        handleAddGenre(genreInputText)
                      }
                    }}
                    placeholder="افزودن ژانر جدید..."
                    className="genre-tag-input"
                  />
                  {genreInputText.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddGenre(genreInputText)}
                      className="genre-sug-btn"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  )}
                </div>

                {/* Suggested Quick Genre Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-zinc-500 font-medium">پیشنهادی:</span>
                  {['داستانی', 'فانتزی', 'ماجراجویی', 'رمان', 'کلاسیک', 'Fantasy', 'Adventure', 'Young Adult'].map((sug) => {
                    if (bookGenres.includes(sug)) return null
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddGenre(sug)}
                        className="genre-sug-btn"
                      >
                        + {sug}
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="epub-bottom-actions-row">
              <div className="text-xs text-zinc-400">
                مجموع صفحات: <strong className="text-zinc-200 font-bold">{parsedBook.totalPages}</strong> | ترجمه‌شده: <strong className="text-amber-400 font-bold">{translationStats.translated} ({translationStats.percent}%)</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraftFile}
                  className="download-master-btn"
                  title="دانلود فایل Master JSON با تمام صفحات و ترجمه‌ها"
                >
                  <Download className="w-4 h-4 text-zinc-300" />
                  <span>دانلود Master JSON</span>
                </button>

                <button
                  type="button"
                  disabled={committing}
                  onClick={handleCommitToDatabase}
                  className="commit-database-primary-btn"
                >
                  {committing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت در دیتابیس...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>ثبت مستقیم کتاب در پایگاه داده</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PREVIEW MODAL */}
      {/* ========================================================= */}
      {showPreviewModal && parsedBook && (
        <div className="conflict-diff-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div
            className="conflict-diff-modal-card"
            style={{ maxWidth: '1000px' }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="modal-header-row">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  پیش‌نمایش صفحه {selectedPreviewPage} از {parsedBook.totalPages}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Page Navigation */}
                <button
                  type="button"
                  disabled={selectedPreviewPage <= 1}
                  onClick={() => setSelectedPreviewPage((p: number) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-sm text-zinc-300 px-2 font-mono min-w-[60px] text-center">
                  {selectedPreviewPage} / {parsedBook.totalPages}
                </span>
                <button
                  type="button"
                  disabled={selectedPreviewPage >= parsedBook.totalPages}
                  onClick={() => setSelectedPreviewPage((p: number) => Math.min(parsedBook.totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-zinc-400 hover:text-zinc-200 mr-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Side-by-Side Dual View */}
            {previewPageObj && (
              <div className="bilingual-page-dual-view" style={{ maxHeight: '65vh' }}>
                {/* English Column (LTR) */}
                <div className="english-column-box" dir="ltr">
                  <div className="col-tag">English</div>
                  <div className="col-content">
                    {previewPageObj.english.split(/\n\n+/).map((para: string, idx: number) => (
                      <p key={idx} className="bilingual-para-en">
                        <span className="para-idx-tag">P{idx + 1}</span>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Persian Column (RTL) */}
                <div className="persian-column-box" dir="rtl">
                  <div className="col-tag">فارسی</div>
                  <div className="col-content">
                    {previewPageObj.farsi ? (
                      previewPageObj.farsi.split(/\n\n+/).map((para: string, idx: number) => (
                        <p key={idx} className="bilingual-para-fa">
                          <span className="para-idx-tag">P{idx + 1}</span>
                          {para}
                        </p>
                      ))
                    ) : (
                      <div className="untranslated-placeholder">
                        <AlertTriangle className="w-5 h-5 text-zinc-500 mb-1" />
                        <span className="text-xs text-zinc-400">ترجمه‌ای وجود ندارد.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFLICT RESOLUTION & DIFF VIEWER MODAL */}
      {/* ========================================================= */}
      {showConflictModal && conflicts.length > 0 && (
        <div className="conflict-diff-modal-backdrop">
          <div className="conflict-diff-modal-card">
            {/* Modal Header */}
            <div className="modal-header-row">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-zinc-100">
                  بررسی تفاوت‌ها و حل تضاد ترجمه ({conflicts.length} صفحه دارای ترجمه قبلی)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-1 mb-4">
              صفحات زیر قبلاً در سیستم ترجمه فارسی داشتند و متن ارسالی جدید با ترجمه قبلی تفاوت دارد. می‌توانید تصمیم بگیرید کدام نسخه حفظ شود:
            </p>

            {/* Conflict Page Tabs */}
            <div className="conflict-page-tabs-row">
              {conflicts.map((c, idx) => (
                <button
                  key={c.pageNumber}
                  type="button"
                  onClick={() => setActiveConflictIdx(idx)}
                  className={`conflict-page-tab ${activeConflictIdx === idx ? 'active' : ''}`}
                >
                  <span>صفحه {c.pageNumber}</span>
                  {c.action === 'overwrite' && (
                    <span className="tag-overwrite">جایگزینی</span>
                  )}
                  {c.action === 'keep' && (
                    <span className="tag-keep">حفظ قبلی</span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Conflict Diff Comparison */}
            {conflicts[activeConflictIdx] && (
              <div className="diff-view-container">
                <div className="diff-box old-version-box">
                  <div className="diff-box-title">
                    <span>ترجمه فعلی (قبلی)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...conflicts]
                        updated[activeConflictIdx].action = 'keep'
                        setConflicts(updated)
                      }}
                      className={`select-version-btn ${conflicts[activeConflictIdx].action === 'keep' ? 'active' : ''}`}
                    >
                      حفظ این نسخه
                    </button>
                  </div>
                  <div className="diff-content-text">
                    {conflicts[activeConflictIdx].oldFarsi}
                  </div>
                </div>

                <div className="diff-box new-version-box">
                  <div className="diff-box-title">
                    <span className="text-emerald-400">ترجمه جدید هوش مصنوعی</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...conflicts]
                        updated[activeConflictIdx].action = 'overwrite'
                        setConflicts(updated)
                      }}
                      className={`select-version-btn new ${conflicts[activeConflictIdx].action === 'overwrite' ? 'active' : ''}`}
                    >
                      جایگزینی با این نسخه
                    </button>
                  </div>
                  <div className="diff-content-text">
                    {conflicts[activeConflictIdx].newFarsi}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="modal-footer-actions">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleResolveConflicts('overwrite_all')}
                  className="action-btn-danger"
                >
                  جایگزینی همه با نسخه جدید
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflicts('keep_all')}
                  className="action-btn-secondary"
                >
                  حفظ همه نسخه‌های قبلی (فقط پر کردن صفحات خالی)
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleResolveConflicts()}
                className="action-btn-primary"
              >
                اعمال تصمیمات انتخابی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
