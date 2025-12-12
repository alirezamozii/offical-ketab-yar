'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function NewGenrePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        nameFa: '',
        description: '',
        color: '#D4AF37',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name) {
            toast.error('نام ژانر الزامی است / Genre name required')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/admin/genres/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                router.push('/admin/genres')
            } else {
                toast.error(data.error || 'خطا در ایجاد ژانر / Error creating genre')
            }
        } catch (error) {
            toast.error('خطا در ایجاد ژانر / Error creating genre')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/genres">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">افزودن ژانر / Add Genre</h1>
                    <p className="text-muted-foreground">ایجاد ژانر جدید / Create new genre</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات ژانر / Genre Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">نام (انگلیسی) / Name (English) *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Fiction"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameFa">نام (فارسی) / Name (Farsi)</Label>
                                <Input
                                    id="nameFa"
                                    value={formData.nameFa}
                                    onChange={(e) => setFormData({ ...formData, nameFa: e.target.value })}
                                    placeholder="داستانی"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">توضیحات / Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Genre description..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color">رنگ / Color</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-20 h-10"
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="#D4AF37"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                ذخیره / Save
                            </>
                        )}
                    </Button>
                    <Link href="/admin/genres">
                        <Button type="button" variant="outline" size="lg">
                            لغو / Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    )
}
