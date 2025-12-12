'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateTestUserPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.email || !formData.password) {
            toast.error('ایمیل و رمز عبور الزامی است / Email and password required')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/admin/users/create-test-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                setFormData({ email: '', password: '', full_name: '' })
            } else {
                toast.error(data.error || 'خطا در ایجاد کاربر / Error creating user')
            }
        } catch (error) {
            toast.error('خطا در ایجاد کاربر / Error creating user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">ایجاد کاربر تستی / Create Test User</h1>
                    <p className="text-muted-foreground">
                        کاربر تستی برای دسترسی به کتاب‌های پیش‌نویس / Test user for draft book access
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>اطلاعات کاربر / User Information</CardTitle>
                    <CardDescription>
                        کاربران تستی می‌توانند به کتاب‌های پیش‌نویس دسترسی داشته باشند
                        <br />
                        Test users can access draft books for testing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">ایمیل / Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="testuser@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">رمز عبور / Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                حداقل ۶ کاراکتر / Minimum 6 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">نام کامل / Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Test User"
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button type="submit" size="lg" disabled={loading} className="flex-1">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        در حال ایجاد... / Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        ایجاد کاربر تستی / Create Test User
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/users">
                                <Button type="button" variant="outline" size="lg">
                                    بازگشت / Back
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>راهنما / Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>✅ کاربران تستی به طور خودکار نقش "test_user" دریافت می‌کنند</p>
                    <p>✅ Test users automatically receive "test_user" role</p>
                    <p>📚 دسترسی به کتاب‌های پیش‌نویس برای تست / Access to draft books for testing</p>
                    <p>🔒 ایمیل به طور خودکار تأیید می‌شود / Email is automatically verified</p>
                </CardContent>
            </Card>
        </div>
    )
}
