'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, CheckCircle2, Key, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ApiKey {
    id: string
    name: string
    key_value: string
    service: string
    is_active: boolean
    usage_count: number
    error_count: number
    last_used_at: string | null
    last_error_at: string | null
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newKey, setNewKey] = useState({
        name: '',
        key_value: '',
        service: 'gemini',
        test: true,
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/api-keys')
            const data = await response.json()
            if (data.success) {
                setKeys(data.keys)
            }
        } catch (error) {
            toast.error('خطا در بارگذاری کلیدها')
        } finally {
            setLoading(false)
        }
    }

    const handleAddKey = async () => {
        if (!newKey.name || !newKey.key_value) {
            toast.error('نام و کلید الزامی است')
            return
        }

        try {
            setSubmitting(true)
            const response = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newKey),
            })

            const data = await response.json()

            if (data.success) {
                toast.success('کلید با موفقیت اضافه شد')
                setDialogOpen(false)
                setNewKey({ name: '', key_value: '', service: 'gemini', test: true })
                fetchKeys()
            } else {
                toast.error(data.error || 'خطا در افزودن کلید')
            }
        } catch (error) {
            toast.error('خطا در افزودن کلید')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleActive = async (keyId: string, currentState: boolean) => {
        try {
            const response = await fetch('/api/admin/api-keys', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: keyId, is_active: !currentState }),
            })

            if (response.ok) {
                toast.success(currentState ? 'کلید غیرفعال شد' : 'کلید فعال شد')
                fetchKeys()
            }
        } catch (error) {
            toast.error('خطا در به‌روزرسانی کلید')
        }
    }

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('آیا مطمئن هستید؟')) return

        try {
            const response = await fetch(`/api/admin/api-keys?id=${keyId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('کلید حذف شد')
                fetchKeys()
            }
        } catch (error) {
            toast.error('خطا در حذف کلید')
        }
    }

    const maskKey = (key: string) => {
        if (key.length <= 8) return key
        return key.substring(0, 4) + '...' + key.substring(key.length - 4)
    }

    return (
        <div className="container mx-auto py-8 space-y-8" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">🔑 مدیریت کلیدهای API</h1>
                    <p className="text-muted-foreground">مدیریت کلیدهای Gemini و چرخش خودکار</p>
                </div>
                <Button size="lg" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-5 h-5 ml-2" />
                    افزودن کلید جدید
                </Button>
            </div>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <CardTitle className="text-blue-900">💡 چگونه کار می‌کند؟</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 space-y-2">
                    <p>• سیستم به صورت خودکار بین کلیدها چرخش می‌کند</p>
                    <p>• اگر یک کلید خطا داد، کلید بعدی استفاده می‌شود</p>
                    <p>• کلیدها بر اساس کمترین خطا و استفاده انتخاب می‌شوند</p>
                    <p>• می‌توانید کلیدهای نامحدود اضافه کنید</p>
                </CardContent>
            </Card>

            {/* Keys List */}
            <div className="grid gap-4">
                {loading ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p>در حال بارگذاری...</p>
                        </CardContent>
                    </Card>
                ) : keys.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center space-y-4">
                            <Key className="w-16 h-16 mx-auto text-muted-foreground" />
                            <div>
                                <p className="font-semibold mb-2">هیچ کلیدی وجود ندارد</p>
                                <p className="text-sm text-muted-foreground">برای شروع، یک کلید API اضافه کنید</p>
                            </div>
                            <Button onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4 ml-2" />
                                افزودن اولین کلید
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    keys.map((key) => (
                        <Card key={key.id} className={!key.is_active ? 'opacity-60' : ''}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CardTitle>{key.name}</CardTitle>
                                            {key.is_active ? (
                                                <Badge variant="default" className="bg-green-500">
                                                    <CheckCircle2 className="w-3 h-3 ml-1" />
                                                    فعال
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">غیرفعال</Badge>
                                            )}
                                            <Badge variant="outline">{key.service}</Badge>
                                        </div>
                                        <CardDescription className="font-mono text-xs">
                                            {maskKey(key.key_value)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={key.is_active}
                                            onCheckedChange={() => handleToggleActive(key.id, key.is_active)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteKey(key.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">تعداد استفاده</p>
                                        <p className="font-semibold">{key.usage_count.toLocaleString('fa-IR')}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">تعداد خطا</p>
                                        <p className="font-semibold flex items-center gap-1">
                                            {key.error_count > 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
                                            {key.error_count.toLocaleString('fa-IR')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">آخرین استفاده</p>
                                        <p className="font-semibold text-xs">
                                            {key.last_used_at
                                                ? new Date(key.last_used_at).toLocaleDateString('fa-IR')
                                                : 'هرگز'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">آخرین خطا</p>
                                        <p className="font-semibold text-xs">
                                            {key.last_error_at
                                                ? new Date(key.last_error_at).toLocaleDateString('fa-IR')
                                                : 'هیچ'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Key Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>افزودن کلید API جدید</DialogTitle>
                        <DialogDescription>
                            کلید Gemini API خود را اضافه کنید. سیستم به صورت خودکار از آن استفاده خواهد کرد.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">نام کلید</Label>
                            <Input
                                id="name"
                                placeholder="مثال: کلید اصلی"
                                value={newKey.name}
                                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="key">کلید API</Label>
                            <Input
                                id="key"
                                placeholder="AIzaSy..."
                                value={newKey.key_value}
                                onChange={(e) => setNewKey({ ...newKey, key_value: e.target.value })}
                                type="password"
                            />
                        </div>
                        <div>
                            <Label htmlFor="service">سرویس</Label>
                            <Select
                                value={newKey.service}
                                onValueChange={(value) => setNewKey({ ...newKey, service: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="test"
                                checked={newKey.test}
                                onCheckedChange={(checked) => setNewKey({ ...newKey, test: checked })}
                            />
                            <Label htmlFor="test">تست کلید قبل از افزودن</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            انصراف
                        </Button>
                        <Button onClick={handleAddKey} disabled={submitting}>
                            {submitting ? 'در حال افزودن...' : 'افزودن کلید'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
