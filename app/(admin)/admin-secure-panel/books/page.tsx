import { BookUploadForm } from '@/components/admin/book-upload-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'مدیریت کتاب‌ها | پنل ادمین',
    robots: {
        index: false,
        follow: false,
    },
}

export default function AdminBooksPage() {
    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">مدیریت کتاب‌ها</h1>
                <p className="text-muted-foreground">
                    افزودن، ویرایش و مدیریت کتاب‌ها از طریق Sanity Studio
                </p>
            </div>

            <BookUploadForm />
        </div>
    )
}
