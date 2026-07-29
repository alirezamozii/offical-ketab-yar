const fs = require('fs');
const path = require('path');

const pages = [
  { p: 'src/app/stats/page.tsx', url: '/stats', title: 'آمار مطالعه', desc: 'آمار و گزارش‌های دقیق از پیشرفت مطالعه شما در کتاب‌یار.' },
  { p: 'src/app/goals/page.tsx', url: '/goals', title: 'اهداف', desc: 'اهداف روزانه، هفتگی و ماهانه مطالعه خود را تنظیم و پیگیری کنید.' },
  { p: 'src/app/achievements/page.tsx', url: '/achievements', title: 'دستاوردها', desc: 'نشان‌ها و دستاوردهای کسب‌شده در کتاب‌یار.' },
  { p: 'src/app/profile/page.tsx', url: '/profile', title: 'پروفایل', desc: 'پروفایل کاربری شما در کتاب‌یار.' },
  { p: 'src/app/settings/page.tsx', url: '/settings', title: 'تنظیمات', desc: 'تنظیمات حساب کاربری و ترجیحات مطالعه در کتاب‌یار.' },
  { p: 'src/app/vocabulary/page.tsx', url: '/vocabulary', title: 'واژگان', desc: 'کلمات ذخیره‌شده و جعبه لایتنر شما در کتاب‌یار.' },
  { p: 'src/app/vocabulary/game/page.tsx', url: '/vocabulary/game', title: 'بازی فلش‌کارت', desc: 'تمرین واژگان انگلیسی با بازی فلش‌کارت در کتاب‌یار.' },
  { p: 'src/app/vocabulary/listen/page.tsx', url: '/vocabulary/listen', title: 'تمرین شنیداری', desc: 'بهبود مهارت شنیداری واژگان انگلیسی در کتاب‌یار.' },
  { p: 'src/app/vocabulary/match/page.tsx', url: '/vocabulary/match', title: 'بازی تطبیق واژگان', desc: 'بازی تطبیق کلمات انگلیسی و معنی فارسی در کتاب‌یار.' },
  { p: 'src/app/vocabulary/practice/page.tsx', url: '/vocabulary/practice', title: 'تمرین لایتنر', desc: 'مرور کلمات ذخیره‌شده با سیستم لایتنر در کتاب‌یار.' },
  { p: 'src/app/vocabulary/sentence/page.tsx', url: '/vocabulary/sentence', title: 'تمرین جمله‌سازی', desc: 'تمرین واژگان در قالب جملات انگلیسی در کتاب‌یار.' },
  { p: 'src/app/vocabulary/spell/page.tsx', url: '/vocabulary/spell', title: 'تمرین املا', desc: 'بازی املا و هجی واژگان انگلیسی در کتاب‌یار.' },
  { p: 'src/app/search/page.tsx', url: '/search', title: 'جستجو', desc: 'جستجوی پیشرفته کتاب‌ها، نویسندگان و مقالات در کتاب‌یار.' },
  { p: 'src/app/collections/page.tsx', url: '/collections', title: 'کالکشن‌ها', desc: 'فهرست کتاب‌ها و کالکشن‌های دسته‌بندی‌شده در کتاب‌یار.' },
];

for (const page of pages) {
  const fullPath = path.join(__dirname, page.p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if it already has metadata
    if (!content.includes('export const metadata')) {
      // Add metadata at the top
      const imports = `import type { Metadata } from 'next'\nimport { SITE } from '@/lib/site'\n\n`;
      let metaBlock = `export const metadata: Metadata = {\n  title: '${page.title}',\n  description: '${page.desc}',\n  alternates: { canonical: \`\${SITE.url}${page.url}\` },\n`;
      
      // If it's a private page, add noindex
      if (['/stats', '/goals', '/achievements', '/profile', '/settings', '/vocabulary'].includes(page.url)) {
        metaBlock += `  robots: {\n    index: false,\n    follow: false,\n  },\n`;
      }
      metaBlock += `}\n\n`;
      
      // Insert after last import
      const importRegex = /import .* from '.*'\n/g;
      let lastMatch = null;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastMatch = match;
      }
      
      if (lastMatch) {
        const insertPos = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, insertPos) + '\n' + imports + metaBlock + content.slice(insertPos);
      } else {
        content = imports + metaBlock + content;
      }
    } else {
      // It has metadata, just make sure description and alternates are there
      if (!content.includes('description:')) {
         content = content.replace(/export const metadata.*?\{/, `export const metadata: Metadata = {\n  description: '${page.desc}',`);
      }
      if (!content.includes('alternates:')) {
         content = content.replace(/export const metadata.*?\{/, `export const metadata: Metadata = {\n  alternates: { canonical: \`\${SITE.url}${page.url}\` },`);
      }
      if (!content.includes('@/lib/site')) {
        content = `import { SITE } from '@/lib/site'\n` + content;
      }
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${page.p}`);
  }
}
