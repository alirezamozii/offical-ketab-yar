'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { validatePlainText } from '@/lib/admin/plain-text-converter'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  Upload,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface BookEditorProps {
  mode: 'create' | 'edit'
  bookId?: string
}

const GENRE_OPTIONS = [
  'Fiction',
  'Non-Fiction',
  'Adventure',
  'Classic',
  'Mystery',
  'Sci-Fi',
  'Fantasy',
  'Romance',
  'Thriller',
  'Biography',
  'Self-Help',
  'History',
  'Philosophy',
  'Poetry'
]

export function BookEditor({ mode, bookId }: BookEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [titleFa, setTitleFa] = useState('')
  const [author, setAuthor] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryFa, setSummaryFa] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [genres, setGenres] = useState<string[]>([])
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverImageAssetId, setCoverImageAssetId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [featured, setFeatured] = useState(false)

  // Validation state
  const [validation, setValidation] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)

  useEffect(() => {
    if (mode === 'edit' && bookId) {
      fetchBook()
    }
  }, [mode, bookId])

  useEffect(() => {
    if (content) {
      const result = validatePlainText(content)
      setValidation(result)
    } else {
      setValidation(null)
    }
  }, [content])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/books/${bookId}`)
      const book = await response.json()

      if (response.ok) {
        setTitle(book.title || '')
        setTitleFa(book.titleFa || '')
        setAuthor(book.author || '')
        setSummary(book.summary || '')
        setSummaryFa(book.summaryFa || '')
        setYear(book.year || new Date().getFullYear())
        setGenres(book.genres || [])
        setLevel(book.level || 'intermediate')
        setContent(book.plainTextContent || '')
        setCoverImageUrl(book.coverImage?.asset?.url || '')
        setCoverImageAssetId(book.coverImage?.asset?._ref || '')
        setStatus(book.status || 'draft')
        setFeatured(book.featured || false)
      } else {
        toast.error('Failed to load book')
        router.push('/admin/books')
      }
    } catch (error) {
      console.error('Error fetching book:', error)
      toast.error('Error loading book')
      router.push('/admin/books')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setCoverImageUrl(data.asset.url)
        setCoverImageAssetId(data.asset._id)
        toast.success('Image uploaded successfully')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (saveStatus: 'draft' | 'published' | 'archived') => {
    // Validate required fields
    if (!title || !author) {
      toast.error('Title and author are required')
      return
    }

    if (!content) {
      toast.error('Book content is required')
      return
    }

    if (validation && !validation.valid) {
      toast.error('Please fix content errors before saving')
      return
    }

    try {
      setSaving(true)

      const body = {
        title,
        titleFa: titleFa || title,
        author,
        summary,
        summaryFa: summaryFa || summary,
        year,
        genres,
        level,
        content,
        coverImageUrl: coverImageAssetId,
        status: saveStatus,
        featured
      }

      const url = mode === 'create'
        ? '/api/admin/books'
        : `/api/admin/books/${bookId}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          mode === 'create'
            ? 'Book created successfully'
            : 'Book updated successfully'
        )
        router.push('/admin/books')
      } else {
        toast.error(data.error || 'Failed to save book')
      }
    } catch (error) {
      console.error('Error saving book:', error)
      toast.error('Error saving book')
    } finally {
      setSaving(false)
    }
  }

  const addGenre = (genre: string) => {
    if (!genres.includes(genre)) {
      setGenres([...genres, genre])
    }
  }

  const removeGenre = (genre: string) => {
    setGenres(genres.filter(g => g !== genre))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading book...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/books">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'create' ? 'افزودن کتاب جدید' : 'ویرایش کتاب'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'کتاب جدید را با متن ساده اضافه کنید'
                : 'ویرایش اطلاعات و محتوای کتاب'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
            ذخیره پیش‌نویس
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
            انتشار کتاب
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات اصلی</CardTitle>
              <CardDescription>
                عنوان، نویسنده و خلاصه کتاب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>عنوان (انگلیسی) *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="The Great Gatsby"
                    required
                  />
                </div>
                <div>
                  <Label>عنوان (فارسی)</Label>
                  <Input
                    value={titleFa}
                    onChange={(e) => setTitleFa(e.target.value)}
                    placeholder="گتسبی بزرگ"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <Label>نویسنده *</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="F. Scott Fitzgerald"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>خلاصه (انگلیسی)</Label>
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="A story about..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>خلاصه (فارسی)</Label>
                  <Textarea
                    value={summaryFa}
                    onChange={(e) => setSummaryFa(e.target.value)}
                    placeholder="داستانی درباره..."
                    rows={4}
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Book Content */}
          <Card>
            <CardHeader>
              <CardTitle>محتوای کتاب (متن ساده)</CardTitle>
              <CardDescription>
                محتوای کتاب را به صورت متن ساده وارد کنید. فرمت: یک پاراگراف انگلیسی، سپس ترجمه فارسی آن، سپس یک خط خالی.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Validation Messages */}
              {validation && (
                <div className="space-y-2">
                  {validation.errors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold text-destructive">خطاها:</p>
                          {validation.errors.map((error, i) => (
                            <p key={i} className="text-sm text-destructive">{error}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold text-yellow-600">هشدارها:</p>
                          {validation.warnings.map((warning, i) => (
                            <p key={i} className="text-sm text-yellow-600">{warning}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {validation.valid && validation.errors.length === 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-green-600">فرمت محتوا صحیح است ✓</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content Textarea */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Chapter 1: The Beginning
فصل اول: آغاز

English paragraph one.
پاراگراف فارسی اول.

English paragraph two.
پاراگراف فارسی دوم.

Page: 2

English paragraph three.
پاراگراف فارسی سوم.`}
                rows={25}
                className="font-mono text-sm"
                dir="ltr"
              />

              {/* Format Help */}
              <details className="bg-muted p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">
                  📖 راهنمای فرمت متن ساده
                </summary>
                <div className="mt-4 space-y-2 text-sm">
                  <p><strong>عنوان فصل:</strong></p>
                  <pre className="bg-background p-2 rounded">
                    {`Chapter 1: Title
فصل اول: عنوان

`}</pre>

                  <p><strong>پاراگراف‌ها:</strong></p>
                  <pre className="bg-background p-2 rounded">
                    {`English paragraph.
پاراگراف فارسی.

`}</pre>

                  <p><strong>نشانگر صفحه:</strong></p>
                  <pre className="bg-background p-2 rounded">
                    {`Page: 2

`}</pre>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>تصویر جلد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverImageUrl && (
                <div className="aspect-[3/4] relative bg-muted rounded-lg overflow-hidden">
                  <img
                    src={coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="cover-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted transition-colors">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                    )}
                    <p className="text-sm">
                      {uploading ? 'در حال آپلود...' : 'کلیک برای آپلود تصویر'}
                    </p>
                  </div>
                </Label>
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تکمیلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>سال انتشار</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label>سطح</Label>
                <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدی</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">پیشرفته</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ژانرها</Label>
                <Select onValueChange={addGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب ژانر" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                        <button
                          onClick={() => removeGenre(genre)}
                          className="mr-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">نمایش در صفحه اصلی</Label>
                <Switch
                  id="featured"
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>

              <div>
                <Label>وضعیت</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 پیش‌نویس</SelectItem>
                    <SelectItem value="published">✅ منتشر شده</SelectItem>
                    <SelectItem value="archived">📦 بایگانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
