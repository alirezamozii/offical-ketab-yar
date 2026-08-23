import { SITE } from '@/lib/site'
import { Cookie } from 'lucide-react'
import type { Metadata } from 'next'
import {
  LegalPageShell,
  P,
  Ul,
  Li,
  Callout,
  ContactLine,
} from '@/components/legal/legal-page-shell'

export const metadata: Metadata = {
  title: 'سیاست کوکی — کتاب‌یار',
  description:
    'کتاب‌یار از چه کوکی‌هایی استفاده می‌کند: کوکی‌های ضروری (نشست ورود)، ترجیحات کاربری، و سرویس‌های شخص ثالث. نحوه مدیریت و پاک‌کردن کوکی‌ها.',
  keywords: [
    'سیاست کوکی کتاب‌یار',
    'cookie policy',
    'مدیریت کوکی',
    'Google OAuth cookies',
    'essential cookies',
  ],
  alternates: { canonical: `${SITE.url}/cookies` },
  openGraph: {
    type: 'article',
    locale: 'fa_IR',
    url: `${SITE.url}/cookies`,
    title: 'سیاست کوکی — کتاب‌یار',
    description:
      'انواع کوکی‌های استفاده‌شده در کتاب‌یار و نحوه مدیریت یا پاک‌کردن آن‌ها.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Cookie%20Policy&subtitle=Ketab-Yar',
        width: 1200,
        height: 630,
        alt: 'سیاست کوکی کتاب‌یار',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function CookiesPage() {
  return (
    <LegalPageShell
      icon={Cookie}
      title="سیاست کوکی"
      subtitle="این سند توضیح می‌دهد کتاب‌یار از چه کوکی‌ها و فناوری‌های مشابهی استفاده می‌کند و چگونه می‌توانید آن‌ها را مدیریت کنید."
      lastUpdated="۲۲ تیر ۱۴۰۴"
      footerCta={<ContactLine email={SITE.email} />}
      sections={[
        {
          id: 'what-are-cookies',
          title: 'کوکی چیست؟',
          body: (
            <>
              <P>
                کوکی (Cookie) یک فایل متنی کوچک است که وب‌سایت‌ها در مرورگر شما
                ذخیره می‌کنند تا اطلاعات بین صفحات یا نشست‌ها را حفظ کنند. کوکی‌ها
                به وب‌سایت‌ها کمک می‌کنند شما را به‌خاطر بسپارند و تجربه بهتری
                ارائه دهند.
              </P>
              <P>
                علاوه بر کوکی‌ها، کتاب‌یار از فناوری‌های ذخیره‌سازی محلی مشابه
                (localStorage، IndexedDB) نیز استفاده می‌کند که رفتار مشابهی دارند
                ولی به‌جای سرور، روی دستگاه شما باقی می‌مانند.
              </P>
            </>
          ),
        },
        {
          id: 'types',
          title: 'انواع کوکی‌های کتاب‌یار',
          body: (
            <>
              <P>کتاب‌یار از سه دسته کوکی استفاده می‌کند:</P>
              <Ul>
                <Li>
                  <strong>کوکی‌های ضروری:</strong> برای کارکرد پایه‌ی سایت مانند
                  حفظ نشست ورود و امنیت. بدون این کوکی‌ها، خدمات اصلی کار
                  نمی‌کنند.
                </Li>
                <Li>
                  <strong>کوکی‌های ترجیحات:</strong> تنظیمات کاربری شما (تم، فونت،
                  زبان، اندازه متن صفحه‌خوان) را ذخیره می‌کنند تا در بازدید بعدی
                  حفظ شوند.
                </Li>
                <Li>
                  <strong>کوکی‌های تحلیلی/عملکردی:</strong> برای درک نحوه استفاده
                  کاربران از سایت و بهبود آن. این کوکی‌ها فقط به‌صورت تجمیعی و
                  بدون شناسه‌ی شخصی جمع‌آوری می‌شوند.
                </Li>
              </Ul>
              <Callout>
                کتاب‌یار از کوکی‌های تبلیغاتی شخص ثالث استفاده نمی‌کند و داده‌های
                شما را برای تبلیغات هدفمند به اشخاص ثالث نمی‌فروشد.
              </Callout>
            </>
          ),
        },
        {
          id: 'specific-cookies',
          title: 'فهرست کوکی‌های اصلی',
          body: (
            <>
              <P>
                جدول زیر کوکی‌های اصلی استفاده‌شده در کتاب‌یار را نشان می‌دهد:
              </P>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-right">
                    <tr>
                      <th className="px-3 py-2 font-semibold">نام / دسته</th>
                      <th className="px-3 py-2 font-semibold">هدف</th>
                      <th className="px-3 py-2 font-semibold">مدت نگهداری</th>
                      <th className="px-3 py-2 font-semibold">نوع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="px-3 py-2" dir="ltr">
                        next-auth.session-token
                      </td>
                      <td className="px-3 py-2">حفظ نشست ورود کاربر</td>
                      <td className="px-3 py-2">تا خروج یا منقضی شدن</td>
                      <td className="px-3 py-2">ضروری</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2" dir="ltr">
                        next-auth.csrf-token
                      </td>
                      <td className="px-3 py-2">محافظت در برابر CSRF</td>
                      <td className="px-3 py-2">نشست</td>
                      <td className="px-3 py-2">ضروری</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2" dir="ltr">
                        theme
                      </td>
                      <td className="px-3 py-2">ترجیح تم (روشن/تاریک)</td>
                      <td className="px-3 py-2">طولانی</td>
                      <td className="px-3 py-2">ترجیحات</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2" dir="ltr">
                        guest_id
                      </td>
                      <td className="px-3 py-2">
                        شناسه کاربر مهمان برای پیشرفت آفلاین
                      </td>
                      <td className="px-3 py-2">طولانی</td>
                      <td className="px-3 py-2">ضروری</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2" dir="ltr">
                        reader-settings
                      </td>
                      <td className="px-3 py-2">
                        تنظیمات صفحه‌خوان (فونت، اندازه، حاشیه)
                      </td>
                      <td className="px-3 py-2">طولانی</td>
                      <td className="px-3 py-2">ترجیحات</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs leading-6 text-muted-foreground">
                فهرست بالا ممکن است ناقص باشد و کوکی‌های جدید با اطلاع‌رسانی
                قبلی اضافه شوند.
              </p>
            </>
          ),
        },
        {
          id: 'third-party',
          title: 'کوکی‌های شخص ثالث',
          body: (
            <>
              <P>
                وقتی با حساب گوگل وارد می‌شوید، گوگل ممکن است کوکی‌های خاص خود را
                برای احراز هویت و امنیت روی مرورگر شما قرار دهد. این کوکی‌ها توسط
                گوگل مدیریت می‌شوند و{' '}
                <a
                  href="https://policies.google.com/technologies/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="font-medium text-gold-700 underline-offset-4 hover:underline dark:text-gold-300"
                >
                  سیاست کوکی گوگل
                </a>{' '}
                بر آن‌ها حاکم است.
              </P>
              <P>
                کتاب‌یار از شبکه‌های تبلیغاتی یا پلتفرم‌های تحلیلی شخص ثالث که
                کوکی‌های ردیابی بین سایتی ایجاد می‌کنند (مانند Google Analytics با
                شناسه کاربر) استفاده نمی‌کند.
              </P>
            </>
          ),
        },
        {
          id: 'managing',
          title: 'مدیریت و پاک‌کردن کوکی‌ها',
          body: (
            <>
              <P>
                شما کنترل کامل روی کوکی‌ها دارید. می‌توانید از راه‌های زیر آن‌ها
                را مدیریت کنید:
              </P>
              <Ul>
                <Li>
                  <strong>تنظیمات مرورگر:</strong> اکثر مرورگر‌ها اجازه می‌دهند
                  کوکی‌ها را مشاهده، مسدود یا حذف کنید. معمولاً از مسیر «Settings
                  → Privacy → Cookies» قابل دسترسی است.
                </Li>
                <Li>
                  <strong>حالت ناشناس (Incognito):</strong> در حالت ناشناس، کوکی‌ها
                  پس از بستن پنجره پاک می‌شوند.
                </Li>
                <Li>
                  <strong>پاک‌کردن داده‌های سایت:</strong> می‌توانید فقط داده‌های
                  کتاب‌یار را از تنظیمات سایت در مرورگر پاک کنید.
                </Li>
              </Ul>
              <Callout tone="warning">
                اگر کوکی‌های ضروری را مسدود کنید، ممکن است نتوانید وارد حساب
                شوید یا پیشرفت مطالعه ذخیره شود.
              </Callout>
            </>
          ),
        },
        {
          id: 'changes',
          title: 'تغییرات سیاست کوکی',
          body: (
            <P>
              ممکن است با معرفی ویژگی‌های جدید، فهرست کوکی‌ها را به‌روزرسانی
              کنیم. تغییرات در همین صفحه منتشر می‌شوند و تاریخ «آخرین بروزرسانی»
              به‌روز می‌شود.
            </P>
          ),
        },
        {
          id: 'contact',
          title: 'تماس',
          body: (
            <>
              <P>سوال درباره کوکی‌ها دارید؟ با ما در ارتباط باشید:</P>
              <Ul>
                <Li>
                  ایمیل:{' '}
                  <a
                    href={`mailto:${SITE.email}`}
                    dir="ltr"
                    className="font-medium text-gold-700 underline-offset-4 hover:underline dark:text-gold-300"
                  >
                    {SITE.email}
                  </a>
                </Li>
              </Ul>
            </>
          ),
        },
      ]}
    />
  )
}
