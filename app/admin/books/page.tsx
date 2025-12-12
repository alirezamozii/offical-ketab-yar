'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    BookOpen,
    Edit,
    Eye,
    Plus,
    Search,
    Trash2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Book {
    _id: string
    _createdAt: string
    _updatedAt: string
    title: string
    titleFa: string
    slug: { current: string }
    author: string
    summary: string
    genres: string[]
    level: string
    status: string
    featured: boolean
    coverImageUrl?: string
}

export default function AdminBooksPage() {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [genreFilter, setGenreFilter] = useState<string>('all')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null)

    useEffect(() => {
        fetchBooks()
    }, [statusFilter, genreFilter])

    const fetchBooks = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()

            if (statusFilter !== 'all') {
                params.append('status', statusFilter)
            }

            if (genreFilter !== 'all') {
                params.append('genre', genreFilter)
            }

            if (searchQuery) {
                params.append('search', searchQuery)
            }

            const response = await fetch(`/api/admin/books/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setBooks(data.books)
            } else {
                toast.error('Failed to fetch books')
            }
        } catch (error) {
            console.error('Error fetching books:', error)
            toast.error('Error loading books')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!bookToDelete) return

        try {
            const response = await fetch(`/api/admin/books/update/${bookToDelete._id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Book deleted successfully')
                fetchBooks()
            } else {
                toast.error('Failed to delete book')
            }
        } catch (error) {
            console.error('Error deleting book:', error)
            toast.error('Error deleting book')
        } finally {
            setDeleteDialogOpen(false)
            setBookToDelete(null)
        }
    }

    const filteredBooks = books.filter(book => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.titleFa.includes(query)
        )
    })

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">📚 Book Management</h1>
                    <p className="text-muted-foreground">
                        Manage all books in plain text format
                    </p>
                </div>
                <Link href="/admin/books/new">
                    <Button size="lg" className="gap-2">
                        <Plus className="w-5 h-5" />
                        Add New Book
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={genreFilter} onValueChange={setGenreFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Genre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genres</SelectItem>
                                <SelectItem value="Fiction">Fiction</SelectItem>
                                <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                                <SelectItem value="Adventure">Adventure</SelectItem>
                                <SelectItem value="Classic">Classic</SelectItem>
                                <SelectItem value="Mystery">Mystery</SelectItem>
                                <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                                <SelectItem value="Fantasy">Fantasy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Books</CardDescription>
                        <CardTitle className="text-3xl">{books.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Published</CardDescription>
                        <CardTitle className="text-3xl">
                            {books.filter(b => b.status === 'published').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Drafts</CardDescription>
                        <CardTitle className="text-3xl">
                            {books.filter(b => b.status === 'draft').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Featured</CardDescription>
                        <CardTitle className="text-3xl">
                            {books.filter(b => b.featured).length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Books List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Books ({filteredBooks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading books...</p>
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No books found</p>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery ? 'Try a different search term' : 'Start by adding your first book'}
                            </p>
                            <Link href="/admin/books/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Book
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBooks.map((book) => (
                                <div
                                    key={book._id}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    {/* Cover Image */}
                                    <div className="flex-shrink-0">
                                        {book.coverImageUrl ? (
                                            <Image
                                                src={book.coverImageUrl}
                                                alt={book.title}
                                                width={80}
                                                height={120}
                                                className="rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-30 bg-muted rounded-md flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Book Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 mb-1">
                                            <h3 className="font-semibold text-lg truncate">
                                                {book.title}
                                            </h3>
                                            {book.featured && (
                                                <Badge variant="default" className="flex-shrink-0">⭐ Featured</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2 truncate">
                                            {book.titleFa}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline">{book.author}</Badge>
                                            <Badge variant="outline">{book.level}</Badge>
                                            {book.genres.slice(0, 2).map((genre) => (
                                                <Badge key={genre} variant="secondary">
                                                    {genre}
                                                </Badge>
                                            ))}
                                            {book.genres.length > 2 && (
                                                <Badge variant="secondary">+{book.genres.length - 2}</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex-shrink-0">
                                        <Badge
                                            variant={
                                                book.status === 'published'
                                                    ? 'default'
                                                    : book.status === 'draft'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                        >
                                            {book.status === 'published' && '✅'}
                                            {book.status === 'draft' && '📝'}
                                            {book.status === 'archived' && '📦'}
                                            {' '}
                                            {book.status}
                                        </Badge>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Link href={`/books/read/${book.slug.current}`} target="_blank">
                                            <Button variant="ghost" size="icon" title="Preview">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/books/edit/${book._id}`}>
                                            <Button variant="ghost" size="icon" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Delete"
                                            onClick={() => {
                                                setBookToDelete(book)
                                                setDeleteDialogOpen(true)
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{bookToDelete?.title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
