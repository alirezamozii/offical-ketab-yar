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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Edit, Plus, Search, Trash2, UserCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Author {
    _id: string
    name: string
    bio: string
    photoUrl?: string
    bookCount: number
    nationality?: string
}

export default function AuthorsPage() {
    const [authors, setAuthors] = useState<Author[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null)

    useEffect(() => {
        fetchAuthors()
    }, [])

    const fetchAuthors = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/authors/list')
            const data = await response.json()
            if (data.success) {
                setAuthors(data.authors)
            }
        } catch (error) {
            toast.error('Error loading authors')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!authorToDelete) return
        try {
            const response = await fetch(`/api/admin/authors/update/${authorToDelete._id}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                toast.success('Author deleted')
                fetchAuthors()
            }
        } catch (error) {
            toast.error('Error deleting author')
        } finally {
            setDeleteDialogOpen(false)
            setAuthorToDelete(null)
        }
    }

    const filteredAuthors = authors.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">👤 Author Management</h1>
                    <p className="text-muted-foreground">Manage book authors</p>
                </div>
                <Link href="/admin/authors/new">
                    <Button size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Author
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search authors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : filteredAuthors.length === 0 ? (
                        <div className="text-center py-12">
                            <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p>No authors found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAuthors.map((author) => (
                                <div key={author._id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    {author.photoUrl ? (
                                        <Image src={author.photoUrl} alt={author.name} width={64} height={64} className="rounded-full" />
                                    ) : (
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                            <UserCircle className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{author.name}</h3>
                                        {author.bio && <p className="text-sm text-muted-foreground line-clamp-2">{author.bio}</p>}
                                        <div className="flex items-center gap-2 mt-2">
                                            {author.nationality && <Badge variant="outline">{author.nationality}</Badge>}
                                            <Badge variant="secondary">{author.bookCount} books</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/admin/authors/edit/${author._id}`}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAuthorToDelete(author)
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Author?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete "{authorToDelete?.name}"? This cannot be undone.
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
