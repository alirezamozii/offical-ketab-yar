'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function EditAuthorPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        nationality: '',
    })

    useEffect(() => {
        fetchAuthor()
    }, [])

    const fetchAuthor = async () => {
        try {
            const response = await fetch(`/api/admin/authors/update/${params.id}`)
            const data = await response.json()

            if (data.success) {
                const author = data.author
                setFormData({
                    name: author.name || '',
                    bio: author.bio || '',
                    nationality: author.nationality || '',
                })
            } else {
                toast.error('نویسنده یافت نشد / Author not found')
                router.push('/admin/authors')
            }
        } catch (error) {
            toast.error('خطا در بارگذاری / Error loading')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name) {
            toast.error('نام نویسنده الزامی است / Author name required')
            return
        }

        setSaving(true)

        try {
            const response = await fetch(`/api/admin/authors/update/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                router.push('/admin/authors')
            } else {
                toast.error(data.error || 'خطا / Error')
            }
        } catch (error) {
            toast.error('خطا / Error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p>در حال بارگذاری... / Loading...</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/authors">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">ویرایش نویسنده / Edit Author</h1>
                    <p className="text-muted-foreground">به‌روزرسانی اطلاعات / Update information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات نویسنده / Author Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">نام نویسنده / Author Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nationality">ملیت / Nationality</Label>
                            <Input
                                id="nationality"
                                value={formData.nationality}
                                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">بیوگرافی / Biography</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={6}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" size="lg" disabled={saving} className="flex-1">
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                در حال ذخیره... / Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                ذخیره تغییرات / Save Changes
                            </>
                        )}
                    </Button>
                    <Link href="/admin/authors">
                        <Button type="button" variant="outline" size="lg">
                            لغو / Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    )
}
