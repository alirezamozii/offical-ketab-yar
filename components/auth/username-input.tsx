'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUsernameValidation } from '@/hooks/use-username-validation'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UsernameInputProps {
    value: string
    onChange: (value: string) => void
    onValidationChange?: (isValid: boolean) => void
    label?: string
    required?: boolean
    autoFocus?: boolean
}

export function UsernameInput({
    value,
    onChange,
    onValidationChange,
    label = 'نام کاربری',
    required = true,
    autoFocus = false,
}: UsernameInputProps) {
    const [touched, setTouched] = useState(false)
    const validation = useUsernameValidation(value, 500)

    // Notify parent of validation state
    useEffect(() => {
        if (onValidationChange) {
            onValidationChange(validation.isValid)
        }
    }, [validation.isValid, onValidationChange])

    // Show validation only after user has typed
    const showValidation = touched && value.length > 0

    return (
        <div className="space-y-2">
            <Label htmlFor="username">
                {label}
                {required && <span className="text-destructive mr-1">*</span>}
            </Label>

            <div className="relative">
                <User className="absolute right-3 top-3.5 size-4 text-muted-foreground" />

                <Input
                    id="username"
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const newValue = e.target.value.toLowerCase()
                        onChange(newValue)
                        if (!touched) setTouched(true)
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="username_123"
                    className={cn(
                        'pr-10 pl-10 h-12 border-2 transition-all',
                        showValidation && validation.isValid && 'border-green-500 focus:border-green-500',
                        showValidation && validation.error && 'border-destructive focus:border-destructive'
                    )}
                    dir="ltr"
                    autoFocus={autoFocus}
                    required={required}
                />

                {/* Validation Icon */}
                <div className="absolute left-3 top-3.5">
                    <AnimatePresence mode="wait">
                        {showValidation && validation.isChecking && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </motion.div>
                        )}

                        {showValidation && !validation.isChecking && validation.isValid && (
                            <motion.div
                                key="valid"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Check className="size-4 text-green-500" />
                            </motion.div>
                        )}

                        {showValidation && !validation.isChecking && validation.error && (
                            <motion.div
                                key="invalid"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <X className="size-4 text-destructive" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Helper Text */}
            <AnimatePresence mode="wait">
                {!showValidation && (
                    <motion.p
                        key="helper"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xs text-muted-foreground"
                    >
                        ۳ تا ۲۰ کاراکتر، فقط حروف انگلیسی، اعداد و _
                    </motion.p>
                )}

                {showValidation && validation.isValid && (
                    <motion.p
                        key="success"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xs text-green-600 dark:text-green-500"
                    >
                        ✓ این نام کاربری در دسترس است
                    </motion.p>
                )}

                {showValidation && validation.error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                    >
                        <p className="text-xs text-destructive">
                            {validation.error}
                        </p>

                        {/* Suggestions */}
                        {validation.suggestions.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">پیشنهادات:</p>
                                <div className="flex flex-wrap gap-2">
                                    {validation.suggestions.map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => onChange(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
