/**
 * PWA Install Prompt Component
 * Agent 3 (Psychology) - Encourage app installation with attractive UI
 */

'use client'

import { Button } from '@/components/ui/button'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Smartphone, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function InstallPrompt() {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall()
    const [isDismissed, setIsDismissed] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // Check if user previously dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (dismissed) {
            setIsDismissed(true)
            return
        }

        // Show prompt after 5 seconds if installable (faster for better UX)
        if (isInstallable && !isInstalled) {
            const timer = setTimeout(() => {
                setShowPrompt(true)
            }, 5000) // 5 seconds (was 30)

            return () => clearTimeout(timer)
        }
    }, [isInstallable, isInstalled])

    const handleInstall = async () => {
        const success = await promptInstall()
        if (success) {
            setShowPrompt(false)
            // Mark that PWA was installed
            localStorage.setItem('pwa-was-installed', 'true')
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        setIsDismissed(true)
        localStorage.setItem('pwa-install-dismissed', 'true')
    }

    if (!isInstallable || isInstalled || isDismissed) return null

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
                >
                    <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-gold/5 p-6 shadow-2xl backdrop-blur-sm">
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute right-2 top-2 rounded-full p-1 hover:bg-gold/10 transition-colors"
                            aria-label="بستن"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Icon */}
                        <div className="mb-4 flex justify-center">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="rounded-full bg-gold/20 p-4"
                            >
                                <Smartphone className="h-8 w-8 text-gold" />
                            </motion.div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3 text-center">
                            <h3 className="text-lg font-bold">نصب اپلیکیشن کتاب‌یار</h3>
                            <p className="text-sm text-muted-foreground">
                                برای دسترسی سریع‌تر و خواندن آفلاین، کتاب‌یار را روی دستگاه خود نصب
                                کنید
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 text-right text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    <span>دسترسی سریع از صفحه اصلی</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    <span>خواندن آفلاین کتاب‌های دانلود شده</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-gold">✓</span>
                                    <span>تجربه اپلیکیشن واقعی</span>
                                </li>
                            </ul>

                            {/* Install button */}
                            <Button
                                onClick={handleInstall}
                                className="w-full"
                                size="lg"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                نصب اپلیکیشن
                            </Button>

                            <button
                                onClick={handleDismiss}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                شاید بعداً
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
