'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
    generateInitials,
    generatePersianInitials,
    getInitialsColor,
    getPresetAvatarDescription,
    getPresetAvatarIds,
    hasPersianCharacters,
    type AvatarData,
} from '@/lib/utils/avatar-utils'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface AvatarSelectorProps {
    selected: AvatarData
    onSelect: (avatar: AvatarData) => void
    googlePhotoUrl?: string | null
    userName?: string
    label?: string
}

export function AvatarSelector({
    selected,
    onSelect,
    googlePhotoUrl,
    userName,
    label = 'انتخاب تصویر پروفایل',
}: AvatarSelectorProps) {
    const presetIds = getPresetAvatarIds()

    // Generate initials if name is provided
    const initials = userName
        ? hasPersianCharacters(userName)
            ? generatePersianInitials(userName)
            : generateInitials(userName)
        : null

    const initialsColor = userName ? getInitialsColor(userName) : '#D4AF37'

    const isSelected = (type: string, id?: number) => {
        if (type === 'preset') {
            return selected.type === 'preset' && selected.presetId === id
        }
        if (type === 'google') {
            return selected.type === 'google'
        }
        if (type === 'initials') {
            return selected.type === 'initials'
        }
        return false
    }

    return (
        <div className="space-y-4">
            <Label>{label}</Label>

            <div className="grid grid-cols-3 gap-4">
                {/* Preset Avatars */}
                {presetIds.map((id) => (
                    <motion.button
                        key={`preset-${id}`}
                        type="button"
                        onClick={() => onSelect({ type: 'preset', presetId: id })}
                        className={cn(
                            'relative aspect-square rounded-2xl border-2 transition-all overflow-hidden group',
                            isSelected('preset', id)
                                ? 'border-gold shadow-lg shadow-gold/30 scale-105'
                                : 'border-border hover:border-gold/50 hover:scale-105'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/avatars/preset-${id}.svg`}
                            alt={`آواتار ${id}`}
                            className="w-full h-full object-cover"
                        />

                        {/* Selected Checkmark */}
                        {isSelected('preset', id) && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/40"
                            >
                                <div className="flex size-12 items-center justify-center rounded-full bg-gold">
                                    <Check className="size-6 text-white" />
                                </div>
                            </motion.div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <span className="text-xs text-white font-medium">
                                {getPresetAvatarDescription(id)}
                            </span>
                        </div>
                    </motion.button>
                ))}

                {/* Google Photo Option */}
                {googlePhotoUrl && (
                    <motion.button
                        type="button"
                        onClick={() =>
                            onSelect({ type: 'google', customUrl: googlePhotoUrl })
                        }
                        className={cn(
                            'relative aspect-square rounded-2xl border-2 transition-all overflow-hidden group',
                            isSelected('google')
                                ? 'border-gold shadow-lg shadow-gold/30 scale-105'
                                : 'border-border hover:border-gold/50 hover:scale-105'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={googlePhotoUrl}
                            alt="عکس Google"
                            className="w-full h-full object-cover"
                        />

                        {/* Selected Checkmark */}
                        {isSelected('google') && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/40"
                            >
                                <div className="flex size-12 items-center justify-center rounded-full bg-gold">
                                    <Check className="size-6 text-white" />
                                </div>
                            </motion.div>
                        )}

                        {/* Google Badge */}
                        <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                            <svg className="size-4" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <span className="text-xs text-white font-medium">
                                عکس Google
                            </span>
                        </div>
                    </motion.button>
                )}

                {/* Initials Option */}
                {initials && (
                    <motion.button
                        type="button"
                        onClick={() =>
                            onSelect({ type: 'initials', initials, name: userName })
                        }
                        className={cn(
                            'relative aspect-square rounded-2xl border-2 transition-all overflow-hidden group',
                            isSelected('initials')
                                ? 'border-gold shadow-lg shadow-gold/30 scale-105'
                                : 'border-border hover:border-gold/50 hover:scale-105'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ backgroundColor: initialsColor }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">
                                {initials}
                            </span>
                        </div>

                        {/* Selected Checkmark */}
                        {isSelected('initials') && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/40"
                            >
                                <div className="flex size-12 items-center justify-center rounded-full bg-gold">
                                    <Check className="size-6 text-white" />
                                </div>
                            </motion.div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <span className="text-xs text-white font-medium">
                                حروف اول نام
                            </span>
                        </div>
                    </motion.button>
                )}
            </div>

            {/* Preview */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="relative size-16 rounded-full overflow-hidden border-2 border-gold">
                    {selected.type === 'preset' && selected.presetId && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={`/avatars/preset-${selected.presetId}.svg`}
                            alt="پیش‌نمایش"
                            className="w-full h-full object-cover"
                        />
                    )}
                    {selected.type === 'google' && selected.customUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={selected.customUrl}
                            alt="پیش‌نمایش"
                            className="w-full h-full object-cover"
                        />
                    )}
                    {selected.type === 'initials' && initials && (
                        <div
                            className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white"
                            style={{ backgroundColor: initialsColor }}
                        >
                            {initials}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium">پیش‌نمایش تصویر پروفایل</p>
                    <p className="text-xs text-muted-foreground">
                        این تصویر در پروفایل شما نمایش داده می‌شود
                    </p>
                </div>
            </div>
        </div>
    )
}
