import { BookOpen } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { PlainTextBookInput } from '../components/PlainTextBookInput'

/**
 * 📚 COMPACT BOOK SCHEMA | اسکیمای کتاب فشرده
 * 
 * EN: Stores books with full metadata + compact JSON content.
 * FA: ذخیره کتاب‌ها با متادیتای کامل + محتوای JSON فشرده
 * 
 * 🎯 PURPOSE | هدف:
 * - Bilingual book storage (English + Persian)
 * - SEO-optimized metadata
 * - Compact JSON format for performance
 * - Works with both Sanity Studio and Admin Panel
 */
export default defineType({
    name: 'compactBook',
    title: 'کتاب | Book',
    type: 'document',
    icon: BookOpen,
    description: '📚 کتاب دوزبانه با متادیتا و محتوای JSON | Bilingual book with metadata & JSON content',
    fields: [
        // ============================================
        // SECTION 1: CORE METADATA | اطلاعات اصلی
        // ============================================
        defineField({
            name: 'title',
            title: 'عنوان انگلیسی | Title (English)',
            type: 'string',
            description: '🇬🇧 EN: Original English title | FA: عنوان اصلی انگلیسی کتاب (مثال: "Atomic Habits")',
            validation: Rule => Rule.required().error('عنوان انگلیسی الزامی است | English title is required'),
            group: 'metadata',
        }),
        defineField({
            name: 'titleFa',
            title: 'عنوان فارسی | Title (Farsi)',
            type: 'string',
            description: '🇮🇷 EN: Persian translation of title | FA: ترجمه فارسی عنوان (مثال: "عادت‌های اتمی")',
            validation: Rule => Rule.required().error('عنوان فارسی الزامی است | Farsi title is required'),
            group: 'metadata',
        }),
        defineField({
            name: 'slug',
            title: 'آدرس URL | URL Slug',
            type: 'slug',
            description: '🔗 EN: URL-friendly version (auto-generated from title) | FA: نسخه URL-friendly که خودکار از عنوان ساخته می‌شود (مثال: "atomic-habits")',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: Rule => Rule.required().error('آدرس URL الزامی است | URL slug is required'),
            group: 'metadata',
        }),
        defineField({
            name: 'author',
            title: 'نویسنده | Author',
            type: 'reference',
            to: [{ type: 'author' }],
            description: '✍️ EN: Select author from dropdown | FA: نویسنده را از لیست انتخاب کنید',
            validation: Rule => Rule.required().error('نویسنده الزامی است | Author is required'),
            group: 'metadata',
        }),
        defineField({
            name: 'coverImage',
            title: 'تصویر جلد | Cover Image',
            type: 'image',
            description: '🖼️ EN: Book cover image (recommended: 300x450px) | FA: تصویر جلد کتاب (توصیه: 300x450 پیکسل)',
            options: {
                hotspot: true,
            },
            group: 'metadata',
        }),
        defineField({
            name: 'summary',
            title: 'خلاصه انگلیسی | Summary (English)',
            type: 'text',
            rows: 4,
            description: '📝 EN: Brief book description in English (2-3 sentences) | FA: توضیح کوتاه کتاب به انگلیسی (2-3 جمله)',
            group: 'metadata',
        }),
        defineField({
            name: 'summaryFa',
            title: 'خلاصه فارسی | Summary (Farsi)',
            type: 'text',
            rows: 4,
            description: '📝 EN: Brief book description in Persian (2-3 sentences) | FA: توضیح کوتاه کتاب به فارسی (2-3 جمله)',
            group: 'metadata',
        }),
        defineField({
            name: 'genres',
            title: 'ژانرها | Genres',
            type: 'array',
            description: '🏷️ EN: Book categories (select multiple with checkboxes) | FA: دسته‌بندی کتاب (با چک‌باکس چند مورد انتخاب کنید)',
            of: [{ type: 'reference', to: [{ type: 'genre' }] }],
            validation: Rule => Rule.required().min(1).error('حداقل یک ژانر الزامی است | At least one genre is required'),
            group: 'metadata',
        }),
        defineField({
            name: 'level',
            title: 'سطح مطالعه | Reading Level',
            type: 'string',
            description: '📊 EN: Difficulty level for language learners | FA: سطح دشواری برای زبان‌آموزان',
            options: {
                list: [
                    { title: 'مبتدی | Beginner', value: 'beginner' },
                    { title: 'متوسط | Intermediate', value: 'intermediate' },
                    { title: 'پیشرفته | Advanced', value: 'advanced' },
                ],
            },
            initialValue: 'intermediate',
            group: 'metadata',
        }),
        defineField({
            name: 'subtitle',
            title: 'زیرعنوان انگلیسی | Subtitle (English)',
            type: 'string',
            description: '📑 EN: Book subtitle in English (optional) | FA: زیرعنوان کتاب به انگلیسی (اختیاری)',
            group: 'metadata',
        }),
        defineField({
            name: 'subtitleFa',
            title: 'زیرعنوان فارسی | Subtitle (Farsi)',
            type: 'string',
            description: '📑 EN: Book subtitle in Persian (optional) | FA: زیرعنوان کتاب به فارسی (اختیاری)',
            group: 'metadata',
        }),
        defineField({
            name: 'publishYear',
            title: 'سال انتشار | Publication Year',
            type: 'number',
            description: '📅 EN: Year the book was published (e.g., 2024) | FA: سال انتشار کتاب (مثال: 2024)',
            validation: Rule => Rule.min(1900).max(new Date().getFullYear() + 1),
            group: 'metadata',
        }),
        defineField({
            name: 'publisher',
            title: 'ناشر | Publisher',
            type: 'string',
            description: '🏢 EN: Publishing company name | FA: نام ناشر کتاب',
            group: 'metadata',
        }),
        defineField({
            name: 'isbn',
            title: 'شابک | ISBN',
            type: 'string',
            description: '🔢 EN: International Standard Book Number | FA: شماره استاندارد بین‌المللی کتاب',
            group: 'metadata',
        }),
        defineField({
            name: 'totalPages',
            title: 'تعداد صفحات | Total Pages',
            type: 'number',
            description: '📄 EN: Total number of pages in the book | FA: تعداد کل صفحات کتاب',
            validation: Rule => Rule.min(1).max(10000),
            group: 'metadata',
        }),
        defineField({
            name: 'totalChapters',
            title: 'تعداد فصل‌ها | Total Chapters',
            type: 'number',
            description: '📚 EN: Total number of chapters | FA: تعداد کل فصل‌های کتاب',
            validation: Rule => Rule.min(1).max(500),
            group: 'metadata',
        }),

        // ============================================
        // SECTION 2: BOOK CONTENT | محتوای کتاب
        // ============================================
        defineField({
            name: 'bookData',
            title: 'محتوای کتاب | Book Content',
            type: 'text',
            description: `📖 EN: Paste plain text from AI translator, then click "Convert to JSON"
            
FA: متن ساده را از مترجم هوش مصنوعی اینجا بچسبانید، سپس دکمه "تبدیل به JSON" را بزنید

⚠️ FORMAT | فرمت:
Line 1: English sentence
Line 2: Persian translation
Line 3: Empty line
(Repeat...)

💡 TIP | نکته: After pasting, click the "Convert to JSON" button below the text area`,
            components: {
                input: PlainTextBookInput
            },
            group: 'content',
        }),

        // ============================================
        // SECTION 3: STATUS & PUBLISHING | وضعیت و انتشار
        // ============================================
        defineField({
            name: 'status',
            title: 'وضعیت | Status',
            type: 'string',
            description: '🚦 EN: Publishing status | FA: وضعیت انتشار کتاب',
            options: {
                list: [
                    { title: '📝 پیش‌نویس | Draft', value: 'draft' },
                    { title: '✅ منتشر شده | Published', value: 'published' },
                    { title: '📦 بایگانی | Archived', value: 'archived' },
                ],
                layout: 'radio',
            },
            initialValue: 'draft',
            group: 'publishing',
        }),
        defineField({
            name: 'featured',
            title: 'ویژه صفحه اصلی | Featured on Homepage',
            type: 'boolean',
            initialValue: false,
            description: '⭐ EN: Show in featured section on homepage | FA: نمایش در بخش ویژه صفحه اصلی',
            group: 'publishing',
        }),

        // ============================================
        // SECTION 4: SEO | بهینه‌سازی موتور جستجو
        // ============================================
        defineField({
            name: 'seoTitle',
            title: 'عنوان SEO | SEO Title',
            type: 'string',
            description: '🔍 EN: Custom title for Google (max 60 chars). Leave empty to use book title | FA: عنوان سفارشی برای گوگل (حداکثر 60 کاراکتر). خالی بگذارید تا از عنوان کتاب استفاده شود',
            group: 'seo',
        }),
        defineField({
            name: 'seoDescription',
            title: 'توضیحات SEO | SEO Description',
            type: 'text',
            rows: 3,
            description: '📄 EN: Meta description for Google (150-160 chars recommended) | FA: توضیحات متا برای گوگل (150-160 کاراکتر توصیه می‌شود)',
            group: 'seo',
        }),
    ],

    // ============================================
    // ORGANIZE FIELDS INTO TABS | سازماندهی فیلدها در تب‌ها
    // ============================================
    groups: [
        { name: 'metadata', title: '📖 اطلاعات کتاب | Book Details', default: true },
        { name: 'content', title: '📄 محتوا | Content' },
        { name: 'publishing', title: '🚀 انتشار | Publishing' },
        { name: 'seo', title: '🔍 سئو | SEO' },
    ],

    preview: {
        select: {
            title: 'title',
            titleFa: 'titleFa',
            authorName: 'author.name',
            status: 'status',
            media: 'coverImage',
        },
        prepare({ title, titleFa, authorName, status, media }) {
            const statusEmoji =
                status === 'published' ? '✅' :
                    status === 'archived' ? '📦' :
                        '📝'

            return {
                title: `${statusEmoji} ${title || 'Untitled Book'}`,
                subtitle: `${titleFa || 'بدون عنوان'} ${authorName ? `• by ${authorName}` : ''}`,
                media,
            }
        },
    },
})
