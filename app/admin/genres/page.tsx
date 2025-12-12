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
import { Edit, Plus, Search, Tag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Genre {
    _id: string
    name: string
    nameFa: string
    description: string
    color: string
    bookCount: number
}

export default function GenresPage() {
    const [genres, setGenres] = useState<Genre[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null)

    useEffect(() => {
        fetchGenres()
    }, [])

    const fetchGenres = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/genres/list')
            const data = await response.json()
            if (data.success) {
                setGenres(data.genres)
            }
        } catch (error) {
            toast.error('Error loading genres')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!genreToDelete) return
        try {
            const response = await fetch(`/api/admin/genres/update/${genreToDelete._id}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                toast.success('Genre deleted')
                fetchGenres()
            }
        } catch (error) {
            toast.error('Error deleting genre')
        } finally {
            setDeleteDialogOpen(false)
            setGenreToDelete(null)
        }
    }

    const filteredGenres = genres.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">🏷️ Genre Management</h1>
                    <p className="text-muted-foreground">Manage book genres</p>
                </div>
                <Link href="/admin/genres/new">
                    <Button size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Genre
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search genres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : filteredGenres.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p>No genres found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredGenres.map((genre) => (
                                <Card key={genre._id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{genre.name}</h3>
                                                {genre.nameFa && (
                                                    <p className="text-sm text-muted-foreground" dir="rtl">
                                                        {genre.nameFa}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline">{genre.bookCount} books</Badge>
                                        </div>
                                        {genre.description && (
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {genre.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/genres/edit/${genre._id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setGenreToDelete(genre)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Genre?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete "{genreToDelete?.name}"? This cannot be undone.
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
