'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { BookOpen, Crown, Lock, Sparkles, Star, Zap } from 'lucide-react'
import Link from 'next/link'

interface PremiumPaywallProps {
    bookTitle: string
    currentPage: number
    freePages: number
    onClose?: () => void
}

export function PremiumPaywall({
    bookTitle,
    freePages,
    onClose,
}: PremiumPaywallProps) {
    const benefits = [
        {
            icon: BookOpen,
            title: 'دسترسی نامحدود',
            description: 'به بیش از 1000 کتاب انگلیسی',
        },
        {
            icon: Sparkles,
            title: 'هوش مصنوعی',
            description: 'چت با Gemini برای یادگیری بهتر',
        },
        {
            icon: Zap,
            title: 'واژگان نامحدود',
            description: 'ذخیره و مرور واژگان بدون محدودیت',
        },
        {
            icon: Star,
            title: 'دانلود آفلاین',
            description: 'مطالعه بدون اینترنت',
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative max-w-2xl w-full mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border-2 border-[#D4AF37] shadow-2xl overflow-hidden"
            >
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] via-[#C9A961] to-[#B8956A] animate-pulse" />
                </div>

                {/* Content */}
                <div className="relative p-8 md:p-12">
                    {/* Lock Icon */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                        }}
                        className="flex justify-center mb-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl opacity-50" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8956A] rounded-full flex items-center justify-center shadow-2xl">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-white">
                        محتوای پریمیوم 👑
                    </h2>

                    <p className="text-center text-gray-300 mb-2 text-lg">
                        شما {freePages} صفحه رایگان از <span className="font-bold text-[#D4AF37]">{bookTitle}</span> را خواندید
                    </p>

                    <p className="text-center text-gray-400 mb-8">
                        برای ادامه مطالعه و دسترسی به تمام امکانات، به پریمیوم ارتقا دهید
                    </p>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-[#D4AF37]/50 transition-all"
                            >
                                <benefit.icon className="w-8 h-8 text-[#D4AF37] mb-3" />
                                <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                                <p className="text-sm text-gray-400">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pricing Highlight */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-[#D4AF37]/20 to-[#C9A961]/20 rounded-2xl p-6 mb-6 border-2 border-[#D4AF37]/50 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Crown className="w-6 h-6 text-[#D4AF37]" />
                            <span className="text-sm text-gray-300">پیشنهاد ویژه</span>
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">
                            ۹۹,۰۰۰ تومان
                        </div>
                        <div className="text-gray-400 text-sm">ماهانه - لغو هر زمان</div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            asChild
                            className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:from-[#C9A961] hover:to-[#B8956A] text-white shadow-lg shadow-[#D4AF37]/30 h-14 text-lg font-semibold"
                        >
                            <Link href="/subscription">
                                <Crown className="w-5 h-5 ml-2" />
                                ارتقا به پریمیوم
                            </Link>
                        </Button>

                        {onClose && (
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 border-2 border-gray-600 text-gray-300 hover:bg-gray-800 h-14 text-lg"
                            >
                                بازگشت
                            </Button>
                        )}
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                <span>بدون تعهد</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-[#D4AF37]" />
                                <span>لغو آسان</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-[#D4AF37]" />
                                <span>پشتیبانی 24/7</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
