import { UserCircle } from 'lucide-react'
import { defineField, defineType } from 'sanity'

/**
 * 👤 AUTHOR SCHEMA | اسکیمای نویسنده
 * 
 * EN: Stores information about book authors
 * FA: ذخیره اطلاعات نویسندگان کتاب
 * 
 * 🎯 PURPOSE | هدف:
 * - Author profiles for book pages
 * - SEO-rich author information
 * - Used in book metadata and blog posts
 */
export default defineType({
    name: 'author',
    title: 'نویسنده | Author',
    type: 'document',
    icon: UserCircle,
    description: '👤 اطلاعات نویسندگان کتاب | Book author information',
    fields: [
        defineField({
            name: 'name',
            title: 'نام نویسنده | Author Name',
            type: 'string',
            description: '✍️ EN: Full name (e.g., "James Clear", "J.K. Rowling") | FA: نام کامل نویسنده (مثال: "جیمز کلیر"، "جی.کی. رولینگ")',
            validation: Rule => Rule.required().error('نام نویسنده الزامی است | Author name is required'),
        }),
        defineField({
            name: 'bio',
            title: 'بیوگرافی | Biography',
            type: 'text',
            rows: 4,
            description: '📝 EN: Short biography (3-5 sentences) | FA: بیوگرافی کوتاه (3-5 جمله)',
        }),
        defineField({
            name: 'nationality',
            title: 'ملیت | Nationality',
            type: 'string',
            description: '🌍 EN: Country of origin (e.g., "American", "British") | FA: کشور مبدا (مثال: "آمریکایی"، "بریتانیایی")',
        }),
        defineField({
            name: 'photo',
            title: 'عکس | Photo',
            type: 'image',
            description: '📸 EN: Author photo (recommended: square, 400x400px) | FA: عکس نویسنده (توصیه: مربع، 400x400 پیکسل)',
            options: {
                hotspot: true,
            },
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'nationality',
            media: 'photo',
        },
    },
})
