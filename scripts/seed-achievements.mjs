/**
 * Seed the `AchievementDef` table — the CMS source of truth for the
 * /achievements gallery and /api/achievements.
 *
 * The `slug` of each row MUST match an id handled by `progressFor()`
 * in src/lib/achievements.ts, otherwise its progress will always be 0.
 *
 * Idempotent: re-running upserts the same rows (update in place).
 * Usage: node scripts/seed-achievements.mjs
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFS = [
  // ── reading ────────────────────────────────────────────────────────────
  { slug: 'first-book',      title: 'آغاز سفر',          description: 'اولین کتاب را شروع کن',        icon: '📖', color: 'from-amber-400 to-orange-500',   rarity: 'common',    category: 'reading',    xpReward: 50,   maxProgress: 1,   unit: 'کتاب' },
  { slug: 'books-5',         title: 'کتاب‌خوان',          description: '۵ کتاب را شروع کن',            icon: '🌟', color: 'from-fuchsia-400 to-pink-500',   rarity: 'rare',      category: 'reading',    xpReward: 200,  maxProgress: 5,   unit: 'کتاب' },
  { slug: 'books-10-start',  title: 'فصل‌خوان',           description: '۱۰ کتاب را شروع کن',           icon: '🗂️', color: 'from-rose-400 to-red-500',       rarity: 'rare',      category: 'reading',    xpReward: 300,  maxProgress: 10,  unit: 'کتاب' },
  { slug: 'first-finish',    title: 'پایان اولین کتاب',   description: 'یک کتاب را تا انتها بخوان',     icon: '🏆', color: 'from-emerald-400 to-teal-500',   rarity: 'rare',      category: 'reading',    xpReward: 250,  maxProgress: 1,   unit: 'کتاب' },
  { slug: 'books-finish-3',  title: 'پایان‌بنده',         description: '۳ کتاب را تمام کن',            icon: '🎓', color: 'from-cyan-400 to-sky-500',       rarity: 'epic',      category: 'reading',    xpReward: 400,  maxProgress: 3,   unit: 'کتاب' },
  { slug: 'books-finish-10', title: 'کتاب‌خوان حرفه‌ای',   description: '۱۰ کتاب را تمام کن',           icon: '🎯', color: 'from-violet-400 to-purple-500',  rarity: 'legendary', category: 'reading',    xpReward: 900,  maxProgress: 10,  unit: 'کتاب' },
  { slug: 'pages-100',       title: 'صد صفحه اول',        description: '۱۰۰ صفحه بخوان',               icon: '📄', color: 'from-sky-400 to-blue-500',       rarity: 'common',    category: 'reading',    xpReward: 100,  maxProgress: 100, unit: 'صفحه' },
  { slug: 'pages-500',       title: 'صفحه‌گرد',           description: '۵۰۰ صفحه بخوان',               icon: '📘', color: 'from-blue-400 to-indigo-500',    rarity: 'epic',      category: 'reading',    xpReward: 500,  maxProgress: 500, unit: 'صفحه' },
  // ── streak ─────────────────────────────────────────────────────────────
  { slug: 'reader-10',       title: 'وفادار به کتاب',     description: 'در ۱۰ روز مختلف مطالعه کن',    icon: '📚', color: 'from-sky-400 to-blue-500',       rarity: 'rare',      category: 'streak',     xpReward: 250,  maxProgress: 10,  unit: 'روز' },
  { slug: 'streak-3',        title: 'سه روز متوالی',      description: '۳ روز پشت سر هم بخوان',        icon: '🔥', color: 'from-rose-400 to-red-500',       rarity: 'common',    category: 'streak',     xpReward: 100,  maxProgress: 3,   unit: 'روز' },
  { slug: 'streak-7',        title: 'یک هفته پایدار',     description: '۷ روز متوالی مطالعه',          icon: '⚡', color: 'from-violet-400 to-purple-500',  rarity: 'rare',      category: 'streak',     xpReward: 200,  maxProgress: 7,   unit: 'روز' },
  { slug: 'streak-30',       title: 'یک ماه پایدار',      description: '۳۰ روز متوالی مطالعه',         icon: '👑', color: 'from-yellow-400 to-amber-500',   rarity: 'legendary', category: 'streak',     xpReward: 600,  maxProgress: 30,  unit: 'روز' },
  { slug: 'streak-30-cur',   title: 'یک ماهه',            description: 'استمرار فعلی ۳۰ روزه',         icon: '🌙', color: 'from-amber-300 to-orange-500',   rarity: 'legendary', category: 'streak',     xpReward: 600,  maxProgress: 30,  unit: 'روز' },
  // ── vocabulary ─────────────────────────────────────────────────────────
  { slug: 'vocab-50',        title: 'واژه‌شناس',          description: '۵۰ واژه ذخیره کن',             icon: '📝', color: 'from-lime-400 to-emerald-500',   rarity: 'common',    category: 'vocabulary', xpReward: 150,  maxProgress: 50,  unit: 'واژه' },
  { slug: 'vocab-200',       title: 'واژه‌اندوز',         description: '۲۰۰ واژه ذخیره کن',            icon: '🧠', color: 'from-teal-400 to-emerald-600',   rarity: 'rare',      category: 'vocabulary', xpReward: 350,  maxProgress: 200, unit: 'واژه' },
  { slug: 'vocab-500',       title: 'واژه‌سارا',          description: '۵۰۰ واژه ذخیره کن',            icon: '📓', color: 'from-green-400 to-teal-600',     rarity: 'epic',      category: 'vocabulary', xpReward: 700,  maxProgress: 500, unit: 'واژه' },
  // ── games ──────────────────────────────────────────────────────────────
  { slug: 'games-5',         title: 'بازی‌باز',           description: '۵ بازی واژگان انجام بده',      icon: '🎮', color: 'from-indigo-400 to-violet-500',  rarity: 'common',    category: 'games',      xpReward: 100,  maxProgress: 5,   unit: 'بازی' },
  { slug: 'games-25',        title: 'قهرمان بازی',        description: '۲۵ بازی واژگان انجام بده',     icon: '🕹️', color: 'from-fuchsia-400 to-purple-600', rarity: 'epic',      category: 'games',      xpReward: 400,  maxProgress: 25,  unit: 'بازی' },
  // ── level ──────────────────────────────────────────────────────────────
  { slug: 'level-10',        title: 'تازه‌کار ارشد',      description: 'به سطح ۱۰ برس',                icon: '⭐', color: 'from-amber-400 to-yellow-600',   rarity: 'common',    category: 'level',      xpReward: 150,  maxProgress: 10,  unit: 'سطح' },
  { slug: 'level-30',        title: 'ستاره بوکزی',        description: 'به سطح ۳۰ برس',                icon: '✨', color: 'from-gold-400 to-amber-600',     rarity: 'epic',      category: 'level',      xpReward: 500,  maxProgress: 30,  unit: 'سطح' },
  { slug: 'level-50',        title: 'کهکشانی',            description: 'به سطح ۵۰ برس',                icon: '💫', color: 'from-gold-400 to-orange-600',    rarity: 'legendary', category: 'level',      xpReward: 900,  maxProgress: 50,  unit: 'سطح' },
  { slug: 'level-99',        title: 'افسانه بوکزی',       description: 'به سطح ۹۹ برس',                icon: '🚀', color: 'from-rose-400 via-pink-500 to-fuchsia-600', rarity: 'legendary', category: 'level', xpReward: 1500, maxProgress: 99, unit: 'سطح' },
]

const KNOWN_IDS = new Set([
  'first-book', 'books-5', 'books-10-start', 'first-finish', 'books-finish-3',
  'books-finish-10', 'pages-100', 'pages-500', 'reader-10', 'streak-3',
  'streak-7', 'streak-30', 'streak-30-cur', 'vocab-50', 'vocab-200',
  'vocab-500', 'games-5', 'games-25', 'level-10', 'level-30', 'level-50',
  'level-99',
])

for (const [i, def] of DEFS.entries()) {
  if (!KNOWN_IDS.has(def.slug)) {
    console.warn(`⚠ ${def.slug} is not handled by progressFor() — progress will always be 0`)
  }
  await prisma.achievementDef.upsert({
    where: { slug: def.slug },
    update: { ...def, displayOrder: i + 1 },
    create: { ...def, displayOrder: i + 1 },
  })
}

console.log(`✓ seeded ${DEFS.length} achievement definitions`)
await prisma.$disconnect()
