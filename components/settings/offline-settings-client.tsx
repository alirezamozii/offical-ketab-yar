/**
 * Offline Settings Client Component
 * Agent 2 (Performance) + Agent 3 (Psychology)
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import {
    deleteBookOffline,
    getOfflineBooks,
    getStorageUsage,
} from '@/lib/pwa/offline-storage'
import { motion } from 'framer-motion'
import {
    AlertCircle,
    BookOpen,
    HardDrive,
    RefreshCw,
    Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface OfflineBook {
    slug: string
    title: { en: string; fa: string }
    author: { name: string; slug: string }
    coverImage: string
    totalChapters: number
    downloadedAt: string
}

export function OfflineSettingsClient() {
    const [offlineBooks, setOfflineBooks] = useState<OfflineBook[]>([])
    const [storageInfo, setStorageInfo] = useState({
        usage: 0,
        quota: 0,
        percentage: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const { isSyncing, queueSize, syncNow } = useOfflineSync()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [books, storage] = await Promise.all([
                getOfflineBooks(),
                getStorageUsage(),
            ])
            setOfflineBooks(books)
            if (storage) {
                setStorageInfo({
                    usage: storage.usage,
                    quota: storage.quota,
                    percentage: storage.percentUsed
                })
            }
        } catch (error) {
            console.error('Failed to load offline data:', error)
            toast({
                title: 'خطا',
                description: 'بارگذاری اطلاعات با مشکل مواجه شد',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteBook = async (bookId: string) => {
        try {
            await deleteBookOffline(bookId)
            toast({
                title: 'حذف شد',
                description: 'کتاب از حافظه آفلاین حذف شد',
            })
            loadData()
        } catch (err) {
            console.error('Failed to delete offline book:', err)
            toast({
                title: 'خطا',
                description: 'حذف کتاب با مشکل مواجه شد',
                variant: 'destructive',
            })
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">تنظیمات آفلاین</h1>
                <p className="text-muted-foreground">
                    مدیریت کتاب‌های دانلود شده و حافظه دستگاه
                </p>
            </div>

            {/* Storage Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        فضای ذخیره‌سازی
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>استفاده شده</span>
                            <span className="font-medium">
                                {formatBytes(storageInfo.usage)} از {formatBytes(storageInfo.quota)}
                            </span>
                        </div>
                        <Progress value={storageInfo.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {storageInfo.percentage.toFixed(1)}% استفاده شده
                        </p>
                    </div>

                    {storageInfo.percentage > 80 && (
                        <div className="flex items-start gap-2 rounded-lg bg-orange-500/10 p-3 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                            <p className="text-orange-700 dark:text-orange-300">
                                فضای ذخیره‌سازی شما رو به اتمام است. برای آزاد کردن فضا، برخی کتاب‌ها را حذف کنید.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sync Queue */}
            {queueSize > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            صف همگام‌سازی
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {queueSize} مورد در انتظار همگام‌سازی با سرور
                        </p>
                        <Button
                            onClick={syncNow}
                            disabled={isSyncing || !navigator.onLine}
                            className="w-full"
                        >
                            {isSyncing ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    در حال همگام‌سازی...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    همگام‌سازی اکنون
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Downloaded Books */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            کتاب‌های دانلود شده
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">
                            {offlineBooks.length} کتاب
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-24 animate-pulse rounded-lg bg-muted"
                                />
                            ))}
                        </div>
                    ) : offlineBooks.length === 0 ? (
                        <div className="py-12 text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                هنوز کتابی دانلود نکرده‌اید
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                برای خواندن آفلاین، کتاب‌های مورد نظر را دانلود کنید
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {offlineBooks.map((book, index) => (
                                <motion.div
                                    key={book.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-4 rounded-lg border p-4"
                                >
                                    <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                                        <Image
                                            src={book.coverImage}
                                            alt={book.title.fa || book.title.en}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">
                                            {book.title.fa || book.title.en}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {book.author.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            دانلود شده:{' '}
                                            {new Date(book.downloadedAt).toLocaleDateString('fa-IR')}
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="حذف کتاب"
                                        title="حذف کتاب"
                                        onClick={() => handleDeleteBook(book.slug)}
                                        className="flex-shrink-0 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6">
                    <div className="space-y-2 text-sm">
                        <p className="font-medium">💡 نکات مهم:</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• کتاب‌های دانلود شده با رمزنگاری امن ذخیره می‌شوند</li>
                            <li>• برای خواندن آفلاین، ابتدا کتاب را دانلود کنید</li>
                            <li>• پیشرفت خواندن شما در حالت آفلاین ذخیره و همگام‌سازی می‌شود</li>
                            <li>• برای آزاد کردن فضا، کتاب‌های خوانده شده را حذف کنید</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
