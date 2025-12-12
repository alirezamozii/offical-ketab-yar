import LoginForm from '@/components/auth/login-form'
import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginLoading from './loading'

// Agent 1 (SEO): Block from search engines
export const metadata: Metadata = {
    title: 'ورود به کتاب‌یار',
    description: 'وارد حساب کاربری خود شوید و به دنیای کتاب‌های دوزبانه بپیوندید',
    robots: {
        index: false,
        follow: false,
    },
}

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    )
}
