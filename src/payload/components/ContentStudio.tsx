'use client'

import React, { useState, useEffect, useTransition, useMemo } from 'react'
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
import { Database } from 'lucide-react'

type StudioStage = 'full-bundle' | 'author' | 'book-info' | 'book-content' | 'blog-post' | 'quotes'
type StudioTab = 'epub-studio' | 'visual-editor' | 'importer'

export const ContentStudio: React.FC = () => {
  const [activeStage, setActiveStage] = useState<StudioStage>('full-bundle')
  const [activeTab, setActiveTab] = useState<StudioTab>('epub-studio')
  const [syncingDb, setSyncingDb] = useState(false)
  const [mockupMode, setMockupMode] = useState(false)
  const [togglingMockup, setTogglingMockup] = useState(false)

  // JSON Importer states
  const [jsonInput, setJsonInput] = useState('')
  const [importLog, setImportLog] = useState('')
  const [importing, setImporting] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [lastCreatedSlug, setLastCreatedSlug] = useState<string | null>(null)

  // Status banners
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  // Visual Editor states
  const [booksList, setBooksList] = useState<any[]>([])
  const [selectedBookSlug, setSelectedBookSlug] = useState<string>('')
  const [editingBookData, setEditingBookData] = useState<any | null>(null)
  const [activePageIdx, setActivePageIdx] = useState<number>(0)
  const [loadingBookContent, setLoadingBookContent] = useState(false)
  const [savingBookPages, setSavingBookPages] = useState(false)

  // Blog Posts list
  const [blogList, setBlogList] = useState<any[]>([])

  // Current selected prompt definition
  const currentPromptDef: AIPromptDefinition = useMemo(() => {
    switch (activeStage) {
      case 'author':
        return AUTHOR_PROMPT
      case 'book-info':
        return BOOK_INFO_PROMPT
      case 'book-content':
        return BOOK_CONTENT_PAGES_PROMPT
      case 'blog-post':
        return BLOG_POST_PROMPT
      case 'quotes':
        return QUOTES_PROMPT
      case 'full-bundle':
      default:
        return FULL_BOOK_BUNDLE_PROMPT
    }
  }, [activeStage])

  // Load books & blogs on mount
  const refreshLibraryData = async () => {
    try {
      const [books, blogs, mockupStatus] = await Promise.all([
        getBookListForEditingAction(),
        getBlogPostsForEditingAction(),
        getMockupModeAction(),
      ])
      setBooksList(books)
      setBlogList(blogs)
      setMockupMode(mockupStatus.enabled)
      if (books.length > 0 && !selectedBookSlug) {
        setSelectedBookSlug(books[0].slug)
      }
    } catch (err) {
      console.error(err)
    }
  }

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

  useEffect(() => {
    refreshLibraryData()
  }, [])

  // Load book details when selected for visual editing
  useEffect(() => {
    if (selectedBookSlug && activeTab === 'visual-editor') {
      loadBookForEditing(selectedBookSlug)
    }
  }, [selectedBookSlug, activeTab])

  const loadBookForEditing = async (slug: string) => {
    setLoadingBookContent(true)
    setStatusError(null)
    try {
      const data = await getBookContentForEditingAction(slug)
      if (data) {
        setEditingBookData(data)
        setActivePageIdx(0)
      } else {
        setStatusError('اطلاعات کتاب یافت نشد.')
      }
    } catch (err: any) {
      setStatusError(err?.message || 'خطا در بارگذاری محتوای کتاب.')
    } finally {
      setLoadingBookContent(false)
    }
  }

  // Copy AI Prompt
  const handleCopyPrompt = (prompt: AIPromptDefinition) => {
    navigator.clipboard.writeText(prompt.systemPrompt)
    setCopiedPromptId(prompt.id)
    setStatusSuccess(`پرامپت هوش مصنوعی برای «${prompt.title}» در کلیپ‌بورد کپی شد! اکنون آن را در ChatGPT یا Claude جای‌گذاری کنید.`)
    setTimeout(() => {
      setCopiedPromptId(null)
      setStatusSuccess(null)
    }, 4000)
  }

  // Load Sample JSON Template
  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(currentPromptDef.sampleJson, null, 2))
    setStatusSuccess('قالب نمونه JSON بارگذاری شد.')
    setTimeout(() => setStatusSuccess(null), 3000)
  }

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonInput(text)
    }
    reader.readAsText(file)
  }

  // Execute JSON Import
  const handleExecuteImport = async () => {
    if (!jsonInput.trim()) return
    setImporting(true)
    setStatusError(null)
    setStatusSuccess(null)
    setImportLog(`در حال آغاز پردازش بخش «${currentPromptDef.title}»...\n`)

    try {
      let res: { success: boolean; log: string; bookSlug?: string; slug?: string } = { success: false, log: '' }

      switch (activeStage) {
        case 'author':
          res = await importAuthorAction(jsonInput)
          break
        case 'book-info':
          res = await importBookInfoAction(jsonInput)
          if (res.bookSlug) setLastCreatedSlug(res.bookSlug)
          break
        case 'book-content':
          res = await importBookContentAction(jsonInput)
          if (res.bookSlug) setLastCreatedSlug(res.bookSlug)
          break
        case 'full-bundle':
          res = await importFullBookBundleAction(jsonInput)
          if (res.bookSlug) setLastCreatedSlug(res.bookSlug)
          break
        case 'blog-post':
          res = await importBlogPostAction(jsonInput)
          if (res.slug) setLastCreatedSlug(res.slug)
          break
        case 'quotes':
          res = await importQuoteAction(jsonInput)
          break
      }

      setImportLog(res.log)

      if (res.success) {
        setStatusSuccess('داده‌ها با موفقیت در پایگاه داده ثبت شدند!')
        refreshLibraryData()
      } else {
        setStatusError('خطا در فرآیند ثبت داده‌ها. لاگ عملیات را بررسی کنید.')
      }
    } catch (err: any) {
      const msg = err?.message || String(err)
      setImportLog((prev) => prev + `\nخطای سیستمی: ${msg}`)
      setStatusError(`خطا: ${msg}`)
    } finally {
      setImporting(false)
    }
  }

  // Visual Editor: Page Edit Handlers
  const handleCurrentPageChange = (field: 'english' | 'farsi', val: string) => {
    if (!editingBookData || !editingBookData.pages[activePageIdx]) return
    const updatedPages = [...editingBookData.pages]
    updatedPages[activePageIdx] = {
      ...updatedPages[activePageIdx],
      [field]: val,
    }
    setEditingBookData({
      ...editingBookData,
      pages: updatedPages,
    })
  }

  const handleAddNewPage = () => {
    if (!editingBookData) return
    const newPageNumber = editingBookData.pages.length + 1
    const newPage = {
      pageNumber: newPageNumber,
      english: 'New page English content...',
      farsi: 'متن فارسی صفحه جدید...',
      type: 'text',
    }
    setEditingBookData({
      ...editingBookData,
      pages: [...editingBookData.pages, newPage],
    })
    setActivePageIdx(editingBookData.pages.length)
  }

  const handleDeleteCurrentPage = () => {
    if (!editingBookData || editingBookData.pages.length <= 1) {
      alert('کتاب باید حداقل دارای ۱ صفحه باشد.')
      return
    }
    const updated = editingBookData.pages
      .filter((_: any, idx: number) => idx !== activePageIdx)
      .map((p: any, idx: number) => ({ ...p, pageNumber: idx + 1 }))

    setEditingBookData({
      ...editingBookData,
      pages: updated,
    })
    setActivePageIdx(Math.max(0, activePageIdx - 1))
  }

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
      setStatusError(err?.message || 'خطا در همگام‌سازی.')
    } finally {
      setSyncingDb(false)
    }
  }

  const currentPage = editingBookData?.pages?.[activePageIdx]

  return (
    <div className="content-studio-root" dir="rtl">
      {/* Studio Header Card */}
      <div className="studio-header-card">
        <div className="studio-header-info">
          <div className="studio-badge-row">
            <span className="studio-tag-badge">
              <Sparkles size={13} />
              <span>هوش مصنوعی و خط تولید محتوا</span>
            </span>
            <span className="studio-role-badge">مختص مدیر و مالک سیستم</span>
          </div>
          <h2>استودیو جامع تولید، درون‌ریزی و ویرایش محتوا</h2>
          <p className="studio-subtitle-text">
            ورود داده با هوش مصنوعی و JSON برای تمام بخش‌ها، ویرایشگر بصری صفحات دوزبانه و پیش‌نمایش زنده در قالب نهایی کاربر
          </p>
        </div>

        {/* Global Tab Switcher & DB Sync & Mockup Toggle */}
        <div className="studio-header-actions-cluster">
          <button
            type="button"
            className={`mockup-mode-pill-btn ${mockupMode ? 'active' : 'inactive'}`}
            onClick={handleToggleMockupMode}
            disabled={togglingMockup}
            title={mockupMode ? 'کلیک کنید تا کتاب‌های موکاپ مخفی شوند' : 'کلیک کنید تا کتاب‌های موکاپ جهت تست ظاهر شوند'}
          >
            <Layers size={14} />
            <span>موکاپ: {mockupMode ? 'روشن' : 'خاموش'}</span>
          </button>

          <div className="studio-segmented-nav">
            <button
              type="button"
              className={`nav-segment-btn ${activeTab === 'epub-studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('epub-studio')}
            >
              <BookOpen size={15} />
              <span>ترجمه هوشمند EPUB</span>
            </button>
            <button
              type="button"
              className={`nav-segment-btn ${activeTab === 'visual-editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('visual-editor')}
            >
              <Edit3 size={15} />
              <span>ویرایشگر کتاب‌خوان</span>
            </button>
            <button
              type="button"
              className={`nav-segment-btn ${activeTab === 'importer' ? 'active' : ''}`}
              onClick={() => setActiveTab('importer')}
            >
              <Zap size={15} />
              <span>درون‌ریزی JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {statusError && (
        <div className="alert-message error-alert">
          <div className="alert-content-row">
            <AlertTriangle size={18} />
            <span>{statusError}</span>
          </div>
          <button onClick={() => setStatusError(null)} className="close-alert-btn">
            <X size={16} />
          </button>
        </div>
      )}
      {statusSuccess && (
        <div className="alert-message success-alert">
          <div className="alert-content-row">
            <CheckCircle2 size={18} />
            <span>{statusSuccess}</span>
          </div>
          <button onClick={() => setStatusSuccess(null)} className="close-alert-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 0: EPUB INGESTION & AI BATCH TRANSLATOR */}
      {/* ========================================================= */}
      {activeTab === 'epub-studio' && (
        <div className="fade-in">
          <EpubBatchStudio
            onBookCreated={(slug) => {
              refreshLibraryData()
              setSelectedBookSlug(slug)
              setActiveTab('visual-editor')
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: VISUAL BILINGUAL PAGE EDITOR (WORD & BOOK READER STUDIO) */}
      {/* ========================================================= */}
      {activeTab === 'visual-editor' && (
        <div className="studio-visual-editor-workspace fade-in">
          {/* Top Selection & Action Bar */}
          <div className="visual-editor-top-bar">
            <div className="book-picker-control">
              <label>انتخاب کتاب برای ویرایش در استودیو:</label>
              <select
                value={selectedBookSlug}
                onChange={(e) => setSelectedBookSlug(e.target.value)}
                className="book-selector-dropdown"
              >
                {booksList.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.title} ({b.pagesLength || b.pageCount} صفحه - سطح {b.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingBookContent ? (
            <div className="visual-editor-loading">
              <RefreshCw size={24} className="spin-icon text-amber-400" />
              <span>در حال بارگذاری صفحات کتاب در استودیو...</span>
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
            <div className="no-book-selected">کتابی برای ویرایش انتخاب نشده است.</div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI & JSON IMPORTER */}
      {/* ========================================================= */}
      {activeTab === 'importer' && (
        <div className="studio-importer-workspace fade-in">
          {/* Stage Selector Grid */}
          <div className="stage-selector-grid">
            <button
              type="button"
              className={`stage-card-btn ${activeStage === 'full-bundle' ? 'active' : ''}`}
              onClick={() => setActiveStage('full-bundle')}
            >
              <div className="stage-icon-box" style={{ color: '#f4d35e' }}>
                <Layers size={18} />
              </div>
              <div className="stage-text-box">
                <span className="stage-title">⭐ پکیج کامل کتاب (All-in-One)</span>
                <span className="stage-desc">نویسنده + کتاب + تمام صفحات در ۱ فایل</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage-card-btn ${activeStage === 'author' ? 'active' : ''}`}
              onClick={() => setActiveStage('author')}
            >
              <div className="stage-icon-box" style={{ color: '#38bdf8' }}>
                <Users size={18} />
              </div>
              <div className="stage-text-box">
                <span className="stage-title">۱. نویسندگان (Authors)</span>
                <span className="stage-desc">بیوگرافی و مشخصات نویسنده</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage-card-btn ${activeStage === 'book-info' ? 'active' : ''}`}
              onClick={() => setActiveStage('book-info')}
            >
              <div className="stage-icon-box" style={{ color: '#34d399' }}>
                <BookOpen size={18} />
              </div>
              <div className="stage-text-box">
                <span className="stage-title">۲. مشخصات کتاب (Book Info)</span>
                <span className="stage-desc">عنوان، سطح، خلاصه‌ها و کاور</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage-card-btn ${activeStage === 'book-content' ? 'active' : ''}`}
              onClick={() => setActiveStage('book-content')}
            >
              <div className="stage-icon-box" style={{ color: '#a78bfa' }}>
                <FileCode2 size={18} />
              </div>
              <div className="stage-text-box">
                <span className="stage-title">۳. صفحات دوزبانه کتاب</span>
                <span className="stage-desc">فصل‌ها و متن انگلیسی/فارسی</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage-card-btn ${activeStage === 'blog-post' ? 'active' : ''}`}
              onClick={() => setActiveStage('blog-post')}
            >
              <div className="stage-icon-box" style={{ color: '#fb923c' }}>
                <FileText size={18} />
              </div>
              <div className="stage-text-box">
                <span className="stage-title">۴. وبلاگ و مقاله (Blog)</span>
                <span className="stage-desc">مقالات مارک‌داون و آموزشی</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage-card-btn ${activeStage === 'quotes' ? 'active' : ''}`}
              onClick={() => setActiveStage('quotes')}
            >
              <div className="stage-icon-box" style={{ color: '#f43f5e' }}>
                <MessageSquare size={18} />
              </div>
              <div className="stage-text-box">
                <span className="stage-title">۵. نقل‌قول‌ها (Quotes)</span>
                <span className="stage-desc">جملات قصار و برگزیده متصل</span>
              </div>
            </button>
          </div>

          {/* AI Prompt Banner & Copy Button */}
          <div className="ai-prompt-hero-box">
            <div className="ai-prompt-hero-text">
              <div className="ai-prompt-title-row">
                <Sparkles size={20} className="text-amber-400" />
                <h3>پرامپت اختصاصی هوش مصنوعی: {currentPromptDef.titleFa}</h3>
              </div>
              <p className="ai-prompt-desc-text text-xs text-zinc-400 mt-1 mb-4">
                دستورالعمل مهندسی‌شده را کپی کنید و به هوش مصنوعی (ChatGPT/Claude/DeepSeek) بفرستید.
              </p>
            </div>

            <div className="ai-prompt-action-buttons">
              <button
                type="button"
                onClick={() => handleCopyPrompt(currentPromptDef)}
                className="copy-ai-prompt-hero-btn"
              >
                {copiedPromptId === currentPromptDef.id ? (
                  <>
                    <Check size={18} />
                    <span>پرامپت کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>کپی پرامپت هوش مصنوعی</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Importer Form & Terminal Log */}
          <div className="json-importer-layout-grid">
            <div className="import-form-card">
              <div className="importer-control-bar">
                <div className="file-upload-input-row">
                  <label className="file-upload-custom-label">
                    <UploadCloud size={16} />
                    <span>انتخاب فایل JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="file-upload-hint">یا متن JSON را مستقیماً در کادر زیر جای‌گذاری کنید</span>
                </div>

                <div className="sample-template-actions">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="insert-sample-template-btn"
                  >
                    <Code size={14} />
                    <span>درج نمونه استاندارد ({currentPromptDef.titleFa})</span>
                  </button>
                </div>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`// محتوای JSON منطبق بر ساختار پرامپت ${currentPromptDef.titleFa} را اینجا الصاق کنید...`}
                className="json-code-textarea"
                rows={16}
                dir="ltr"
                spellCheck={false}
              />

              <div className="importer-action-footer">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || !jsonInput.trim()}
                  className="execute-import-hero-btn"
                >
                  <Zap size={18} className={importing ? 'animate-spin' : ''} />
                  <span>{importing ? 'در حال اعتبارسنجی و ثبت...' : `ثبت و ساخت ${currentPromptDef.titleFa} در دیتابیس`}</span>
                </button>
              </div>
            </div>

            <div className="import-log-card">
              <div className="log-card-header">
                <div className="log-card-title-row">
                  <FileCode2 size={16} className="text-sky-400" />
                  <h3>کنسول و گزارش زنده عملیات (Terminal Log)</h3>
                </div>
                {importLog && (
                  <button onClick={() => setImportLog('')} className="clear-log-btn">
                    پاک‌سازی
                  </button>
                )}
              </div>
              <pre className="terminal-log-output">
                {importLog || '// گزارش پردازش و اعتبارسنجی فیلدها در این کنسول نمایش داده می‌شود.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
