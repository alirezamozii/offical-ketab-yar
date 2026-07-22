/**
 * Centralized site configuration.
 *
 * Single source of truth for the canonical site URL, brand name, social
 * handles and contact info. Import `SITE` instead of hardcoding
 * `'https://ketabyar.ir'` so the value can be regenerated from one place
 * (see INVEST-3 / W1-D item C.4).
 *
 * `url` honours `NEXT_PUBLIC_SITE_URL` so preview deploys / staging
 * environments can override the canonical origin without code changes.
 */
export const SITE = {
  name: 'کتاب‌یار',
  nameEn: 'KetabYar',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ketabyar.ir',
  description:
    'پلتفرم هوشمند مطالعه دوزبانه کتاب‌های انگلیسی با هوش مصنوعی، دیکشنری و واژگان‌ساز.',
  locale: 'fa_IR',
  /** Twitter handle (without leading @) used for `twitter:site` / `sameAs`. */
  twitter: '@ketabyar',
  /** Email shown in footer / structured data contactPoint. */
  email: 'support@ketabyar.ir',
  /** Social profile URLs — mirrored in the Organization `sameAs` JSON-LD
   *  in `app/layout.tsx`. Keep both lists in sync. */
  social: {
    twitter: 'https://twitter.com/ketabyar',
    instagram: 'https://instagram.com/ketabyar',
    telegram: 'https://t.me/ketabyar',
    github: 'https://github.com/ketabyar',
    youtube: 'https://www.youtube.com/@ketabyar',
  },
} as const
