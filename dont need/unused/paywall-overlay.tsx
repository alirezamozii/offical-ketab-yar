'use client'

/**
 * Paywall Overlay - Agent 3 (Psychology)
 * FOMO-based upgrade prompt when free pages run out
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { BookOpen, Heart, Lock, Sparkles, Trophy, Zap } from 'lucide-react'
import Link from 'next/link'

interface PaywallOverlayProps {
    bookTitle: string
    currentPage: number
    freePages: number
    onClose?: () => void
}

export function PaywallOverlay({
    bookTitle,
    currentPage,
    freePages,
    onClose
}: PaywallOverlayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-2xl w-full"
            >
                <Card className="border-2 border-[#D4AF37] bg-gradient-to-br from-background via-[#D4AF37]/5 to-background">
                    <CardContent className="p-8 space-y-6">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <motion.div
                                animate={{
                                    rotate: [0, -10, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 2
                                }}
                                className="rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A961] p-6"
                            >
                                <Lock className="h-12 w-12 text-white" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold">
                                پیش‌نمایش رایگان به پایان رسید
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                شما {freePages} صفحه اول «{bookTitle}» را خواندید
                            </p>
                        </div>

                        {/* Features - Agent 3: Show value, not punishment */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="rounded-full bg-[#D4AF37]/20 p-2">
                                    <BookOpen className="h-5 w-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="font-semibold">بیش از 1000 کتاب کامل</p>
                                    <p className="text-sm text-muted-foreground">
                                        دسترسی نامحدود به تمام کتاب‌ها
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="rounded-full bg-[#D4AF37]/20 p-2">
                                    <Heart className="h-5 w-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="font-semibold">واژگان نامحدود</p>
                                    <p className="text-sm text-muted-foreground">
                                        ذخیره و تمرین کلمات بدون محدودیت
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="rounded-full bg-[#D4AF37]/20 p-2">
                                    <Zap className="h-5 w-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="font-semibold">XP دوبرابر</p>
                                    <p className="text-sm text-muted-foreground">
                                        سریع‌تر سطح بالا بیا و در لیگ پیشرفت کن
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                                <div className="rounded-full bg-[#D4AF37]/20 p-2">
                                    <Trophy className="h-5 w-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="font-semibold">نشان‌های ویژه</p>
                                    <p className="text-sm text-muted-foreground">
                                        دسترسی به نشان‌ها و جوایز اختصاصی
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Badge - Agent 3: Anchor pricing */}
                        <div className="text-center">
                            <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-white text-lg px-6 py-2">
                                <Sparkles className="ml-2 h-4 w-4" />
                                فقط 99,000 تومان در ماه
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">
                                کمتر از قیمت یک فنجان قهوه در روز!
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex gap-3">
                            <Link href="/subscription" className="flex-1">
                                <Button
                                    className="w-full h-12 text-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:from-[#C9A961] hover:to-[#B8956A]"
                                >
                                    <Sparkles className="ml-2 h-5 w-5" />
                                    ارتقا به پرمیوم
                                </Button>
                            </Link>

                            {onClose && (
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="px-6"
                                >
                                    بازگشت
                                </Button>
                            )}
                        </div>

                        {/* Social Proof - Agent 3: FOMO */}
                        <p className="text-center text-sm text-muted-foreground">
                            🔥 بیش از 10,000 کاربر از اشتراک پرمیوم استفاده می‌کنند
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
