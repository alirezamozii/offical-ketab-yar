import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface EmailValidationResult {
    isChecking: boolean
    isAvailable: boolean
    error: string | null
}

export function useEmailValidation(email: string, debounceMs: number = 500): EmailValidationResult {
    const [isChecking, setIsChecking] = useState(false)
    const [isAvailable, setIsAvailable] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Reset state if email is empty
        if (!email) {
            setIsChecking(false)
            setIsAvailable(false)
            setError(null)
            return
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setIsChecking(false)
            setIsAvailable(false)
            setError(null)
            return
        }

        // Debounce the check
        setIsChecking(true)
        const timer = setTimeout(async () => {
            try {
                const supabase = createClient()

                // Check if email exists in profiles table
                const { data, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .ilike('email', email.toLowerCase())
                    .maybeSingle()

                if (checkError && checkError.code !== 'PGRST116') {
                    // PGRST116 means no rows returned, which is fine
                    console.error('Error checking email:', checkError)
                    setError(null) // Don't show error, just assume available
                    setIsAvailable(true)
                } else if (data) {
                    // Email already exists
                    setError('این ایمیل قبلاً ثبت شده است')
                    setIsAvailable(false)
                } else {
                    // Email is available
                    setError(null)
                    setIsAvailable(true)
                }
            } catch (err) {
                console.error('Error validating email:', err)
                // Don't show error for network issues, just assume available
                setError(null)
                setIsAvailable(true)
            } finally {
                setIsChecking(false)
            }
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [email, debounceMs])

    return {
        isChecking,
        isAvailable,
        error,
    }
}
