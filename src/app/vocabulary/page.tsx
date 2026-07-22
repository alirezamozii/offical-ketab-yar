import { VocabularyClient } from '@/components/vocabulary/vocabulary-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'واژگان من — ذخیره و تمرین کلمات',
  description:
    'کلماتی که هنگام مطالعه ذخیره کرده‌اید را مرور و تمرین کنید. کلمات روزانه از کتاب‌ها، دسته‌بندی، سیستم تکرار با فاصله (لایتنر ۷ مرحله‌ای) و بازی‌های تعاملی.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VocabularyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          واژگان من
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          کلماتی که هنگام خواندن ذخیره کرده‌اید اینجا جمع‌آوری می‌شوند. هر روز
          ۵ کلمه جدید از کتاب‌ها پیشنهاد می‌شود، با دسته‌بندی و سطح تسلط
          (جدید → یادگیری → آشنا → تسلط) سازمان‌دهی می‌شوند، و با تمرین منظم
          بر اساس سیستم لایتنر ۷ مرحله‌ای برای همیشه در ذهن تثبیت می‌گردند.
        </p>
      </header>
      <VocabularyClient />
    </div>
  )
}
