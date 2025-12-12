import { Tag } from 'lucide-react'
import { defineField, defineType } from 'sanity'

/**
 * 🏷️ GENRE SCHEMA | اسکیمای ژانر
 * 
 * EN: Book categories/genres for filtering and organization
 * FA: دسته‌بندی/ژانر کتاب‌ها برای فیلتر و سازماندهی
 * 
 * 🎯 PURPOSE | هدف:
 * - Categorize books by genre
 * - Enable filtering on book listing pages
 * - SEO-friendly genre pages
 * 
 * 📋 WORKFLOW | گردش کار:
 * 1. Create genres FIRST (before books)
 * 2. Then assign genres to books
 */
export default defineType({
    name: 'genre',
    title: 'ژانر | Genre',
    type: 'document',
    icon: Tag,
    description: '🏷️ دسته‌بندی کتاب‌ها | Book categories/genres',
    fields: [
        defineField({
            name: 'name',
            title: 'نام انگلیسی | Name (English)',
            type: 'string',
            description: '🇬🇧 EN: Genre name in English (e.g., "Fiction", "Mystery") | FA: نام ژانر به انگلیسی (مثال: "Fiction"، "Mystery")',
            validation: Rule => Rule.required().error('نام انگلیسی الزامی است | English name is required'),
        }),
        defineField({
            name: 'nameFa',
            title: 'نام فارسی | Name (Farsi)',
            type: 'string',
            description: '🇮🇷 EN: Genre name in Persian (e.g., "داستانی", "معمایی") | FA: نام ژانر به فارسی (مثال: "داستانی"، "معمایی")',
            validation: Rule => Rule.required().error('نام فارسی الزامی است | Farsi name is required'),
        }),
        defineField({
            name: 'description',
            title: 'توضیحات | Description',
            type: 'text',
            rows: 3,
            description: '📝 EN: Brief description of this genre (optional) | FA: توضیح کوتاه درباره این ژانر (اختیاری)',
        }),
        defineField({
            name: 'color',
            title: 'رنگ | Color',
            type: 'string',
            description: '🎨 EN: Hex color code for UI badges (e.g., "#D4AF37" for gold) | FA: کد رنگ هگز برای نمایش در رابط کاربری (مثال: "#D4AF37" برای طلایی)',
            initialValue: '#D4AF37',
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'nameFa',
        },
        prepare({ title, subtitle }) {
            return {
                title: `🏷️ ${title || 'Untitled Genre'}`,
                subtitle: subtitle || 'بدون نام فارسی',
            }
        },
    },
})
