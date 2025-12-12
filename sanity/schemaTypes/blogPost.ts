import { FileEdit } from 'lucide-react'
import { defineField, defineType } from 'sanity'

/**
 * 📰 BLOG POST SCHEMA | اسکیمای پست بلاگ
 * 
 * EN: Blog posts for content marketing and SEO
 * FA: پست‌های بلاگ برای بازاریابی محتوا و سئو
 * 
 * 🎯 PURPOSE | هدف:
 * - Content marketing (attract organic traffic)
 * - Internal linking to book pages (SEO boost)
 * - Build authority and trust
 * 
 * 💡 EXAMPLES | نمونه‌ها:
 * - "Top 10 Books for Learning English"
 * - "How to Build a Reading Habit"
 * - "Review: Atomic Habits"
 */
export default defineType({
    name: 'blogPost',
    title: 'پست بلاگ | Blog Post',
    type: 'document',
    icon: FileEdit,
    description: '📰 پست‌های بلاگ برای بازاریابی و سئو | Blog posts for marketing & SEO',
    groups: [
        { name: 'content', title: '📝 محتوا | Content', default: true },
        { name: 'seo', title: '🔍 سئو | SEO' },
        { name: 'settings', title: '⚙️ تنظیمات | Settings' },
    ],
    fields: [
        defineField({
            name: 'title',
            title: 'عنوان | Title',
            type: 'object',
            description: '📌 EN: Post title in both languages | FA: عنوان پست به دو زبان',
            group: 'content',
            fields: [
                {
                    name: 'en',
                    title: 'انگلیسی | English',
                    type: 'string',
                    validation: (Rule) => Rule.required().error('عنوان انگلیسی الزامی است | English title required')
                },
                {
                    name: 'fa',
                    title: 'فارسی | Persian',
                    type: 'string',
                    description: 'اختیاری | Optional'
                },
            ],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'آدرس URL | URL Slug',
            type: 'slug',
            description: '🔗 EN: URL-friendly version (e.g., "top-10-books-for-learning") | FA: نسخه URL-friendly (مثال: "top-10-books-for-learning")',
            group: 'content',
            options: {
                source: 'title.en',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required().error('آدرس URL الزامی است | URL slug required'),
        }),
        defineField({
            name: 'excerpt',
            title: 'خلاصه | Excerpt',
            type: 'object',
            description: '📄 EN: Short summary (2-3 sentences) | FA: خلاصه کوتاه (2-3 جمله)',
            group: 'content',
            fields: [
                { name: 'en', title: 'انگلیسی | English', type: 'text', rows: 3 },
                { name: 'fa', title: 'فارسی | Persian', type: 'text', rows: 3 },
            ],
        }),
        defineField({
            name: 'mainImage',
            title: 'تصویر اصلی | Main Image',
            type: 'image',
            description: '🖼️ EN: Featured image (recommended: 1200x630px for social sharing) | FA: تصویر شاخص (توصیه: 1200x630 پیکسل برای اشتراک‌گذاری)',
            group: 'content',
            options: {
                hotspot: true,
            },
            fields: [
                {
                    name: 'alt',
                    title: 'متن جایگزین | Alt Text',
                    type: 'string',
                    description: '♿ EN: Important for SEO and accessibility | FA: مهم برای سئو و دسترسی‌پذیری',
                },
            ],
        }),
        defineField({
            name: 'body',
            title: 'متن اصلی | Body',
            type: 'array',
            description: '📖 EN: Main content with rich text formatting | FA: محتوای اصلی با قالب‌بندی متنی پیشرفته',
            group: 'content',
            of: [
                {
                    type: 'block',
                    styles: [
                        { title: 'Normal', value: 'normal' },
                        { title: 'H1', value: 'h1' },
                        { title: 'H2', value: 'h2' },
                        { title: 'H3', value: 'h3' },
                        { title: 'H4', value: 'h4' },
                        { title: 'Quote', value: 'blockquote' },
                    ],
                    lists: [
                        { title: 'Bullet', value: 'bullet' },
                        { title: 'Numbered', value: 'number' },
                    ],
                    marks: {
                        decorators: [
                            { title: 'Strong', value: 'strong' },
                            { title: 'Emphasis', value: 'em' },
                            { title: 'Code', value: 'code' },
                            { title: 'Underline', value: 'underline' },
                            { title: 'Strike', value: 'strike-through' },
                        ],
                        annotations: [
                            {
                                name: 'link',
                                type: 'object',
                                title: 'External Link',
                                fields: [
                                    {
                                        name: 'href',
                                        type: 'url',
                                        title: 'URL',
                                        validation: (Rule) =>
                                            Rule.uri({
                                                scheme: ['http', 'https', 'mailto', 'tel'],
                                            }),
                                    },
                                    {
                                        title: 'Open in new tab',
                                        name: 'blank',
                                        type: 'boolean',
                                    },
                                ],
                            },
                            {
                                name: 'internalLink',
                                type: 'object',
                                title: 'Internal Link',
                                fields: [
                                    {
                                        name: 'reference',
                                        type: 'reference',
                                        title: 'Reference',
                                        to: [{ type: 'compactBook' }, { type: 'blogPost' }, { type: 'author' }],
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        {
                            name: 'alt',
                            type: 'string',
                            title: 'Alt Text',
                        },
                        {
                            name: 'caption',
                            type: 'string',
                            title: 'Caption',
                        },
                    ],
                },
            ],
        }),
        defineField({
            name: 'author',
            title: 'نویسنده | Author',
            type: 'reference',
            description: '✍️ EN: Select post author | FA: نویسنده پست را انتخاب کنید',
            group: 'content',
            to: [{ type: 'author' }],
        }),
        defineField({
            name: 'categories',
            title: 'دسته‌بندی‌ها | Categories',
            type: 'array',
            description: '🏷️ EN: Post categories (select multiple) | FA: دسته‌بندی پست (می‌توانید چند مورد انتخاب کنید)',
            group: 'content',
            of: [{ type: 'string' }],
            options: {
                list: [
                    { title: 'نقد کتاب | Book Reviews', value: 'book-reviews' },
                    { title: 'یادگیری زبان | Language Learning', value: 'language-learning' },
                    { title: 'نکات مطالعه | Reading Tips', value: 'reading-tips' },
                    { title: 'مصاحبه با نویسندگان | Author Interviews', value: 'author-interviews' },
                    { title: 'اخبار | News', value: 'news' },
                ],
            },
        }),
        defineField({
            name: 'relatedBooks',
            title: 'کتاب‌های مرتبط | Related Books',
            type: 'array',
            description: '🔗 EN: Books mentioned in this post (creates internal links for SEO) | FA: کتاب‌های ذکر شده در این پست (لینک داخلی برای سئو)',
            group: 'content',
            of: [{ type: 'reference', to: [{ type: 'compactBook' }] }],
        }),

        // ============================================
        // SEO FIELDS | فیلدهای سئو
        // ============================================
        defineField({
            name: 'seoTitle',
            title: 'عنوان سئو | SEO Title',
            type: 'string',
            description: '🔍 EN: Custom title for Google (50-60 chars). Leave empty to use post title | FA: عنوان سفارشی برای گوگل (50-60 کاراکتر). خالی بگذارید تا از عنوان پست استفاده شود',
            group: 'seo',
        }),
        defineField({
            name: 'seoDescription',
            title: 'توضیحات سئو | SEO Description',
            type: 'text',
            rows: 3,
            description: '📄 EN: Meta description for Google (150-160 chars) | FA: توضیحات متا برای گوگل (150-160 کاراکتر)',
            group: 'seo',
        }),
        defineField({
            name: 'seoKeywords',
            title: 'کلمات کلیدی | SEO Keywords',
            type: 'array',
            description: '🔑 EN: Target keywords for this post | FA: کلمات کلیدی هدف برای این پست',
            group: 'seo',
            of: [{ type: 'string' }],
            options: {
                layout: 'tags',
            },
        }),

        // ============================================
        // SETTINGS | تنظیمات
        // ============================================
        defineField({
            name: 'publishedAt',
            title: 'تاریخ انتشار | Published At',
            type: 'datetime',
            description: '📅 EN: Publication date and time | FA: تاریخ و زمان انتشار',
            group: 'settings',
        }),
        defineField({
            name: 'featured',
            title: 'ویژه | Featured',
            type: 'boolean',
            initialValue: false,
            description: '⭐ EN: Show on homepage | FA: نمایش در صفحه اصلی',
            group: 'settings',
        }),
        defineField({
            name: 'status',
            title: 'وضعیت | Status',
            type: 'string',
            description: '🚦 EN: Publishing status | FA: وضعیت انتشار',
            group: 'settings',
            options: {
                list: [
                    { title: '📝 پیش‌نویس | Draft', value: 'draft' },
                    { title: '✅ منتشر شده | Published', value: 'published' },
                ],
                layout: 'radio',
            },
            initialValue: 'draft',
        }),
    ],
    preview: {
        select: {
            titleEn: 'title.en',
            titleFa: 'title.fa',
            media: 'mainImage',
            status: 'status',
        },
        prepare(selection) {
            const { titleEn, titleFa, status } = selection
            const statusEmoji = status === 'published' ? '✅' : '📝'
            return {
                ...selection,
                title: `${statusEmoji} ${titleEn}`,
                subtitle: titleFa || 'No Persian title',
            }
        },
    },
})
