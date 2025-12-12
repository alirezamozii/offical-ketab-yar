'use client'

import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            const supabase = createClient()

            try {
                // Check if user cancelled (error in URL params)
                const error = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')

                if (error) {
                    console.log('Auth error:', error, errorDescription)
                    // User cancelled or error occurred, redirect back to register
                    router.push('/auth/register')
                    return
                }

                // Get the session from the URL
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    throw sessionError
                }

                if (!session) {
                    // No session and no error means user cancelled
                    router.push('/auth/register')
                    return
                }

                // Check if user has completed profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('registration_completed, username')
                    .eq('id', session.user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 means no rows returned, which is fine for new users
                    throw profileError
                }

                // If profile doesn't exist or registration not completed, redirect to register step 2
                // This skips email/password and goes directly to username/profile/avatar steps
                if (!profile || !profile.registration_completed || !profile.username) {
                    router.push('/auth/register?step=2&google=true')
                    return
                }

                // Profile is complete, redirect to dashboard
                router.push('/dashboard')
            } catch (err) {
                console.error('Error in auth callback:', err)
                setError(err instanceof Error ? err.message : 'خطایی رخ داد')
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/auth/login')
                }, 3000)
            }
        }

        handleCallback()
    }, [router, searchParams])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="text-red-500 text-lg">{error}</div>
                    <div className="text-sm text-muted-foreground">
                        در حال انتقال به صفحه ورود...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <Loader2 className="size-12 animate-spin text-[#D4AF37] mx-auto" />
                <div className="text-lg font-semibold">در حال تکمیل ورود...</div>
                <div className="text-sm text-muted-foreground">
                    لطفاً صبر کنید
                </div>
            </div>
        </div>
    )
}
