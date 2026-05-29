'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import {
    BookOpen,
    CreditCard,
    HelpCircle,
    MessageCircle,
    Search,
    Shield,
    Sparkles,
    Users,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

const categories = [
    {
        title: 'شروع کار',
        icon: Zap,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10',
        faqs: [
            {
                question: 'چگونه در کتاب‌یار ثبت‌نام کنم؟',
                answer: 'برای ثبت‌نام، روی دکمه "ورود / ثبت‌نام" در بالای صفحه کلیک کنید. می‌توانید با ایمیل یا حساب گوگل خود ثبت‌نام کنید. پس از ثبت‌نام، یک ایمیل تأیید برای شما ارسال می‌شود.'
            },
            {
                question: 'آیا استفاده از کتاب‌یار رایگان است؟',
                answer: 'بله! کتاب‌یار یک نسخه رایگان دارد که به شما امکان می‌دهد 1 روز به صورت پرمیوم از تمام امکانات استفاده کنید. برای دسترسی نامحدود، می‌توانید اشتراک پرمیوم تهیه کنید.'
            },
            {
                question: 'چگونه کتاب‌ها را پیدا کنم؟',
                answer: 'می‌توانید از بخش کتابخانه استفاده کنید و با فیلترهای مختلف مانند ژانر، زبان، و امتیاز، کتاب مورد نظر خود را پیدا کنید. همچنین می‌توانید از نوار جستجو استفاده کنید.'
            }
        ]
    },
    {
        title: 'خواندن کتاب',
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10',
        faqs: [
            {
                question: 'چگونه یک کتاب را بخوانم؟',
                answer: 'روی کتاب مورد نظر کلیک کنید و سپس دکمه "شروع خواندن" را بزنید. صفحه خواندن با امکانات پیشرفته مانند تنظیم فونت، اندازه متن، و حالت شب باز می‌شود.'
            },
            {
                question: 'چگونه صفحات را ورق بزنم؟',
                answer: 'می‌توانید با کلیک روی لبه‌های صفحه، استفاده از فلش‌های کیبورد، یا کشیدن صفحه (drag) آن را ورق بزنید. در موبایل، با سوایپ کردن صفحه را تغییر دهید.'
            },
            {
                question: 'چگونه متن را هایلایت کنم؟',
                answer: 'متن مورد نظر را انتخاب کنید. یک منوی کوچک ظاهر می‌شود که می‌توانید رنگ هایلایت را انتخاب کنید یا یادداشت اضافه کنید.'
            },
            {
                question: 'آیا می‌توانم کتاب را دانلود کنم؟',
                answer: 'در حال حاضر، کتاب‌ها فقط به صورت آنلاین قابل خواندن هستند. این ویژگی به زودی اضافه خواهد شد.'
            }
        ]
    },
    {
        title: 'هوش مصنوعی و یادگیری',
        icon: Sparkles,
        color: 'text-purple-600',
        bgColor: 'bg-purple-500/10',
        faqs: [
            {
                question: 'دستیار هوش مصنوعی چیست؟',
                answer: 'دستیار هوش مصنوعی کتاب‌یار با استفاده از Gemini 2.5 Flash، می‌تواند درباره کتابی که می‌خوانید با شما گفتگو کند، سوالات شما را پاسخ دهد، و به شما در یادگیری کمک کند.'
            },
            {
                question: 'چگونه از دستیار AI استفاده کنم؟',
                answer: 'در حین خواندن کتاب، روی آیکون چت در گوشه صفحه کلیک کنید. می‌توانید هر سوالی درباره کتاب، شخصیت‌ها، یا مفاهیم بپرسید.'
            },
            {
                question: 'چگونه لغات جدید را یاد بگیرم؟',
                answer: 'روی کلمه‌ای که نمی‌دانید کلیک کنید. تعریف، مثال، و تلفظ آن نمایش داده می‌شود. می‌توانید آن را به لیست واژگان خود اضافه کنید.'
            },
            {
                question: 'سیستم فلش کارت چگونه کار می‌کند؟',
                answer: 'تمام کلماتی که ذخیره می‌کنید، به صورت خودکار به فلش کارت تبدیل می‌شوند. سیستم ما از روش تکرار فاصله‌دار استفاده می‌کند تا یادگیری شما بهینه شود.'
            }
        ]
    },
    {
        title: 'اشتراک و پرداخت',
        icon: CreditCard,
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        faqs: [
            {
                question: 'چه پلن‌های اشتراکی وجود دارد؟',
                answer: 'ما پلن‌های مختلفی داریم: رایگان (1 روز پرمیوم)، 1 روزه، 1 ماهه، 3 ماهه، و 1 ساله. پلن سالانه بیشترین تخفیف را دارد.'
            },
            {
                question: 'چگونه اشتراک خریداری کنم؟',
                answer: 'به بخش "قیمت‌گذاری" بروید، پلن مورد نظر را انتخاب کنید، و پرداخت را تکمیل کنید. پس از پرداخت، اشتراک شما فوراً فعال می‌شود.'
            },
            {
                question: 'آیا می‌توانم اشتراک را لغو کنم؟',
                answer: 'بله، می‌توانید هر زمان از بخش تنظیمات حساب کاربری، اشتراک خود را لغو کنید. تا پایان دوره پرداخت شده، به امکانات دسترسی خواهید داشت.'
            },
            {
                question: 'روش‌های پرداخت چیست؟',
                answer: 'ما از کارت‌های بانکی ایرانی و درگاه‌های پرداخت معتبر پشتیبانی می‌کنیم. پرداخت کاملاً امن است.'
            }
        ]
    },
    {
        title: 'حساب کاربری',
        icon: Users,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
        faqs: [
            {
                question: 'چگونه پروفایل خود را ویرایش کنم؟',
                answer: 'به بخش "پروفایل" بروید و روی "ویرایش پروفایل" کلیک کنید. می‌توانید نام، عکس، و تنظیمات خود را تغییر دهید.'
            },
            {
                question: 'چگونه رمز عبور را تغییر دهم؟',
                answer: 'در بخش تنظیمات حساب کاربری، گزینه "تغییر رمز عبور" را انتخاب کنید. رمز فعلی و رمز جدید را وارد کنید.'
            },
            {
                question: 'رمز عبورم را فراموش کرده‌ام',
                answer: 'در صفحه ورود، روی "فراموشی رمز عبور" کلیک کنید. یک لینک بازیابی به ایمیل شما ارسال می‌شود.'
            }
        ]
    },
    {
        title: 'امنیت و حریم خصوصی',
        icon: Shield,
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
        faqs: [
            {
                question: 'اطلاعات من امن است؟',
                answer: 'بله، ما از بالاترین استانداردهای امنیتی استفاده می‌کنیم. تمام اطلاعات شما رمزنگاری شده و در سرورهای امن نگهداری می‌شود.'
            },
            {
                question: 'آیا اطلاعات من به اشتراک گذاشته می‌شود؟',
                answer: 'خیر، ما هرگز اطلاعات شخصی شما را بدون اجازه به اشتراک نمی‌گذاریم. لطفاً سیاست حریم خصوصی ما را مطالعه کنید.'
            }
        ]
    }
]

export function HelpClient() {
    const [searchQuery, setSearchQuery] = useState('')
    // ⚡ Bolt: Debounce the search query to avoid blocking the main thread while typing
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // ⚡ Bolt: Memoize the filtered categories array to avoid expensive recalculations on every render
    const filteredCategories = useMemo(() => {
        if (!debouncedSearchQuery) return categories

        return categories.map(category => ({
            ...category,
            faqs: category.faqs.filter(
                faq =>
                    faq.question.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            )
        })).filter(category => category.faqs.length > 0)
    }, [debouncedSearchQuery])

    // JSON-LD FAQPage Schema for SEO (Agent 1)
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: categories.flatMap(category =>
            category.faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer
                }
            }))
        )
    }

    const hasResults = filteredCategories.length > 0

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-20">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 mb-6">
                            <HelpCircle className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text text-transparent">
                            مرکز راهنمایی
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                            پاسخ سوالات خود را پیدا کنید یا با تیم پشتیبانی ما تماس بگیرید
                        </p>

                        {/* Search */}
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="جستجو در سوالات متداول..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-12 h-14 text-lg"
                                aria-label="جستجو در سوالات متداول"
                            />
                        </div>
                    </motion.div>

                    {/* FAQ Categories */}
                    <div className="max-w-5xl mx-auto space-y-8">
                        {!hasResults && searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-16"
                            >
                                <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                                    <Search className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">نتیجه‌ای یافت نشد</h3>
                                <p className="text-muted-foreground mb-6">
                                    متأسفانه هیچ سوالی با عبارت "{searchQuery}" پیدا نشد
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchQuery('')}
                                >
                                    پاک کردن جستجو
                                </Button>
                            </motion.div>
                        )}

                        {filteredCategories.map((category, index) => {
                            const Icon = category.icon
                            return (
                                <motion.div
                                    key={category.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-14 h-14 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                                                <Icon className={`h-7 w-7 ${category.color}`} />
                                            </div>
                                            <h2 className="text-2xl font-bold">{category.title}</h2>
                                        </div>

                                        <Accordion type="single" collapsible className="w-full">
                                            {category.faqs.map((faq, faqIndex) => (
                                                <AccordionItem key={faqIndex} value={`item-${faqIndex}`}>
                                                    <AccordionTrigger className="text-right hover:text-gold-600">
                                                        {faq.question}
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-muted-foreground leading-relaxed">
                                                        {faq.answer}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Contact Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 text-center"
                    >
                        <Card className="p-8 max-w-2xl mx-auto bg-gradient-to-br from-gold-500/10 to-gold-600/10 border-gold-500/20">
                            <MessageCircle className="h-12 w-12 text-gold-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">پاسخ خود را پیدا نکردید؟</h3>
                            <p className="text-muted-foreground mb-6">
                                تیم پشتیبانی ما آماده کمک به شماست
                            </p>
                            <Button
                                asChild
                                size="lg"
                                className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400"
                            >
                                <Link href="/support">
                                    تماس با پشتیبانی
                                </Link>
                            </Button>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    )
}
