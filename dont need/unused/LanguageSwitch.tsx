'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguageStore, type LanguageMode } from '@/stores/useLanguageStore'
import { motion } from 'framer-motion'
import { Languages } from 'lucide-react'

const languageModes: { value: LanguageMode; label: string; description: string }[] = [
    { value: 'EN', label: 'English Only', description: 'انگلیسی فقط' },
    { value: 'FA', label: 'Persian Only', description: 'فارسی فقط' },
    { value: 'EN_FA', label: 'English + Persian', description: 'انگلیسی (بزرگ) + فارسی (کوچک)' },
    { value: 'FA_EN', label: 'Persian + English', description: 'فارسی (بزرگ) + انگلیسی (کوچک)' },
]

export function LanguageSwitch() {
    const { mode, setMode } = useLanguageStore()

    const currentMode = languageModes.find((m) => m.value === mode)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-gold-500/30 hover:border-gold-500 hover:bg-gold-500/10"
                >
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentMode?.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                {languageModes.map((langMode) => (
                    <DropdownMenuItem
                        key={langMode.value}
                        onClick={() => setMode(langMode.value)}
                        className={`cursor-pointer ${mode === langMode.value ? 'bg-gold-500/10 text-gold-700 dark:text-gold-400' : ''
                            }`}
                    >
                        <motion.div
                            initial={false}
                            animate={{ scale: mode === langMode.value ? 1.05 : 1 }}
                            className="flex flex-col gap-1 w-full"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{langMode.label}</span>
                                {mode === langMode.value && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-gold-600"
                                    >
                                        ✓
                                    </motion.span>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">{langMode.description}</span>
                        </motion.div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
