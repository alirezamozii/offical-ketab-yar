'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { parseInterleavedText } from '@/lib/parseInterleavedText'
import { Eye, Loader2, Save, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function BookEditForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const bookId = searchParams.get('id')

    const [metadata, setMetadata] = useState({
        title: '',
        titleFa: '',
        slug: '',
        author: '',
        summary: '',
        summaryFa: '',
        status: 'draft',
        level: 'intermediate',
        featured: false,
        seoTitle: '',
        seoDescription: '',
    })

    const [genres, setGenres] = useState<string[]>([])
    const [newGenre, setNewGenre] = useState('')
    const [availableGenres, setAvailableGenres] = useState<string[]>([
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
    ])

    const [interleavedText, setInterleavedText] = useState('')
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImageAsset, setCoverImageAsset] = useState<string>('')
    const [coverImageUrl, setCoverImageUrl] = useState<string>('')

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewJson, setPreviewJson] = useState('')

    // Load book data if editing
    useEffect(() => {
        if (bookId) {
            fetch(`/api/admin/books/${bookId}`)
                .then(res => res.json())
                .then(book => {
                    setMetadata({
                        title: book.title || '',
                        titleFa: book.titleFa || '',
                        slug: book.slug?.current || '',
                        author: book.author || '',
                        summary: book.summary || '',
                        summaryFa: book.summaryFa || '',
                        status: book.status || 'draft',
                        level: book.level || 'intermediate',
                        featured: book.featured || false,
                        seoTitle: book.seoTitle || '',
                        seoDescription: book.seoDescription || '',
                    })
                    setGenres(book.genres || [])
                    if (book.coverImage?.asset?.url) {
                        setCoverImageUrl(book.coverImage.asset.url)
                    }
                    // Note: We don't load interleavedText as it's not stored
                    setIsLoading(false)
                })
                .catch(err => {
                    console.error('Error loading book:', err)
                    setIsLoading(false)
                })
        } else {
            setIsLoading(false)
        }
    }, [bookId])

    // Auto-generate slug from title
    const handleTitleChange = (value: string) => {
        setMetadata(prev => ({
            ...prev,
            title: value,
            slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        }))
    }

    // Handle cover image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setCoverImage(file)
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/admin/upload-image', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                setCoverImageAsset(data.assetId)
                setCoverImageUrl(data.url)
            } else {
                alert('Failed to upload image')
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error uploading image')
        } finally {
            setIsUploading(false)
        }
    }

    // Add genre
    const handleAddGenre = () => {
        if (newGenre && !genres.includes(newGenre)) {
            setGenres([...genres, newGenre])
            if (!availableGenres.includes(newGenre)) {
                setAvailableGenres([...availableGenres, newGenre])
            }
            setNewGenre('')
        }
    }

    // Remove genre
    const handleRemoveGenre = (genre: string) => {
        setGenres(genres.filter(g => g !== genre))
    }

    // Preview parsed JSON
    const handlePreview = () => {
        try {
            const parsed = parseInterleavedText(interleavedText)
            setPreviewJson(JSON.stringify(parsed, null, 2))
            setShowPreview(true)
        } catch (error) {
            alert('Error parsing text. Please check your format.')
        }
    }

    // Save book
    const handleSave = async () => {
        if (!metadata.title || !metadata.titleFa || !interleavedText) {
            alert('Please fill in all required fields (Title, Title Farsi, and Book Content)')
            return
        }

        setIsSaving(true)

        const payload = {
            _id: bookId || undefined,
            ...metadata,
            genres,
            interleavedText,
            coverImageAsset,
        }

        try {
            const response = await fetch('/api/admin/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (result.success) {
                alert(result.message)
                router.push('/admin/books')
            } else {
                alert('Failed to save book: ' + result.message)
            }
        } catch (error) {
            console.error('Error saving book:', error)
            alert('An error occurred while saving')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    {bookId ? 'Edit Book' : 'Add New Book'}
                </h1>
                <p className="text-muted-foreground">
                    Fill in the book details and paste your interleaved text
                </p>
            </div>

            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg mb-6">
                <h2 className="col-span-full text-2xl font-semibold mb-4">Book Details</h2>

                <div>
                    <Label htmlFor="title">Title (English) *</Label>
                    <Input
                        id="title"
                        value={metadata.title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="Enter book title"
                    />
                </div>

                <div>
                    <Label htmlFor="titleFa">Title (Farsi) *</Label>
                    <Input
                        id="titleFa"
                        value={metadata.titleFa}
                        onChange={e => setMetadata({ ...metadata, titleFa: e.target.value })}
                        placeholder="عنوان کتاب"
                        dir="rtl"
                    />
                </div>

                <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                        id="slug"
                        value={metadata.slug}
                        onChange={e => setMetadata({ ...metadata, slug: e.target.value })}
                        placeholder="book-url-slug"
                        className="bg-gray-100 dark:bg-gray-800"
                    />
                </div>

                <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                        id="author"
                        value={metadata.author}
                        onChange={e => setMetadata({ ...metadata, author: e.target.value })}
                        placeholder="Author name"
                    />
                </div>

                <div className="col-span-full">
                    <Label htmlFor="summary">Summary (English)</Label>
                    <Textarea
                        id="summary"
                        value={metadata.summary}
                        onChange={e => setMetadata({ ...metadata, summary: e.target.value })}
                        placeholder="Book summary in English"
                        rows={3}
                    />
                </div>

                <div className="col-span-full">
                    <Label htmlFor="summaryFa">Summary (Farsi)</Label>
                    <Textarea
                        id="summaryFa"
                        value={metadata.summaryFa}
                        onChange={e => setMetadata({ ...metadata, summaryFa: e.target.value })}
                        placeholder="خلاصه کتاب به فارسی"
                        rows={3}
                        dir="rtl"
                    />
                </div>

                <div>
                    <Label htmlFor="level">Reading Level</Label>
                    <Select value={metadata.level} onValueChange={value => setMetadata({ ...metadata, level: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={metadata.status} onValueChange={value => setMetadata({ ...metadata, status: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">📝 Draft</SelectItem>
                            <SelectItem value="published">✅ Published</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-full">
                    <Label>Genres</Label>
                    <div className="flex gap-2 mb-2">
                        <Select value={newGenre} onValueChange={setNewGenre}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select or type new genre" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableGenres.map(genre => (
                                    <SelectItem key={genre} value={genre}>
                                        {genre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={newGenre}
                            onChange={e => setNewGenre(e.target.value)}
                            placeholder="Or type new genre"
                            className="flex-1"
                        />
                        <Button onClick={handleAddGenre} variant="outline">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {genres.map(genre => (
                            <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                                {genre}
                                <X
                                    className="w-3 h-3 cursor-pointer"
                                    onClick={() => handleRemoveGenre(genre)}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="col-span-full flex items-center gap-2">
                    <Checkbox
                        id="featured"
                        checked={metadata.featured}
                        onCheckedChange={checked => setMetadata({ ...metadata, featured: checked as boolean })}
                    />
                    <Label htmlFor="featured" className="cursor-pointer">
                        ⭐ Feature this book on homepage
                    </Label>
                </div>

                <div className="col-span-full">
                    <Label htmlFor="coverImage">Cover Image</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            id="coverImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                        />
                        {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                    </div>
                    {coverImageUrl && (
                        <img
                            src={coverImageUrl}
                            alt="Cover preview"
                            className="mt-4 w-32 h-48 object-cover rounded shadow"
                        />
                    )}
                </div>

                <div>
                    <Label htmlFor="seoTitle">SEO Title (Optional)</Label>
                    <Input
                        id="seoTitle"
                        value={metadata.seoTitle}
                        onChange={e => setMetadata({ ...metadata, seoTitle: e.target.value })}
                        placeholder="Custom SEO title (max 60 chars)"
                    />
                </div>

                <div>
                    <Label htmlFor="seoDescription">SEO Description (Optional)</Label>
                    <Textarea
                        id="seoDescription"
                        value={metadata.seoDescription}
                        onChange={e => setMetadata({ ...metadata, seoDescription: e.target.value })}
                        placeholder="Custom SEO description (150-160 chars)"
                        rows={2}
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg mb-6">
                <h2 className="text-2xl font-semibold mb-4">Book Content *</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Paste your interleaved English and Farsi text here. Use "Page: X" to mark page breaks.
                </p>
                <Textarea
                    className="w-full font-mono text-sm"
                    rows={25}
                    placeholder={`Chapter 1: The Beginning\nفصل اول: آغاز\n\nEnglish paragraph one.\nفارسی پاراگراف یک.\n\nPage: 2\n\nEnglish paragraph two.\nفارسی پاراگراف دو.`}
                    value={interleavedText}
                    onChange={e => setInterleavedText(e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="lg"
                        className="bg-[#D4AF37] hover:bg-[#C9A961]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Book
                            </>
                        )}
                    </Button>

                    <Button onClick={handlePreview} variant="outline" size="lg">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview JSON
                    </Button>
                </div>

                <Button variant="ghost" onClick={() => router.push('/admin/books')}>
                    Cancel
                </Button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-semibold">Parsed JSON Preview</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <pre className="p-4 overflow-auto flex-1 text-sm font-mono">
                            {previewJson}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function EditBookPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                </div>
            }
        >
            <BookEditForm />
        </Suspense>
    )
}
