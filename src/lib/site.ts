/**
 * Centralized site configuration.
 *
 * Single source of truth for the canonical site URL, brand name, social
 * handles and contact info. Import `SITE` instead of hardcoding
 * `'https://bookzi.ir'` so the value can be regenerated from one place
 * (see INVEST-3 / W1-D item C.4).
 *
 * `url` honours `NEXT_PUBLIC_SITE_URL` so preview deploys / staging
 * environments can override the canonical origin without code changes.
 */
export const SITE = {
  name: 'بوکزی',
  nameEn: 'Bookzi',
  tagline: 'زیست‌بومِ کتاب‌های دوزبانه',
  taglineEn: 'The Bilingual Books Ecosystem',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bookzi.ir',
  description:
    'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی، دیکشنری در لحظه، واژگان‌ساز و استودیوی کوت.',
  locale: 'fa_IR',
  twitter: '@bookzi_app',
  email: 'support@bookzi.ir',
  social: {
    twitter: 'https://twitter.com/bookzi_app',
    instagram: 'https://instagram.com/bookzi_app',
    telegram: 'https://t.me/bookzi_app',
    github: 'https://github.com/bookzi',
    youtube: 'https://www.youtube.com/@bookzi',
  },
} as const
