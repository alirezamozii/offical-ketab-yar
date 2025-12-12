import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'مدیریت کلیدهای AI | پنل مدیریت | کتاب‌یار',
    description: 'مدیریت کلیدهای API جمینی',
}

export const dynamic = 'force-dynamic'

export default function AdminAIKeysPage() {
    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">مدیریت کلیدهای هوش مصنوعی</h1>
                <p className="text-muted-foreground">
                    مدیریت کلیدهای API جمینی، چرخش خودکار و ردیابی استفاده
                </p>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">🔑 راهنمای کلیدهای API</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• کلیدهای API جمینی را از Google AI Studio دریافت کنید</li>
                        <li>• سیستم به صورت خودکار بین کلیدها چرخش می‌کند</li>
                        <li>• در صورت خطا، کلید بعدی استفاده می‌شود</li>
                        <li>• حداقل 2 کلید برای قابلیت اطمینان بالا توصیه می‌شود</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>کلیدهای فعال</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-4">این بخش در حال توسعه است</p>
                        <p className="text-sm">
                            برای مدیریت کلیدهای API، آن‌ها را در فایل .env.local اضافه کنید:
                        </p>
                        <code className="block mt-4 p-4 bg-muted rounded-lg text-left" dir="ltr">
                            GEMINI_API_KEY_1=your_key_here<br />
                            GEMINI_API_KEY_2=your_key_here<br />
                            GEMINI_API_KEY_3=your_key_here
                        </code>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
