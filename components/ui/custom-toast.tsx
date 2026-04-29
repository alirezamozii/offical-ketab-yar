'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'

type ToastType = 'success' | 'error' | 'info'

interface CustomToastProps {
    message: string
    type?: ToastType
    description?: string
}

function showToast({ message, type = 'success', description }: CustomToastProps) {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        error: <XCircle className="h-5 w-5 text-red-600" />,
        info: <Info className="h-5 w-5 text-blue-600" />
    }

    const bgColors = {
        success: 'from-green-50 to-emerald-50 border-green-200',
        error: 'from-red-50 to-rose-50 border-red-200',
        info: 'from-blue-50 to-cyan-50 border-blue-200'
    }

    sonnerToast.custom((t) => (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
                "w-full max-w-md p-4 rounded-xl shadow-lg border-2 backdrop-blur-sm",
                "bg-gradient-to-br",
                bgColors[type]
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {icons[type]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {message}
                    </p>
                    {description && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    ), {
        duration: 3000,
    })
}

// Convenience methods
export const toast = {
    success: (message: string, description?: string) =>
        showToast({ message, type: 'success', description }),
    error: (message: string, description?: string) =>
        showToast({ message, type: 'error', description }),
    info: (message: string, description?: string) =>
        showToast({ message, type: 'info', description }),
}
