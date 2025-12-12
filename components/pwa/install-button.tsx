/**
 * PWA Install Button for Header
 * Shows "Download App" button that triggers PWA installation
 */

'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { motion } from 'framer-motion'
import { Check, Download, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function InstallButton() {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall()
    const [showDialog, setShowDialog] = useState(false)

    const handleInstall = async () => {
        console.log('Install button clicked', { isInstallable, isInstalled })

        if (isInstalled) {
            toast.success('اپلیکیشن قبلاً نصب شده است! ✅')
            return
        }

        if (isInstallable) {
            console.log('Triggering install prompt...')
            const success = await promptInstall()
            if (success) {
                toast.success('اپلیکیشن با موفقیت نصب شد! 🎉')
                // Mark that PWA was installed
                localStorage.setItem('pwa-was-installed', 'true')
            } else {
                console.log('Install prompt dismissed or failed')
                toast.info('نصب لغو شد')
            }
        } else {
            // Not installable yet - show instructions
            console.log('Not installable, showing instructions')
            toast.info('راهنمای نصب را مشاهده کنید')
            setShowDialog(true)
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Desktop version */}
                <Button
                    onClick={handleInstall}
                    variant="outline"
                    size="sm"
                    className="hidden md:flex items-center gap-2 border-gold/30 hover:bg-gold/10 hover:border-gold/50 transition-all group"
                >
                    {isInstalled ? (
                        <>
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="font-medium">نصب شده</span>
                        </>
                    ) : (
                        <>
                            <motion.div
                                animate={{
                                    y: [0, -2, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <Download className="h-4 w-4 text-gold group-hover:text-gold" />
                            </motion.div>
                            <span className="font-medium">دانلود اپلیکیشن</span>
                        </>
                    )}
                </Button>

                {/* Mobile version - Icon only */}
                <Button
                    onClick={handleInstall}
                    variant="ghost"
                    size="icon"
                    className="md:hidden relative"
                >
                    {isInstalled ? (
                        <Check className="h-5 w-5 text-green-500" />
                    ) : (
                        <>
                            <motion.div
                                animate={{
                                    y: [0, -2, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <Smartphone className="h-5 w-5 text-gold" />
                            </motion.div>
                            {/* Pulse indicator */}
                            {!isInstalled && (
                                <span className="absolute top-1 right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                                </span>
                            )}
                        </>
                    )}
                </Button>
            </motion.div>

            {/* Install Instructions Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl">
                            نصب اپلیکیشن کتاب‌یار
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            برای نصب اپلیکیشن، مراحل زیر را دنبال کنید
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Chrome/Edge Desktop */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-gold" />
                                کامپیوتر (Chrome/Edge)
                            </h4>
                            <ol className="space-y-2 text-sm text-muted-foreground pr-6">
                                <li className="list-decimal">
                                    روی آیکون <strong>نصب</strong> در نوار آدرس کلیک کنید
                                </li>
                                <li className="list-decimal">یا از منوی مرورگر گزینه "نصب کتاب‌یار" را انتخاب کنید</li>
                            </ol>
                        </div>

                        {/* Mobile Safari */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-gold" />
                                آیفون (Safari)
                            </h4>
                            <ol className="space-y-2 text-sm text-muted-foreground pr-6">
                                <li className="list-decimal">
                                    روی دکمه <strong>اشتراک‌گذاری</strong> (مربع با فلش) کلیک کنید
                                </li>
                                <li className="list-decimal">
                                    گزینه "Add to Home Screen" را انتخاب کنید
                                </li>
                            </ol>
                        </div>

                        {/* Mobile Chrome/Android */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-gold" />
                                اندروید (Chrome)
                            </h4>
                            <ol className="space-y-2 text-sm text-muted-foreground pr-6">
                                <li className="list-decimal">روی منوی سه نقطه کلیک کنید</li>
                                <li className="list-decimal">
                                    گزینه "نصب اپلیکیشن" یا "Add to Home screen" را انتخاب کنید
                                </li>
                            </ol>
                        </div>

                        {/* Benefits */}
                        <div className="bg-gold/5 rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-sm">مزایای نصب اپلیکیشن:</h4>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    دسترسی سریع از صفحه اصلی
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    خواندن آفلاین کتاب‌های دانلود شده
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    تجربه اپلیکیشن واقعی بدون مرورگر
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    اعلان‌های هوشمند (به زودی)
                                </li>
                            </ul>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
