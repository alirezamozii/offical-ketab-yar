import { Button } from '@/components/ui/button'
import { BookOpen, Home, Library, Sparkles } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '۴۰۴ - صفحه یافت نشد | کتاب‌یار',
    description: 'صفحه مورد نظر شما یافت نشد. به صفحه اصلی بازگردید یا کتابخانه را مرور کنید.',
}

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="max-w-2xl w-full text-center space-y-12">

                {/* 404 with Book Icon */}
                <div className="relative mb-8">
                    <div className="text-[180px] md:text-[220px] font-black text-gold-600/20 select-none leading-none">
                        ۴۰۴
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-24 h-24 md:w-32 md:h-32 text-gold-600 animate-bounce" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Brand Name */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-gold-600" />
                    <span className="text-2xl md:text-3xl font-bold text-gold-600">
                        کتاب‌یار
                    </span>
                    <Sparkles className="w-5 h-5 text-gold-600" />
                </div>

                {/* Message */}
                <div className="space-y-4 mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                        صفحه یافت نشد
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
                        <br />
                        اما نگران نباشید، می‌توانید به صفحه اصلی بازگردید یا کتابخانه را مرور کنید.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <Button
                        asChild
                        size="lg"
                        variant="bronze"
                        className="w-full sm:w-auto min-w-[200px]"
                    >
                        <Link href="/">
                            <Home className="ml-2 h-5 w-5" />
                            بازگشت به خانه
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto min-w-[200px] border-gold-600/40 hover:bg-gold-600/10 hover:border-gold-600"
                    >
                        <Link href="/library">
                            <Library className="ml-2 h-5 w-5" />
                            مرور کتابخانه
                        </Link>
                    </Button>
                </div>

                {/* Quick Links */}
                <div className="pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                        یا یکی از این صفحات محبوب را امتحان کنید:
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center items-center">
                        <Link href="/dashboard" className="text-sm text-gold-600 hover:text-gold-700 hover:underline">
                            داشبورد
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/vocabulary" className="text-sm text-gold-600 hover:text-gold-700 hover:underline">
                            واژگان من
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/profile" className="text-sm text-gold-600 hover:text-gold-700 hover:underline">
                            پروفایل
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/help" className="text-sm text-gold-600 hover:text-gold-700 hover:underline">
                            راهنما
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    )
}
