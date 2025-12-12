'use client'

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
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, BookOpen, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const GENRES = [
    'Fiction', 'Non-Fiction', 'Adventure', 'Classic', 'Mystery',
    'Sci-Fi', 'Fantasy', 'Romance', 'Thriller', 'Biography'
]

export default function NewBookPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [authors, setAuthors] = useState<any[]>([])
    const [formData, setFormData] = useState({
        title: '',
        titleFa: '',
        author: '',
        summary: '',
        summaryFa: '',
        genres: [] as string[],
        level: 'intermediate',
        status: 'draft',
        featured: false,
    })

    useEffect(() => {
        fetchAuthors()
    }, [])

    const fetchAuthors = async () => {
        try {
            const response = await fetch('/api/admin/authors/list')
            const data = await response.json()
            if (data.success) {
                setAuthors(data.authors)
            }
        } catch (error) {
            console.error('Error fetching authors:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.titleFa) {
            toast.error('عنوان انگلیسی و فارسی الزامی است / Title (EN & FA) required')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/admin/books/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                router.push('/admin/books')
            } else {
                toast.error(data.error || 'خطا در ایجاد کتاب / Error creating book')
            }
        } catch (error) {
            console.error('Error creating book:', error)
            toast.error('خطا در ایجاد کتاب / Error creating book')
        } finally {
            setLoading(false)
        }
    }

    const toggleGenre = (genre: string) => {
        setFormData(prev => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter(g => g !== genre)
                : [...prev.genres, genre]
        }))
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/books">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">افزودن کتاب جدید / Add New Book</h1>
                    <p className="text-muted-foreground">
                        ایجاد کتاب جدید در سیستم / Create a new book in the system
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات پایه / Basic Information</CardTitle>
                        <CardDescription>عنوان و نویسنده کتاب / Book title and author</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">عنوان (انگلیسی) / Title (English) *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="The Great Gatsby"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="titleFa">عنوان (فارسی) / Title (Farsi) *</Label>
                                <Input
                                    id="titleFa"
                                    value={formData.titleFa}
                                    onChange={(e) => setFormData({ ...formData, titleFa: e.target.value })}
                                    placeholder="گتسبی بزرگ"
                                    dir="rtl"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="author">نویسنده / Author</Label>
                            {authors.length > 0 ? (
                                <Select
                                    value={formData.author}
                                    onValueChange={(value) => setFormData({ ...formData, author: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="انتخاب نویسنده / Select author" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {authors.map((author) => (
                                            <SelectItem key={author._id} value={author.name}>
                                                {author.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="author"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    placeholder="F. Scott Fitzgerald"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>خلاصه / Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="summary">خلاصه (انگلیسی) / Summary (English)</Label>
                            <Textarea
                                id="summary"
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                placeholder="A story about..."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="summaryFa">خلاصه (فارسی) / Summary (Farsi)</Label>
                            <Textarea
                                id="summaryFa"
                                value={formData.summaryFa}
                                onChange={(e) => setFormData({ ...formData, summaryFa: e.target.value })}
                                placeholder="داستانی درباره..."
                                rows={4}
                                dir="rtl"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Genres & Level */}
                <Card>
                    <CardHeader>
                        <CardTitle>ژانر و سطح / Genres & Level</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>ژانرها / Genres</Label>
                            <div className="flex flex-wrap gap-2">
                                {GENRES.map((genre) => (
                                    <Button
                                        key={genre}
                                        type="button"
                                        variant={formData.genres.includes(genre) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleGenre(genre)}
                                    >
                                        {genre}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="level">سطح / Level</Label>
                            <Select
                                value={formData.level}
                                onValueChange={(value) => setFormData({ ...formData, level: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">مبتدی / Beginner</SelectItem>
                                    <SelectItem value="intermediate">متوسط / Intermediate</SelectItem>
                                    <SelectItem value="advanced">پیشرفته / Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Publishing */}
                <Card>
                    <CardHeader>
                        <CardTitle>انتشار / Publishing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">وضعیت / Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">📝 پیش‌نویس / Draft</SelectItem>
                                    <SelectItem value="published">✅ منتشر شده / Published</SelectItem>
                                    <SelectItem value="archived">📦 بایگانی / Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="featured"
                                checked={formData.featured}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="featured">ویژه / Featured on homepage</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Button type="submit" size="lg" disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                در حال ذخیره... / Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                ذخیره کتاب / Save Book
                            </>
                        )}
                    </Button>
                    <Link href="/admin/books">
                        <Button type="button" variant="outline" size="lg">
                            لغو / Cancel
                        </Button>
                    </Link>
                </div>
            </form>

            {/* Next Steps */}
            <Card>
                <CardHeader>
                    <CardTitle>مراحل بعدی / Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>1️⃣ بعد از ذخیره، به Sanity Studio بروید / After saving, go to Sanity Studio</p>
                    <p>2️⃣ کتاب را پیدا کنید و محتوای JSON را اضافه کنید / Find the book and add JSON content</p>
                    <p>3️⃣ یا از صفحه "Import Book" استفاده کنید / Or use the "Import Book" page</p>
                    <div className="flex gap-2 mt-4">
                        <Link href="/Studio" target="_blank">
                            <Button variant="outline" size="sm">
                                <BookOpen className="w-4 h-4 mr-2" />
                                باز کردن Sanity Studio / Open Sanity Studio
                            </Button>
                        </Link>
                        <Link href="/admin/import-book">
                            <Button variant="outline" size="sm">
                                وارد کردن محتوا / Import Content
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
