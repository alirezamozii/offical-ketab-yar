import ForgotPasswordForm from '@/components/auth/forgot-password-form'
import { Metadata } from 'next'
import { Suspense } from 'react'
import ForgotPasswordLoading from './loading'

export const metadata: Metadata = {
    title: 'بازیابی رمز عبور | کتاب‌یار',
    description: 'رمز عبور خود را فراموش کرده‌اید؟ نگران نباشید، می‌توانید آن را بازیابی کنید',
    robots: {
        index: false,
        follow: false,
    },
}

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<ForgotPasswordLoading />}>
            <ForgotPasswordForm />
        </Suspense>
    )
}
