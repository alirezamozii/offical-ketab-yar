import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'

const ResetPasswordForm = dynamicImport(() => import('@/components/auth/reset-password-form'), {
    loading: () => (
        <Card className="mx-auto max-w-md">
            <CardHeader className="space-y-2">
                <Skeleton className="mx-auto size-12 rounded-full" />
                <Skeleton className="mx-auto h-8 w-3/4" />
                <Skeleton className="mx-auto h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    ),
})

export const metadata: Metadata = {
    title: 'تنظیم رمز عبور جدید | کتاب‌یار',
    description: 'رمز عبور جدید خود را تنظیم کنید',
    robots: {
        index: false,
        follow: false,
    },
}

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    )
}
