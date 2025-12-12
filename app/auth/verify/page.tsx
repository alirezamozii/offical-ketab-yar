import { Metadata } from 'next'
import VerifyEmailContent from './verify-content'

export const metadata: Metadata = {
    title: 'تأیید ایمیل | کتاب‌یار',
    description: 'لطفاً ایمیل خود را تأیید کنید',
    robots: {
        index: false,
        follow: false,
    },
}

export const dynamic = 'force-dynamic'

export default function VerifyEmailPage() {
    return <VerifyEmailContent />
}
