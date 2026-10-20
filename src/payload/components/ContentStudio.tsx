'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Copy,
  Check,
  UploadCloud,
  FileCode2,
  Zap,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  Eye,
  ExternalLink,
  Layers,
  Save,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Code,
  Edit3,
  Database,
  Search,
  Filter,
  CheckCircle,
  Sliders,
  Wand2,
  Info,
  Terminal,
  ArrowRight,
  FileJson,
  Play,
  RotateCcw,
  Download,
} from 'lucide-react'
import {
  ALL_AI_PROMPTS,
  FULL_BOOK_BUNDLE_PROMPT,
  AUTHOR_PROMPT,
  BOOK_INFO_PROMPT,
  BOOK_CONTENT_PAGES_PROMPT,
  BLOG_POST_PROMPT,
  QUOTES_PROMPT,
  AIPromptDefinition,
} from '../prompts/ai-prompts'
import { WordBookEditor } from './WordBookEditor'
import { EpubBatchStudio } from './EpubBatchStudio'
import {
  importAuthorAction,
  importBookInfoAction,
  importBookContentAction,
  importFullBookBundleAction,
  importBlogPostAction,
  importQuoteAction,
  getBookListForEditingAction,
  getBookContentForEditingAction,
  saveBookPagesAction,
  getBlogPostsForEditingAction,
  syncPrismaToPayloadAction,
  getMockupModeAction,
  toggleMockupModeAction,
} from './content-actions'

type StudioStage = 'full-bundle' | 'author' | 'book-info' | 'book-content' | 'blog-post' | 'quotes'
type StudioTab = 'importer' | 'epub-studio' | 'visual-editor'

interface StageItem {
  id: StudioStage
  title: string
  titleFa: string
  subtitle: string
  badge?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  promptDef: AIPromptDefinition
  actionLabel: string
}

interface StageCategoryGroup {
  id: string
  categoryTitle: string
  categoryDesc: string
  items: StageItem[]
}

export const ContentStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('importer')
  const [activeStage, setActiveStage] = useState<StudioStage>('full-bundle')
  const [syncingDb, setSyncingDb] = useState(false)
  const [mockupMode, setMockupMode] = useState(false)
  const [togglingMockup, setTogglingMockup] = useState(false)

  // JSON Importer states
  const [jsonInput, setJsonInput] = useState('')
  const [importLog, setImportLog] = useState('')
  const [importing, setImporting] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [lastCreatedSlug, setLastCreatedSlug] = useState<string | null>(null)
  const [lastCreatedType, setLastCreatedType] = useState<'book' | 'blog' | null>(null)
  const [showPromptDrawer, setShowPromptDrawer] = useState(false)

  // Status banners
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  // Visual Editor states
  const [booksList, setBooksList] = useState<any[]>([])
  const [selectedBookSlug, setSelectedBookSlug] = useState<string>('')
  const [editingBookData, setEditingBookData] = useState<any | null>(null)
  const [loadingBookContent, setLoadingBookContent] = useState(false)
  const [savingBookPages, setSavingBookPages] = useState(false)
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [bookLevelFilter, setBookLevelFilter] = useState<string>('all')

  // Blog Posts list
  const [blogList, setBlogList] = useState<any[]>([])

  // Organized Categories for Stages
  const stageCategories: StageCategoryGroup[] = useMemo(() => [
    {
      id: 'core-books',
      categoryTitle: 'هسته اصلی کتاب‌خانه و آموزش زبانی',
      categoryDesc: 'فرآیند گام‌به‌گام یا جامع تولید کتاب‌های دوزبانه استاندارد',
      items: [
        {
          id: 'full-bundle',
          title: 'پکیج کامل کتاب',
          titleFa: 'پکیج کامل (All-in-One)',
          subtitle: 'نویسنده + مشخصات کتاب + تمام صفحات در ۱ فایل',
          badge: 'پیشنهادی و سریع',
          icon: Layers,
          color: 'var(--ky-gold-strong)',
          promptDef: FULL_BOOK_BUNDLE_PROMPT,
          actionLabel: 'ثبت پکیج جامع کتاب در دیتابیس',
        },
        {
          id: 'author',
          title: 'نویسندگان و مشاهیر',
          titleFa: 'پروفایل نویسنده (Author)',
          subtitle: 'بیوگرافی دوزبانه، دوران ادبی و متادیتا',
          icon: Users,
          color: 'var(--ky-info)',
          promptDef: AUTHOR_PROMPT,
          actionLabel: 'ثبت پروفایل نویسنده در دیتابیس',
        },
        {
          id: 'book-info',
          title: 'مشخصات و کاور کتاب',
          titleFa: 'مشخصات کتاب (Book Info)',
          subtitle: 'عنوان، سطح CEFR، خلاصه داستان و رنگ‌بندی',
          icon: BookOpen,
          color: 'var(--ky-success-deep)',
          promptDef: BOOK_INFO_PROMPT,
          actionLabel: 'ثبت متادیتای کتاب در دیتابیس',
        },
        {
          id: 'book-content',
          title: 'صفحات دوزبانه کتاب',
          titleFa: 'صفحات و فصول (Bilingual Pages)',
          subtitle: 'تقطیع صفحات انگلیسی و فارسی با واژگان کلیدی',
          icon: FileCode2,
          color: 'var(--ky-purple)',
          promptDef: BOOK_CONTENT_PAGES_PROMPT,
          actionLabel: 'ثبت صفحات دوزبانه در دیتابیس',
        },
      ],
    },
    {
      id: 'secondary-media',
      categoryTitle: 'محتوای تکمیلی، مقالات و رسانه',
      categoryDesc: 'تولید محتوای متنی جهت جذب ترافیک ارگانیک، سئو و یادگیری خرد',
      items: [
        {
          id: 'blog-post',
          title: 'مقاله و وبلاگ تخصصی',
          titleFa: 'وبلاگ و مقاله (Blog Post)',
          subtitle: 'مقالات کامل مارک‌داون، نکات گرامری و آموزش زبان',
          icon: FileText,
          color: 'var(--ky-gold)',
          promptDef: BLOG_POST_PROMPT,
          actionLabel: 'انتشار مقاله در وبلاگ بوکزی',
        },
        {
          id: 'quotes',
          title: 'نقل‌قول‌های برگزیده',
          titleFa: 'نقل‌قول‌های ناب (Quotes)',
          subtitle: 'جملات قصار ادبی متصل به کتاب و نویسنده',
          icon: MessageSquare,
          color: 'var(--ky-rose)',
          promptDef: QUOTES_PROMPT,
          actionLabel: 'ثبت نقل‌قول‌های برگزیده در دیتابیس',
        },
      ],
    },
  ], [])

  // Find active stage object
  const activeStageItem = useMemo(() => {
    for (const cat of stageCategories) {
      const found = cat.items.find((item) => item.id === activeStage)
      if (found) return found
    }
    return stageCategories[0].items[0]
  }, [stageCategories, activeStage])

  const currentPromptDef = activeStageItem.promptDef

  // Validate JSON live
  const jsonValidation = useMemo(() => {
    if (!jsonInput.trim()) {
      return { status: 'empty', message: 'کد JSON را در کادر زیر جای‌گذاری کنید یا فایل را آپلود نمایید.' }
    }
    try {
      const parsed = JSON.parse(jsonInput)
      if (typeof parsed !== 'object' || parsed === null) {
        return { status: 'invalid', message: 'محتوا باید یک شیء (Object) یا آرایه JSON باشد.' }
      }
      const keys = Array.isArray(parsed) ? `${parsed.length} آیتم آرایه` : `${Object.keys(parsed).length} فیلد اصلی`
      return { status: 'valid', message: `ساختار JSON معتبر است (${keys})` }
    } catch (e: any) {
      return { status: 'invalid', message: `خطای نحوی در JSON: ${e.message}` }
    }
  }, [jsonInput])

  // Load books & blogs on mount
  const refreshLibraryData = useCallback(async () => {
    try {
      const [books, blogs, mockupStatus] = await Promise.all([
        getBookListForEditingAction(),
        getBlogPostsForEditingAction(),
        getMockupModeAction(),
      ])
      setBooksList(books)
      setBlogList(blogs)
      setMockupMode(mockupStatus.enabled)
      if (books.length > 0) {
        setSelectedBookSlug((current) => current || books[0].slug)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    void refreshLibraryData()
  }, [refreshLibraryData])

  const handleToggleMockupMode = async () => {
    setTogglingMockup(true)
    setStatusError(null)
    setStatusSuccess(null)
    try {
      const nextState = !mockupMode
      const res = await toggleMockupModeAction(nextState)
      if (res.success) {
        setMockupMode(nextState)
        setStatusSuccess(res.message)
        await refreshLibraryData()
      } else {
        setStatusError(res.message)
      }
    } catch (err: any) {
      setStatusError(err?.message || 'خطا در تغییر وضعیت موکاپ.')
    } finally {
      setTogglingMockup(false)
    }
  }

  // Load book details when selected for visual editing
  const loadBookForEditing = useCallback(async (slug: string) => {
    if (!slug) return
    setLoadingBookContent(true)
    setStatusError(null)
    try {
      const data = await getBookContentForEditingAction(slug)
      if (data) {
        setEditingBookData(data)
      } else {
        setStatusError('اطلاعات کتاب یافت نشد.')
      }
    } catch (err: any) {
      setStatusError(err?.message || 'خطا در بارگذاری محتوای کتاب.')
    } finally {
      setLoadingBookContent(false)
    }
  }, [])

  useEffect(() => {
    if (selectedBookSlug && activeTab === 'visual-editor') {
      void loadBookForEditing(selectedBookSlug)
    }
  }, [selectedBookSlug, activeTab, loadBookForEditing])

  // Copy AI Prompt
  const handleCopyPrompt = (prompt: AIPromptDefinition) => {
    navigator.clipboard.writeText(prompt.systemPrompt)
    setCopiedPromptId(prompt.id)
    setStatusSuccess(`دستورالعمل هوش مصنوعی برای «${prompt.title}» کپی شد! اکنون آن را در ChatGPT یا Claude جای‌گذاری کنید.`)
    setTimeout(() => {
      setCopiedPromptId(null)
      setStatusSuccess(null)
    }, 4000)
  }

  // Download AI Prompt as File
  const handleDownloadPrompt = (prompt: AIPromptDefinition) => {
    const blob = new Blob([prompt.systemPrompt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookzy_ai_prompt_${prompt.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setStatusSuccess(`فایل متنی دستورالعمل «${prompt.title}» دانلود شد.`)
    setTimeout(() => setStatusSuccess(null), 3500)
  }

  // Load Sample JSON Template
  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(currentPromptDef.sampleJson, null, 2))
    setStatusSuccess(`قالب نمونه استاندارد برای بخش «${activeStageItem.title}» در کادر درج شد.`)
    setTimeout(() => setStatusSuccess(null), 3000)
  }

  // Prettify JSON
  const handlePrettifyJson = () => {
    if (!jsonInput.trim()) return
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
      setStatusSuccess('کد JSON با موفقیت مرتب و فرمت‌بندی شد.')
      setTimeout(() => setStatusSuccess(null), 2500)
    } catch (err: any) {
      setStatusError(`امکان مرتب‌سازی وجود ندارد؛ ساختار JSON نامعتبر است: ${err?.message}`)
    }
  }

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonInput(text)
      setStatusSuccess(`فایل «${file.name}» با موفقیت بارگذاری شد.`)
      setTimeout(() => setStatusSuccess(null), 3000)
    }
    reader.readAsText(file)
  }

  // Execute JSON Import
  const handleExecuteImport = async () => {
    if (!jsonInput.trim()) return
    setImporting(true)
    setStatusError(null)
    setStatusSuccess(null)
    setLastCreatedSlug(null)
    setLastCreatedType(null)
    setImportLog(`[${new Date().toLocaleTimeString('fa-IR')}] در حال آغاز اعتبارسنجی و ثبت بخش «${activeStageItem.title}»...\n`)

    try {
      let res: { success: boolean; log: string; bookSlug?: string; slug?: string } = { success: false, log: '' }

      switch (activeStage) {
        case 'author':
          res = await importAuthorAction(jsonInput)
          break
        case 'book-info':
          res = await importBookInfoAction(jsonInput)
          if (res.bookSlug) {
            setLastCreatedSlug(res.bookSlug)
            setLastCreatedType('book')
          }
          break
        case 'book-content':
          res = await importBookContentAction(jsonInput)
          if (res.bookSlug) {
            setLastCreatedSlug(res.bookSlug)
            setLastCreatedType('book')
          }
          break
        case 'full-bundle':
          res = await importFullBookBundleAction(jsonInput)
          if (res.bookSlug) {
            setLastCreatedSlug(res.bookSlug)
            setLastCreatedType('book')
          }
          break
        case 'blog-post':
          res = await importBlogPostAction(jsonInput)
          if (res.slug) {
            setLastCreatedSlug(res.slug)
            setLastCreatedType('blog')
          }
          break
        case 'quotes':
          res = await importQuoteAction(jsonInput)
          break
      }

      setImportLog((prev) => prev + res.log)

      if (res.success) {
        setStatusSuccess(`عملیات با موفقیت انجام شد و داده‌ها در پایگاه داده ثبت گردیدند!`)
        await refreshLibraryData()
      } else {
        setStatusError('خطا در ثبت داده‌ها. جزئیات گزارش را در کنسول بررسی کنید.')
      }
    } catch (err: any) {
      const msg = err?.message || String(err)
      setImportLog((prev) => prev + `\n[${new Date().toLocaleTimeString('fa-IR')}] خطای سیستمی: ${msg}`)
      setStatusError(`خطای عملیات: ${msg}`)
    } finally {
      setImporting(false)
    }
  }

  // Visual Editor: Save
  const handleSaveVisualPages = async () => {
    if (!editingBookData || !selectedBookSlug) return
    setSavingBookPages(true)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const res = await saveBookPagesAction(
        selectedBookSlug,
        editingBookData.chapters || [],
        editingBookData.pages || [],
      )
      if (res.success) {
        setStatusSuccess(res.message)
        setTimeout(() => setStatusSuccess(null), 3000)
      } else {
        setStatusError(res.message)
      }
    } catch (err: any) {
      setStatusError(err?.message || 'خطا در ذخیره‌سازی صفحات.')
    } finally {
      setSavingBookPages(false)
    }
  }

  // Database Sync
  const handleSyncDb = async () => {
    setSyncingDb(true)
    setStatusError(null)
    setStatusSuccess(null)
    try {
      const res = await syncPrismaToPayloadAction()
      if (res.success) {
        setStatusSuccess(res.message)
        if (res.log) {
          setImportLog((prev) => prev + '\n' + res.log)
        }
        await refreshLibraryData()
      } else {
        setStatusError(res.message)
      }
    } catch (err: any) {
      setStatusError(err?.message || 'خطا در همگام‌سازی دیتابیس.')
    } finally {
      setSyncingDb(false)
    }
  }

  // Filtered books for visual editor
  const filteredBooksList = useMemo(() => {
    return booksList.filter((b) => {
      const matchSearch =
        !bookSearchQuery ||
        b.title?.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.slug?.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.authorName?.toLowerCase().includes(bookSearchQuery.toLowerCase())
      const matchLevel = bookLevelFilter === 'all' || b.level === bookLevelFilter
      return matchSearch && matchLevel
    })
  }, [booksList, bookSearchQuery, bookLevelFilter])

  return (
    <div className="content-studio-root" dir="rtl">
      {/* ========================================================= */}
      {/* 1. MASTER STUDIO HEADER & METRICS BAR */}
      {/* ========================================================= */}
      <header className="studio-unified-header">
        <div className="studio-brand-group">
          <div className="studio-brand-title-wrap">
            <div className="studio-icon-badge">
              <Sparkles size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="studio-pill-row">
                <span className="studio-pill-tag">استودیو اختصاصی بوکزی</span>
                <span className="studio-pill-role">مختص مدیران ارشد سیستم</span>
              </div>
              <h1 className="studio-main-heading">استودیو جامع تولید و ویرایش محتوا</h1>
              <p className="studio-description-text">
                خط هوشمند تولید و تقطیع کتاب با هوش مصنوعی، واردسازی ساختاریافته JSON و ویراستار دوزبانه کتاب‌خوان
              </p>
            </div>
          </div>

          {/* Quick Metrics & System Actions */}
          <div className="studio-system-metrics-cluster">
            <div className="studio-metrics-pill" title="تعداد کل کتاب‌های موجود در استودیو">
              <BookOpen size={15} className="text-amber-400" />
              <span>{booksList.length} کتاب فعال</span>
            </div>

            <div className="studio-metrics-pill" title="تعداد مقالات منتشر شده">
              <FileText size={15} className="text-sky-400" />
              <span>{blogList.length} مقاله وبلاگ</span>
            </div>

            {/* Sync Database Button */}
            <button
              type="button"
              className="studio-sync-db-btn"
              onClick={handleSyncDb}
              disabled={syncingDb}
              title="همگام‌سازی تمام کتاب‌ها، نویسندگان و مقالات از دیتابیس اصلی به پنل استودیو"
            >
              <RefreshCw size={14} className={syncingDb ? 'animate-spin' : ''} />
              <span>{syncingDb ? 'در حال همگام‌سازی...' : 'همگام‌سازی دیتابیس'}</span>
            </button>

            {/* Mockup Mode Toggle */}
            <button
              type="button"
              className={`studio-mockup-btn ${mockupMode ? 'is-active' : 'is-inactive'}`}
              onClick={handleToggleMockupMode}
              disabled={togglingMockup}
              title={mockupMode ? 'کلیک کنید تا کتاب‌های تستی موکاپ مخفی شوند' : 'کلیک کنید تا کتاب‌های تستی برای بررسی ظاهر شوند'}
            >
              <Layers size={14} />
              <span>حالت موکاپ: {mockupMode ? 'روشن' : 'خاموش'}</span>
            </button>
          </div>
        </div>

        {/* Studio Primary Navigation Tabs */}
        <nav className="studio-master-nav-tabs">
          <button
            type="button"
            className={`master-tab-btn ${activeTab === 'importer' ? 'active' : ''}`}
            onClick={() => setActiveTab('importer')}
          >
            <div className="tab-icon-wrap">
              <Zap size={18} />
            </div>
            <div className="tab-text-wrap">
              <span className="tab-title">تولید محتوا با AI و JSON</span>
              <span className="tab-sub">درون‌ریزی مستقیم کتاب، نویسنده و مقاله</span>
            </div>
          </button>

          <button
            type="button"
            className={`master-tab-btn ${activeTab === 'epub-studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('epub-studio')}
          >
            <div className="tab-icon-wrap">
              <BookOpen size={18} />
            </div>
            <div className="tab-text-wrap">
              <span className="tab-title">ترجمه و تقطیع هوشمند EPUB</span>
              <span className="tab-sub">استخراج فصول و کالیبراسیون صفحات</span>
            </div>
          </button>

          <button
            type="button"
            className={`master-tab-btn ${activeTab === 'visual-editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual-editor')}
          >
            <div className="tab-icon-wrap">
              <Edit3 size={18} />
            </div>
            <div className="tab-text-wrap">
              <span className="tab-title">ویرایشگر بصری کتاب‌خوان</span>
              <span className="tab-sub">ویرایش دو زبانه و پیش‌نمایش نهایی</span>
            </div>
          </button>
        </nav>
      </header>

      {/* Global Alerts */}
      {statusError && (
        <div className="studio-alert-card error-card">
          <div className="alert-text-row">
            <AlertTriangle size={18} className="alert-icon-error shrink-0" />
            <span>{statusError}</span>
          </div>
          <button onClick={() => setStatusError(null)} className="alert-close-btn" title="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}
      {statusSuccess && (
        <div className="studio-alert-card success-card">
          <div className="alert-text-row">
            <CheckCircle2 size={18} className="alert-icon-success shrink-0" />
            <span>{statusSuccess}</span>
          </div>
          <button onClick={() => setStatusSuccess(null)} className="alert-close-btn" title="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: AI PROMPT ENGINE & JSON IMPORTER */}
      {/* ========================================================= */}
      {activeTab === 'importer' && (
        <div className="studio-importer-wrapper fade-in">
          {/* Section 1: Categorized Stage Selector */}
          <div className="categorized-stages-container">
            <div className="stage-section-intro">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-amber-400" />
                <h2 className="text-sm font-bold text-zinc-100">انتخاب بخش و نوع محتوای مورد نظر برای تولید:</h2>
              </div>
              <span className="text-xs text-zinc-400">
                نوع محتوا را انتخاب کنید تا پرامپت اختصاصی و قالب استاندارد JSON آن فعال شود.
              </span>
            </div>

            <div className="stage-category-groups-layout">
              {stageCategories.map((group) => (
                <div key={group.id} className="category-group-block">
                  <div className="category-group-header">
                    <span className="group-title-text">{group.categoryTitle}</span>
                    <span className="group-desc-text">{group.categoryDesc}</span>
                  </div>

                  <div className="category-items-grid">
                    {group.items.map((item) => {
                      const IconComp = item.icon
                      const isSelected = activeStage === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`stage-selection-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setActiveStage(item.id)}
                          style={{
                            borderColor: isSelected ? item.color : undefined,
                            boxShadow: isSelected ? `0 6px 20px -4px color-mix(in srgb, ${item.color} 22%, transparent)` : undefined,
                          }}
                        >
                          <div
                            className="stage-card-icon-bubble"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                              borderColor: `color-mix(in srgb, ${item.color} 24%, transparent)`,
                              color: item.color,
                            }}
                          >
                            <IconComp size={20} />
                          </div>

                          <div className="stage-card-details">
                            <div className="stage-card-title-row">
                              <span className="stage-card-title">{item.title}</span>
                              {item.badge && (
                                <span className="stage-special-badge">{item.badge}</span>
                              )}
                            </div>
                            <span className="stage-card-subtitle">{item.subtitle}</span>
                          </div>

                          {isSelected && (
                            <div className="stage-active-indicator" style={{ backgroundColor: item.color }}>
                              <Check size={12} className="text-black font-bold" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 3-Step Visual Workflow Helper */}
          <div className="studio-workflow-stepper-card">
            <div className="stepper-step-item">
              <span className="step-num-badge">۱</span>
              <div className="step-content">
                <span className="step-title">دریافت پرامپت</span>
                <span className="step-desc">پرامپت مهندسی‌شده زیر را کپی کنید</span>
              </div>
            </div>
            <div className="stepper-arrow-divider">
              <ChevronLeft size={16} />
            </div>

            <div className="stepper-step-item">
              <span className="step-num-badge">۲</span>
              <div className="step-content">
                <span className="step-title">ارسال به هوش مصنوعی</span>
                <span className="step-desc">در ChatGPT، Claude یا DeepSeek ارسال فرمایید</span>
              </div>
            </div>
            <div className="stepper-arrow-divider">
              <ChevronLeft size={16} />
            </div>

            <div className="stepper-step-item">
              <span className="step-num-badge">۳</span>
              <div className="step-content">
                <span className="step-title">الصاق خروجی JSON</span>
                <span className="step-desc">کد خروجی را الصاق کرده و با ۱ کلیک ثبت کنید</span>
              </div>
            </div>
          </div>

          {/* Section 3: AI Prompt Showcase Card */}
          <div className="ai-prompt-master-card">
            <div className="ai-prompt-header-row">
              <div className="ai-prompt-meta">
                <div className="flex items-center gap-2">
                  <div className="ai-sparkle-pill">
                    <Sparkles size={14} />
                    <span>پرامپت استاندارد</span>
                  </div>
                  <h3 className="ai-prompt-current-title">{currentPromptDef.titleFa}</h3>
                </div>
                <p className="ai-prompt-summary-text">
                  این دستورالعمل تمام قوانین نگارشی، ساختار داده و فرمت خروجی را به مدل هوش مصنوعی دیکته می‌کند.
                </p>
              </div>

              <div className="ai-prompt-toolbar-actions">
                <button
                  type="button"
                  onClick={() => setShowPromptDrawer(!showPromptDrawer)}
                  className="ai-prompt-drawer-btn"
                  title="مشاهده یا پنهان کردن متن دستورالعمل"
                >
                  <Eye size={15} />
                  <span>{showPromptDrawer ? 'مخفی کردن متن پرامپت' : 'مشاهده متن پرامپت'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPrompt(currentPromptDef)}
                  className="ai-prompt-drawer-btn"
                  title="دانلود متن کامل پرامپت به صورت فایل .txt"
                >
                  <Download size={15} />
                  <span>دانلود .txt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyPrompt(currentPromptDef)}
                  className="ai-prompt-copy-btn"
                >
                  {copiedPromptId === currentPromptDef.id ? (
                    <>
                      <Check size={16} className="text-black font-bold" />
                      <span>پرامپت کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>کپی پرامپت سیستم</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Prompt Drawer */}
            {showPromptDrawer && (
              <div className="ai-prompt-drawer-body">
                <div className="prompt-drawer-header">
                  <span className="text-xs text-zinc-400 font-mono">system-prompt.md</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadPrompt(currentPromptDef)}
                      className="drawer-copy-link"
                      title="دانلود به عنوان فایل متنی"
                    >
                      <Download size={13} />
                      <span>دانلود فایل .txt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(currentPromptDef)}
                      className="drawer-copy-link"
                    >
                      <Copy size={13} />
                      <span>کپی تمام متن</span>
                    </button>
                  </div>
                </div>
                <pre className="prompt-drawer-text" dir="rtl">{currentPromptDef.systemPrompt}</pre>
              </div>
            )}
          </div>

          {/* Section 4: Dual Workspace (JSON Input & Live Terminal) */}
          <div className="studio-dual-workspace-grid">
            {/* Panel 1: JSON Input Editor */}
            <div className="workspace-panel-card json-input-panel">
              <div className="panel-header-toolbar">
                <div className="panel-title-group">
                  <FileJson size={17} className="text-amber-400" />
                  <h3 className="panel-heading">ورودی کد JSON</h3>
                  <span className={`validation-badge ${jsonValidation.status}`}>
                    {jsonValidation.message}
                  </span>
                </div>

                <div className="panel-quick-actions">
                  <label className="action-tool-btn file-upload-label" title="انتخاب فایل .json از حافظه">
                    <UploadCloud size={14} />
                    <span>آپلود فایل</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="action-tool-btn"
                    title="درج قالب نمونه JSON استاندارد برای این بخش"
                  >
                    <Code size={14} />
                    <span>نمونه تست</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrettifyJson}
                    disabled={!jsonInput.trim()}
                    className="action-tool-btn"
                    title="مرتب‌سازی و زیباسازی ساختار JSON"
                  >
                    <Wand2 size={14} />
                    <span>مرتب‌سازی</span>
                  </button>

                  {jsonInput && (
                    <button
                      type="button"
                      onClick={() => setJsonInput('')}
                      className="action-tool-btn text-rose-400 hover:text-rose-300"
                      title="پاک‌سازی کامل کادر ورودی"
                    >
                      <Trash2 size={14} />
                      <span>پاک کردن</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="json-textarea-wrapper">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`// خروجی JSON تولید شده توسط هوش مصنوعی برای بخش «${activeStageItem.title}» را اینجا الصاق نمایید...\n// یا روی دکمه «نمونه تست» در بالای کادر کلیک فرمایید.`}
                  className="ide-json-editor-area"
                  rows={18}
                  dir="ltr"
                  spellCheck={false}
                />
              </div>

              <div className="panel-footer-action-bar">
                <div className="editor-character-count">
                  <span>{jsonInput.length ? `${jsonInput.length.toLocaleString('fa-IR')} کاراکتر` : 'کادر خالی'}</span>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || !jsonInput.trim() || jsonValidation.status === 'invalid'}
                  className="execute-import-hero-action-btn"
                  style={{
                    backgroundColor: activeStageItem.color,
                  }}
                >
                  <Zap size={18} className={importing ? 'animate-spin' : ''} />
                  <span>
                    {importing ? 'در حال پردازش و ثبت داده‌ها...' : activeStageItem.actionLabel}
                  </span>
                </button>
              </div>
            </div>

            {/* Panel 2: Live Processing Terminal & Navigation */}
            <div className="workspace-panel-card live-terminal-panel">
              <div className="panel-header-toolbar terminal-header-bg">
                <div className="terminal-dots-row">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                  <div className="flex items-center gap-1.5 mr-2">
                    <Terminal size={14} className="text-sky-400" />
                    <span className="text-xs font-bold text-zinc-300">کنسول پردازش زنده (Live Execution Log)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`terminal-status-indicator ${importing ? 'busy' : 'ready'}`}>
                    <span className="status-ping" />
                    <span>{importing ? 'در حال پردازش' : 'آماده به کار'}</span>
                  </div>
                  {importLog && (
                    <button
                      type="button"
                      onClick={() => setImportLog('')}
                      className="terminal-clear-link"
                      title="پاک کردن لاگ ترمینال"
                    >
                      <RotateCcw size={13} />
                      <span>پاک‌سازی</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Success Result Card with Direct Navigation */}
              {lastCreatedSlug && (
                <div className="terminal-success-action-card">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-300">محتوا با موفقیت ثبت گردید:</span>
                      <span className="text-xs text-zinc-300 font-mono mr-1.5">{lastCreatedSlug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {lastCreatedType === 'book' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBookSlug(lastCreatedSlug)
                            setActiveTab('visual-editor')
                          }}
                          className="success-nav-pill-btn text-amber-400 bg-amber-400/10 border-amber-400/30"
                        >
                          <Edit3 size={13} />
                          <span>باز کردن در ویرایشگر کتاب‌خوان</span>
                        </button>

                        <a
                          href={`/books/${lastCreatedSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="success-nav-pill-btn text-sky-400 bg-sky-400/10 border-sky-400/30"
                        >
                          <ExternalLink size={13} />
                          <span>مشاهده صفحه کتاب در سایت</span>
                        </a>
                      </>
                    )}

                    {lastCreatedType === 'blog' && (
                      <a
                        href={`/blog/${lastCreatedSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="success-nav-pill-btn text-orange-400 bg-orange-400/10 border-orange-400/30"
                      >
                        <ExternalLink size={13} />
                        <span>مشاهده مقاله در وبلاگ</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Terminal Screen Output */}
              <div className="terminal-screen-wrapper">
                <pre className="terminal-code-body">
                  {importLog || (
                    <span className="terminal-placeholder">
                      {'>'} کنسول پردازش و بررسی ساختار داده‌ها آماده است.{'\n'}
                      {'>'} با انتخاب دکمه ثبت، گزارش گام‌به‌گام عملیات دیتابیس در این بخش نمایش داده خواهد شد.
                    </span>
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EPUB PIPELINE (SMART INGESTION & BATCH TRANSLATOR) */}
      {/* ========================================================= */}
      {activeTab === 'epub-studio' && (
        <div className="studio-epub-wrapper fade-in">
          <EpubBatchStudio
            onBookCreated={(slug) => {
              void refreshLibraryData()
              setSelectedBookSlug(slug)
              setActiveTab('visual-editor')
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: VISUAL BILINGUAL PAGE EDITOR */}
      {/* ========================================================= */}
      {activeTab === 'visual-editor' && (
        <div className="studio-visual-editor-wrapper fade-in">
          {/* Top Selection & Navigation Bar */}
          <div className="visual-editor-control-panel">
            <div className="panel-selector-row">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-400" />
                <label className="text-xs font-bold text-zinc-200">انتخاب کتاب برای ویرایش و پیش‌نمایش:</label>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2.5 flex-wrap flex-grow justify-end">
                <div className="book-search-input-wrap">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    placeholder="جستجوی کتاب..."
                    className="book-search-input"
                  />
                  {bookSearchQuery && (
                    <button onClick={() => setBookSearchQuery('')} className="clear-search-btn">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="level-filter-chips">
                  {['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setBookLevelFilter(lvl)}
                      className={`level-filter-chip ${bookLevelFilter === lvl ? 'active' : ''}`}
                    >
                      {lvl === 'all' ? 'همه سطوح' : lvl}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedBookSlug}
                  onChange={(e) => setSelectedBookSlug(e.target.value)}
                  className="modern-book-select"
                >
                  {filteredBooksList.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.title} ({b.pagesLength || b.pageCount} صفحه - سطح {b.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Book Meta Quick Strip */}
            {selectedBookSlug && (
              <div className="selected-book-quick-strip">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-100 text-sm">
                    {editingBookData?.title || selectedBookSlug}
                  </span>
                  {editingBookData?.level && (
                    <span className="book-level-tag">سطح {editingBookData.level}</span>
                  )}
                  <span className="text-xs text-zinc-400">
                    {editingBookData?.pages?.length || 0} صفحه • {editingBookData?.chapters?.length || 0} فصل
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/books/${selectedBookSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quick-link-reader-btn"
                    title="مشاهده ظاهر زنده کتاب در کتاب‌خوان بوکزی"
                  >
                    <Eye size={14} />
                    <span>مشاهده در اپلیکیشن کاربر</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Editor Workspace Content */}
          {loadingBookContent ? (
            <div className="visual-editor-empty-state">
              <RefreshCw size={28} className="animate-spin text-amber-400 mb-2" />
              <span className="text-sm font-semibold text-zinc-200">در حال بارگذاری محتوای صفحات کتاب...</span>
            </div>
          ) : editingBookData ? (
            <WordBookEditor
              bookTitle={editingBookData.title}
              bookSlug={selectedBookSlug}
              bookAuthor={editingBookData.author}
              bookLevel={editingBookData.level}
              pages={editingBookData.pages || []}
              chapters={editingBookData.chapters || []}
              onPagesChange={(newPages) =>
                setEditingBookData((prev: any) => ({ ...prev, pages: newPages }))
              }
              onChaptersChange={(newChapters) =>
                setEditingBookData((prev: any) => ({ ...prev, chapters: newChapters }))
              }
              onMetaChange={(meta) =>
                setEditingBookData((prev: any) => ({ ...prev, ...meta }))
              }
              onSave={handleSaveVisualPages}
              isSaving={savingBookPages}
              showReaderPreviewLink={Boolean(selectedBookSlug)}
            />
          ) : (
            /* Empty state when books list is 0 or none selected */
            <div className="visual-editor-empty-state">
              <BookOpen size={48} className="text-amber-400/40 mb-3" />
              <h3 className="text-base font-bold text-zinc-100">کتابی برای ویرایش انتخاب نشده است</h3>
              <p className="text-xs text-zinc-400 max-w-md text-center mt-1 mb-4 leading-relaxed">
                {booksList.length === 0
                  ? 'هنوز کتابی در دیتابیس استودیو همگام‌سازی نشده است. با کلیک روی دکمه زیر، تمام کتاب‌های موجود در دیتابیس را به پنل منتقل فرمایید.'
                  : 'لطفاً یکی از کتاب‌ها را از منوی بالا انتخاب کنید تا صفحات آن در ویرایشگر بارگذاری شود.'}
              </p>

              {booksList.length === 0 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSyncDb}
                    disabled={syncingDb}
                    className="empty-state-sync-btn"
                  >
                    <RefreshCw size={15} className={syncingDb ? 'animate-spin' : ''} />
                    <span>همگام‌سازی تمام کتاب‌ها از دیتابیس</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('importer')}
                    className="empty-state-create-btn"
                  >
                    <Zap size={15} />
                    <span>ساخت کتاب جدید با AI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
