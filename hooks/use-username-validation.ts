import { useCallback, useEffect, useState } from 'react'

interface UsernameValidationResult {
    isValid: boolean
    isAvailable: boolean | null
    isChecking: boolean
    error: string | null
    suggestions: string[]
}

/**
 * Hook for real-time username validation
 * Checks format and availability with debouncing
 */
export function useUsernameValidation(username: string, debounceMs: number = 500) {
    const [result, setResult] = useState<UsernameValidationResult>({
        isValid: false,
        isAvailable: null,
        isChecking: false,
        error: null,
        suggestions: [],
    })

    const validateUsername = useCallback(async (value: string) => {
        // Reset state
        if (!value || value.trim() === '') {
            setResult({
                isValid: false,
                isAvailable: null,
                isChecking: false,
                error: null,
                suggestions: [],
            })
            return
        }

        const cleanValue = value.toLowerCase().trim()

        // Format validation
        const usernameRegex = /^[a-z0-9_]{3,20}$/
        if (!usernameRegex.test(cleanValue)) {
            setResult({
                isValid: false,
                isAvailable: null,
                isChecking: false,
                error: 'نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، اعداد و _ باشد',
                suggestions: [],
            })
            return
        }

        // Check availability
        setResult(prev => ({ ...prev, isChecking: true, error: null }))

        try {
            const response = await fetch('/api/check-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanValue }),
            })

            const data = await response.json()

            if (!response.ok) {
                setResult({
                    isValid: false,
                    isAvailable: false,
                    isChecking: false,
                    error: data.error || 'خطا در بررسی نام کاربری',
                    suggestions: [],
                })
                return
            }

            setResult({
                isValid: data.available,
                isAvailable: data.available,
                isChecking: false,
                error: data.available ? null : 'این نام کاربری قبلاً گرفته شده است',
                suggestions: data.suggestions || [],
            })
        } catch (error) {
            console.error('Error validating username:', error)
            setResult({
                isValid: false,
                isAvailable: null,
                isChecking: false,
                error: 'خطا در اتصال به سرور',
                suggestions: [],
            })
        }
    }, [])

    // Debounced validation
    useEffect(() => {
        const timer = setTimeout(() => {
            validateUsername(username)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [username, debounceMs, validateUsername])

    return result
}
