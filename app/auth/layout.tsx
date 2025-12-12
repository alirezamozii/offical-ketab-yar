import { BookOpen } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-warm-50 via-warm-100 to-warm-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,97,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-dot-pattern opacity-30 dark:opacity-20" />

            {/* Logo/Brand at top-right - Fixed position (RTL) */}
            <Link
                href="/"
                className="fixed top-4 right-4 md:top-6 md:right-6 z-50 inline-flex items-center gap-2 group hover:opacity-80 transition-opacity"
            >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
                    <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                    کتاب‌یار
                </span>
            </Link>

            {/* Main content - Perfectly centered, no scroll needed */}
            <div className="relative z-10 w-full max-w-md my-auto">
                {children}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="fixed bottom-4 left-0 right-0 z-10 text-center text-xs md:text-sm text-muted-foreground px-4">
                <p>© 2025 کتاب‌یار. تمامی حقوق محفوظ است.</p>
            </div>
        </div>
    )
}
