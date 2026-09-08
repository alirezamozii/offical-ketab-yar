'use client'

import React, { useState, useRef, useMemo } from 'react'
import {
  Bold,
  Italic,
  Heading2,
  Quote,
  Highlighter,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Sparkles,
  Save,
  SplitSquareVertical,
  Maximize2,
  Minimize2,
  X,
  Languages,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import { slugify } from '@/lib/utils'

export interface BookChapterItem {
  title: string
  titleFa?: string
  slug?: string
  order?: number
  startPage?: number
}

export interface BookPageItem {
  pageNumber: number
  english: string
  farsi: string
  type?: 'text' | 'heading' | 'image' | 'quote'
  meta?: string
}

interface WordBookEditorProps {
  bookTitle: string
  bookSlug?: string
  bookAuthor?: string
  bookLevel?: string
  pages: BookPageItem[]
  chapters: BookChapterItem[]
  onPagesChange: (pages: BookPageItem[]) => void
  onChaptersChange: (chapters: BookChapterItem[]) => void
  onMetaChange?: (meta: { title?: string; author?: string; level?: string }) => void
  onSave?: () => Promise<void> | void
  isSaving?: boolean
  showReaderPreviewLink?: boolean
}

export const WordBookEditor: React.FC<WordBookEditorProps> = ({
  bookTitle,
  bookSlug,
  bookLevel = 'B1',
  pages,
  chapters,
  onPagesChange,
  onChaptersChange,
  onMetaChange,
  onSave,
  isSaving = false,
  showReaderPreviewLink = true,
}) => {
  const [activePageIdx, setActivePageIdx] = useState(0)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showSplitterModal, setShowSplitterModal] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'sepia' | 'light'>('dark')
  const [previewLayout, setPreviewLayout] = useState<'subtitles' | 'parallel'>('subtitles')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Bulk splitter state
  const [bulkEn, setBulkEn] = useState('')
  const [bulkFa, setBulkFa] = useState('')
  const [splitWords, setSplitWords] = useState(250)

  // Textarea refs
  const enRef = useRef<HTMLTextAreaElement>(null)
  const faRef = useRef<HTMLTextAreaElement>(null)

  const safeIdx = Math.min(Math.max(0, activePageIdx), Math.max(0, pages.length - 1))
  const currentPage = pages[safeIdx] || { pageNumber: 1, english: '', farsi: '', type: 'text' }

  // Current active chapter
  const currentChapter = useMemo(() => {
    const pageNum = safeIdx + 1
    const sorted = [...chapters].sort((a, b) => (b.startPage || 1) - (a.startPage || 1))
    return sorted.find((ch) => (ch.startPage || 1) <= pageNum) || chapters[0] || null
  }, [chapters, safeIdx])

  // Word counts
  const pageEnWords = useMemo(() => {
    return currentPage.english ? currentPage.english.split(/\s+/).filter(Boolean).length : 0
  }, [currentPage.english])

  const totalBookWords = useMemo(() => {
    return pages.reduce((acc, p) => acc + (p.english ? p.english.split(/\s+/).filter(Boolean).length : 0), 0)
  }, [pages])

  // Update current page
  const handleUpdatePage = (field: 'english' | 'farsi', value: string) => {
    const updated = [...pages]
    if (!updated[safeIdx]) {
      updated[safeIdx] = { pageNumber: safeIdx + 1, english: '', farsi: '', type: 'text' }
    }
    updated[safeIdx] = {
      ...updated[safeIdx],
      [field]: value,
    }
    onPagesChange(updated)
  }

  // Formatting tool
  const insertFormat = (target: 'en' | 'fa', prefix: string, suffix: string = '') => {
    const ref = target === 'en' ? enRef.current : faRef.current
    if (!ref) return
    const start = ref.selectionStart
    const end = ref.selectionEnd
    const fieldName: 'english' | 'farsi' = target === 'en' ? 'english' : 'farsi'
    const currentVal = target === 'en' ? (currentPage.english || '') : (currentPage.farsi || '')
    const selected = currentVal.substring(start, end)
    const nextVal = currentVal.substring(0, start) + prefix + selected + suffix + currentVal.substring(end)
    handleUpdatePage(fieldName, nextVal)

    setTimeout(() => {
      ref.focus()
      ref.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 0))
    }, 40)
  }

  // Insert Vocab Tag: [Word]{meaning: "معنی"}
  const handleInsertVocab = () => {
    const ref = enRef.current
    if (!ref) return
    const start = ref.selectionStart
    const end = ref.selectionEnd
    const selected = currentPage.english.substring(start, end).trim()
    const word = selected || prompt('کلمه انگلیسی مورد نظر:')
    if (!word) return
    const meaning = prompt(`معنی فارسی "${word}":`) || ''
    const tag = `[${word}]{meaning: "${meaning}"}`
    const val = currentPage.english
    const nextVal = val.substring(0, start) + tag + val.substring(end)
    handleUpdatePage('english', nextVal)
  }

  // Page Break at cursor
  const handlePageBreak = () => {
    const ref = enRef.current
    if (!ref) return
    const cursor = ref.selectionStart
    const beforeText = currentPage.english.substring(0, cursor).trim()
    const afterText = currentPage.english.substring(cursor).trim()

    if (!afterText) {
      handleAddPage()
      return
    }

    if (confirm('آیا مایلید ادامه متن به یک صفحه جدید منتقل شود؟')) {
      const updatedPages = [...pages]
      updatedPages[safeIdx] = { ...currentPage, english: beforeText }
      const newPage: BookPageItem = {
        pageNumber: safeIdx + 2,
        english: afterText,
        farsi: '',
        type: 'text',
      }
      updatedPages.splice(safeIdx + 1, 0, newPage)
      const reindexed = updatedPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
      onPagesChange(reindexed)
      setActivePageIdx(safeIdx + 1)
    }
  }

  // Add Page
  const handleAddPage = () => {
    const newPage: BookPageItem = {
      pageNumber: pages.length + 1,
      english: '',
      farsi: '',
      type: 'text',
    }
    onPagesChange([...pages, newPage])
    setActivePageIdx(pages.length)
  }

  // Delete Page
  const handleDeletePage = () => {
    if (pages.length <= 1) {
      alert('کتاب باید حداقل دارای ۱ صفحه باشد.')
      return
    }
    if (confirm(`حذف صفحه ${safeIdx + 1}؟`)) {
      const filtered = pages.filter((_, idx) => idx !== safeIdx)
      const reindexed = filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
      onPagesChange(reindexed)
      setActivePageIdx(Math.max(0, safeIdx - 1))
    }
  }

  // Update Chapter Inline
  const handleUpdateChapter = (field: 'title' | 'titleFa', val: string) => {
    if (!currentChapter) {
      const newCh: BookChapterItem = {
        title: field === 'title' ? val : 'Chapter 1',
        titleFa: field === 'titleFa' ? val : 'فصل ۱',
        slug: slugify(field === 'title' ? val : 'chapter-1'),
        order: 1,
        startPage: 1,
      }
      onChaptersChange([newCh])
      return
    }
    const updated = chapters.map((ch) => {
      if (ch.slug === currentChapter.slug || ch.order === currentChapter.order) {
        return {
          ...ch,
          [field]: val,
          slug: field === 'title' ? slugify(val) : ch.slug,
        }
      }
      return ch
    })
    onChaptersChange(updated)
  }

  // Add new chapter at current page
  const handleAddChapterHere = () => {
    const order = chapters.length + 1
    const newCh: BookChapterItem = {
      title: `Chapter ${order}`,
      titleFa: `فصل ${order}`,
      slug: `chapter-${order}-${Date.now().toString().slice(-4)}`,
      order: order,
      startPage: safeIdx + 1,
    }
    onChaptersChange([...chapters, newCh])
  }

  // Execute Bulk Split
  const handleExecuteSplit = () => {
    if (!bulkEn.trim()) {
      alert('لطفاً متن انگلیسی را وارد کنید.')
      return
    }
    const enParas = bulkEn.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    const faParas = bulkFa.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

    const generated: BookPageItem[] = []
    let curEn = ''
    let curFa = ''
    let words = 0

    enParas.forEach((para, idx) => {
      const pWords = para.split(/\s+/).length
      curEn += (curEn ? '\n\n' : '') + para
      if (faParas[idx]) {
        curFa += (curFa ? '\n\n' : '') + faParas[idx]
      }
      words += pWords

      if (words >= splitWords || idx === enParas.length - 1) {
        generated.push({
          pageNumber: generated.length + 1,
          english: curEn,
          farsi: curFa,
          type: 'text',
        })
        curEn = ''
        curFa = ''
        words = 0
      }
    })

    if (confirm(`تعداد ${generated.length} صفحه تولید خواهد شد. آیا مایلید جایگزین صفحات فعلی شوند؟`)) {
      onPagesChange(generated)
      setActivePageIdx(0)
      setShowSplitterModal(false)
    }
  }

  return (
    <div className={`clean-word-studio-root ${isFullscreen ? 'studio-fullscreen' : ''}`} dir="rtl">
      {/* ========================================================= */}
      {/* 1. ULTRA-CLEAN LUXURY TOP HEADER */}
      {/* ========================================================= */}
      <div className="clean-studio-header">
        <div className="header-left-meta">
          <div className="studio-brand-chip">
            <BookOpen size={16} />
            <span>استودیوی کتاب</span>
          </div>

          <input
            type="text"
            className="clean-title-input"
            value={bookTitle}
            onChange={(e) => onMetaChange?.({ title: e.target.value })}
            placeholder="عنوان کتاب (مثال: Pride and Prejudice)..."
            title="ویرایش عنوان کتاب"
          />

          <select
            className="clean-level-badge"
            value={bookLevel}
            onChange={(e) => onMetaChange?.({ level: e.target.value })}
            title="سطح CEFR"
          >
            <option value="A1">سطح A1</option>
            <option value="A2">سطح A2</option>
            <option value="B1">سطح B1</option>
            <option value="B2">سطح B2</option>
            <option value="C1">سطح C1</option>
            <option value="C2">سطح C2</option>
          </select>

          <span className="clean-pages-counter">
            {pages.length} صفحه • {totalBookWords.toLocaleString('fa-IR')} کلمه
          </span>
        </div>

        <div className="header-right-actions">
          {/* Live Preview Button */}
          <button
            type="button"
            className="clean-preview-btn"
            onClick={() => setShowPreviewModal(true)}
            title="مشاهده ظاهر نهایی این پیش‌نویس در کتاب‌خوان"
          >
            <Eye size={15} />
            <span>پیش‌نمایش در کتاب‌خوان</span>
          </button>

          {/* Bulk Splitter Button */}
          <button
            type="button"
            className="clean-secondary-btn"
            onClick={() => setShowSplitterModal(true)}
            title="تقطیع متن طولانی به صفحات کتاب"
          >
            <SplitSquareVertical size={15} />
            <span>تقطیع خودکار</span>
          </button>

          {/* Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="clean-save-btn"
              title="ذخیره تغییرات در دیتابیس"
            >
              <Save size={15} />
              <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره کتاب'}</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="clean-icon-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SLIM NAVIGATION & TOOLBAR (CHAPTERS, PAGES, TOOLS) */}
      {/* ========================================================= */}
      <div className="clean-sub-toolbar">
        {/* Chapter Title Editor */}
        <div className="toolbar-chapter-section">
          <span className="chapter-label">فصل:</span>
          {currentChapter ? (
            <div className="inline-chapter-pill">
              <input
                type="text"
                className="ch-input en-font"
                value={currentChapter.title}
                onChange={(e) => handleUpdateChapter('title', e.target.value)}
                placeholder="Chapter English Title"
              />
              <span className="ch-slash">/</span>
              <input
                type="text"
                className="ch-input fa-font"
                value={currentChapter.titleFa || ''}
                onChange={(e) => handleUpdateChapter('titleFa', e.target.value)}
                placeholder="عنوان فارسی فصل"
              />
            </div>
          ) : (
            <span className="no-ch-hint">بدون فصل</span>
          )}

          <button
            type="button"
            className="add-ch-mini-btn"
            onClick={handleAddChapterHere}
            title="تعریف فصل جدید از این صفحه"
          >
            <Plus size={13} />
            <span>فصل جدید</span>
          </button>
        </div>

        {/* Essential Formatting Buttons */}
        <div className="toolbar-formatting-section">
          <button
            type="button"
            className="format-mini-btn"
            onClick={() => insertFormat('en', '**', '**')}
            title="ضخیم (Bold)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            className="format-mini-btn"
            onClick={() => insertFormat('en', '*', '*')}
            title="مورب (Italic)"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            className="format-mini-btn"
            onClick={() => insertFormat('en', '### ', '\n')}
            title="تیتر (Heading)"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            className="format-mini-btn"
            onClick={() => insertFormat('en', '> ', '\n')}
            title="نقل‌قول (Quote)"
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            className="format-mini-btn"
            onClick={() => insertFormat('en', '==', '==')}
            title="هایلایت (Highlight)"
          >
            <Highlighter size={14} />
          </button>
          <button
            type="button"
            className="vocab-mini-chip-btn"
            onClick={handleInsertVocab}
            title="تگ لغت آموزشی"
          >
            <Sparkles size={13} />
            <span>تگ لغت</span>
          </button>
          <button
            type="button"
            className="pagebreak-mini-chip-btn"
            onClick={handlePageBreak}
            title="برش صفحه در نقطه مکان‌نما"
          >
            <SplitSquareVertical size={13} />
            <span>برش صفحه</span>
          </button>
        </div>

        {/* Page Step Navigator */}
        <div className="toolbar-page-navigator">
          <button
            type="button"
            className="page-nav-arrow"
            disabled={safeIdx === 0}
            onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
            title="صفحه قبل"
          >
            <ChevronRight size={16} />
          </button>

          <span className="page-current-indicator">
            صفحه {safeIdx + 1} از {pages.length}
          </span>

          <button
            type="button"
            className="page-nav-arrow"
            disabled={safeIdx >= pages.length - 1}
            onClick={() => setActivePageIdx((p) => Math.min(pages.length - 1, p + 1))}
            title="صفحه بعد"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="add-page-pill-btn"
            onClick={handleAddPage}
            title="افزودن صفحه جدید"
          >
            <Plus size={14} />
            <span>افزودن صفحه</span>
          </button>

          <button
            type="button"
            className="del-page-mini-btn"
            onClick={handleDeletePage}
            title="حذف صفحه جاری"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Pages Quick Strip */}
      <div className="clean-pages-strip">
        {pages.map((p, idx) => {
          const isSelected = idx === safeIdx
          const hasText = Boolean(p.english?.trim())
          return (
            <button
              key={idx}
              type="button"
              className={`page-pill-tag ${isSelected ? 'active' : ''} ${hasText ? 'filled' : 'empty'}`}
              onClick={() => setActivePageIdx(idx)}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. SPACIOUS & BEAUTIFUL BILINGUAL BOOK PAPER SPREAD */}
      {/* ========================================================= */}
      <div className="clean-bilingual-paper-stage">
        <div className="clean-dual-sheet-container">
          {/* Left Sheet: English Text */}
          <div className="clean-book-sheet en-sheet">
            <div className="sheet-top-header">
              <span className="sheet-title-text">{bookTitle}</span>
              <span className="sheet-side-tag">English Original</span>
            </div>

            <textarea
              ref={enRef}
              className="clean-sheet-textarea en-typography"
              dir="ltr"
              rows={16}
              placeholder="Type or paste English text here (clean, comfortable, serif reading typography)..."
              value={currentPage.english || ''}
              onChange={(e) => handleUpdatePage('english', e.target.value)}
            />

            <div className="sheet-bottom-footer">
              <span className="sheet-word-counter">{pageEnWords} کلمه</span>
              <span className="sheet-page-num">{safeIdx + 1}</span>
            </div>
          </div>

          {/* Book Spine Center Gap */}
          <div className="clean-spine-shadow" />

          {/* Right Sheet: Persian Translation */}
          <div className="clean-book-sheet fa-sheet">
            <div className="sheet-top-header">
              <span className="sheet-side-tag">ترجمه روان فارسی</span>
              <span className="sheet-title-text">
                {currentChapter?.titleFa || currentChapter?.title || `صفحه ${safeIdx + 1}`}
              </span>
            </div>

            <textarea
              ref={faRef}
              className="clean-sheet-textarea fa-typography"
              dir="rtl"
              rows={16}
              placeholder="ترجمه فارسی روان، دقیق و هم‌تراز پاراگراف به پاراگراف را اینجا تایپ کنید..."
              value={currentPage.farsi || ''}
              onChange={(e) => handleUpdatePage('farsi', e.target.value)}
            />

            <div className="sheet-bottom-footer">
              <span className="sheet-page-num">{safeIdx + 1}</span>
              <span className="sheet-word-counter">
                {currentPage.farsi?.split(/\s+/).filter(Boolean).length || 0} کلمه
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. LIVE READER SIMULATOR MODAL (EXACT USER PREVIEW) */}
      {/* ========================================================= */}
      {showPreviewModal && (
        <div className="clean-preview-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div className="clean-preview-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="preview-modal-header">
              <div className="modal-title-row">
                <Eye size={18} className="text-amber-400" />
                <h4>پیش‌نمایش زنده در کتاب‌خوان کاربر (Live Draft Simulator)</h4>
              </div>

              {/* Theme & Layout Selectors */}
              <div className="modal-toolbar-actions">
                <div className="mini-theme-toggle">
                  <button
                    type="button"
                    className={`theme-dot dark ${previewTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => setPreviewTheme('dark')}
                    title="حالت شب (Dark)"
                  />
                  <button
                    type="button"
                    className={`theme-dot sepia ${previewTheme === 'sepia' ? 'active' : ''}`}
                    onClick={() => setPreviewTheme('sepia')}
                    title="سپیا (Sepia)"
                  />
                  <button
                    type="button"
                    className={`theme-dot light ${previewTheme === 'light' ? 'active' : ''}`}
                    onClick={() => setPreviewTheme('light')}
                    title="روز (Light)"
                  />
                </div>

                <div className="mini-layout-toggle">
                  <button
                    type="button"
                    className={`layout-btn ${previewLayout === 'subtitles' ? 'active' : ''}`}
                    onClick={() => setPreviewLayout('subtitles')}
                  >
                    زیرنویس هم‌تراز
                  </button>
                  <button
                    type="button"
                    className={`layout-btn ${previewLayout === 'parallel' ? 'active' : ''}`}
                    onClick={() => setPreviewLayout('parallel')}
                  >
                    دو ستونه
                  </button>
                </div>

                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reader Simulation Canvas */}
            <div className={`simulator-canvas theme-${previewTheme}`}>
              <div className="simulator-sheet">
                {/* Book & Chapter Header */}
                <div className="sim-header">
                  <span className="sim-title">{bookTitle}</span>
                  {currentChapter && (
                    <span className="sim-ch">
                      {currentChapter.titleFa || currentChapter.title}
                    </span>
                  )}
                  <span className="sim-pg">ص {safeIdx + 1} از {pages.length}</span>
                </div>

                {/* Body Content */}
                <div className="sim-body">
                  {previewLayout === 'subtitles' ? (
                    <div className="sim-subtitles-stack">
                      {currentPage.english ? (
                        currentPage.english.split(/\n\s*\n/).map((p, pIdx) => {
                          const faParas = currentPage.farsi ? currentPage.farsi.split(/\n\s*\n/) : []
                          const faSub = faParas[pIdx] || ''
                          return (
                            <div key={pIdx} className="sim-para-block">
                              <p className="sim-en-text" dir="ltr">{p}</p>
                              {faSub && (
                                <p className="sim-fa-sub" dir="rtl">{faSub}</p>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="sim-empty">این صفحه خالی است.</p>
                      )}
                    </div>
                  ) : (
                    <div className="sim-parallel-grid">
                      <div className="sim-col en-col" dir="ltr">
                        <p className="sim-en-text">{currentPage.english || 'No text.'}</p>
                      </div>
                      <div className="sim-col fa-col" dir="rtl">
                        <p className="sim-fa-sub">{currentPage.farsi || 'متنی وارد نشده است.'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar & Flip Controls */}
                <div className="sim-footer">
                  <div className="sim-progress-line">
                    <div
                      className="sim-progress-bar"
                      style={{
                        width: `${Math.round(((safeIdx + 1) / Math.max(1, pages.length)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="sim-flip-bar">
                    <button
                      type="button"
                      disabled={safeIdx === 0}
                      onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                      className="sim-flip-btn"
                    >
                      <ChevronRight size={16} />
                      <span>صفحه قبل</span>
                    </button>
                    <span className="sim-prog-num">
                      {Math.round(((safeIdx + 1) / Math.max(1, pages.length)) * 100)}٪ مطالعه شده
                    </span>
                    <button
                      type="button"
                      disabled={safeIdx >= pages.length - 1}
                      onClick={() => setActivePageIdx((p) => Math.min(pages.length - 1, p + 1))}
                      className="sim-flip-btn"
                    >
                      <span>صفحه بعد</span>
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BULK SPLITTER MODAL */}
      {/* ========================================================= */}
      {showSplitterModal && (
        <div className="clean-preview-modal-backdrop" onClick={() => setShowSplitterModal(false)}>
          <div className="clean-splitter-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <div className="modal-title-row">
                <SplitSquareVertical size={18} className="text-amber-400" />
                <h4>تقطیع خودکار متن طولانی به صفحات استاندارد</h4>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowSplitterModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="splitter-modal-body">
              <div className="splitter-settings-row">
                <label>تعداد تقریبی کلمه در هر صفحه کتاب:</label>
                <input
                  type="number"
                  min={100}
                  max={500}
                  step={25}
                  value={splitWords}
                  onChange={(e) => setSplitWords(Number(e.target.value) || 250)}
                  className="clean-number-input"
                />
                <span className="hint-label">(استاندارد: ۲۵۰ کلمه در هر صفحه)</span>
              </div>

              <div className="splitter-dual-grid">
                <div className="splitter-grid-col">
                  <label>متن کامل انگلیسی:</label>
                  <textarea
                    dir="ltr"
                    rows={12}
                    className="clean-modal-textarea en-font"
                    placeholder="Paste complete English book chapters / story text here..."
                    value={bulkEn}
                    onChange={(e) => setBulkEn(e.target.value)}
                  />
                </div>
                <div className="splitter-grid-col">
                  <label>ترجمه کامل فارسی:</label>
                  <textarea
                    dir="rtl"
                    rows={12}
                    className="clean-modal-textarea fa-font"
                    placeholder="کل ترجمه فارسی را متناظر با متن انگلیسی اینجا قرار دهید..."
                    value={bulkFa}
                    onChange={(e) => setBulkFa(e.target.value)}
                  />
                </div>
              </div>

              <div className="splitter-modal-footer">
                <button
                  type="button"
                  className="clean-save-btn"
                  onClick={handleExecuteSplit}
                >
                  <Sparkles size={15} />
                  <span>تقطیع و ساخت صفحات دوزبانه</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
