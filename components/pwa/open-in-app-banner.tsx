/**
 * Open in App Banner
 * Shows when user has PWA installed but is browsing in browser
 * Prompts them to open the installed app instead
 */

'use client'

import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Smartphone, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OpenInAppBanner() {
    const [showBanner, setShowBanner] = useState(false)
    const [appUrl, setAppUrl] = useState('')

    useEffect(() => {
        // Check if user dismissed banner
        const dismissed = sessionStorage.getItem('open-in-app-dismissed')
        if (dismissed) return

        // Check if PWA is installed but user is in browser
        const isInBrowser =
            !window.matchMedia('(display-mode: standalone)').matches &&
            !(window.navigator as { standalone?: boolean }).standalone

        // Check if PWA was previously installed (we store this on first install)
        const wasInstalled = localStorage.getItem('pwa-was-installed')

        if (isInBrowser && wasInstalled === 'true') {
            // User has app installed but is browsing in browser
            setAppUrl(window.location.href)

            // Show banner after 2 seconds
            setTimeout(() => {
                setShowBanner(true)
            }, 2000)
        }

        // If currently in standalone mode, mark as installed
        if (!isInBrowser) {
            localStorage.setItem('pwa-was-installed', 'true')
        }
    }, [])

    const handleOpenInApp = () => {
        // Try to open in app using custom protocol or deep link
        // For PWAs, we can use the same URL
        window.location.href = appUrl
        setShowBanner(false)
    }

    const handleDismiss = () => {
        setShowBanner(false)
        sessionStorage.setItem('open-in-app-dismissed', 'true')
    }

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 text-white shadow-lg"
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Icon & Message */}
                            <div className="flex items-center gap-3 flex-1">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    <Smartphone className="h-6 w-6" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm md:text-base">
                                        اپلیکیشن کتاب‌یار را نصب کرده‌اید!
                                    </p>
                                    <p className="text-xs md:text-sm opacity-90">
                                        برای تجربه بهتر، در اپلیکیشن باز کنید
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleOpenInApp}
                                    size="sm"
                                    className="bg-white text-gold-600 hover:bg-white/90 font-semibold"
                                >
                                    <ExternalLink className="h-4 w-4 ml-1" />
                                    باز کردن
                                </Button>
                                <button
                                    onClick={handleDismiss}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                    aria-label="بستن"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
