"use client"

import { createContext, useContext, useEffect, useState } from "react"

import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

interface RegistrationData {
  email: string
  password: string
  fullName: string
  username: string
  birthDate: Date | null
  birthDateJalali: string
  gender?: 'male' | 'female' | 'prefer_not_to_say'
  avatar: {
    type: 'preset' | 'google' | 'custom' | 'initials'
    presetId?: number
    customUrl?: string
    initials?: string
  }
  referralCode?: string
  marketingConsent: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: Error | null
  signUp: (data: RegistrationData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          throw error
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error getting session:", error)
        setError(error instanceof Error ? error : new Error("Unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up auth state change listener:", error)
      setError(error instanceof Error ? error : new Error("Unknown error occurred"))
      setIsLoading(false)
      return () => { }
    }
  }, [supabase.auth])

  const signUp = async (registrationData: RegistrationData): Promise<void> => {
    setIsLoading(true)
    try {
      // Create auth user with email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: registrationData.fullName,
            username: registrationData.username,
          }
        }
      })

      if (error) {
        throw error
      }

      // If user is created, update profile with all data
      if (data.user) {
        try {
          const profileData: any = {
            id: data.user.id,
            full_name: registrationData.fullName,
            username: registrationData.username,
            first_name: registrationData.fullName.split(' ')[0],
            last_name: registrationData.fullName.split(' ').slice(1).join(' ') || null,
            birth_date: registrationData.birthDate,
            birth_date_jalali: registrationData.birthDateJalali || null,
            gender: registrationData.gender || null,
            avatar_type: registrationData.avatar.type,
            avatar_preset_id: registrationData.avatar.presetId || null,
            avatar_custom_url: registrationData.avatar.customUrl || null,
            referral_code: registrationData.referralCode || null,
            marketing_consent: registrationData.marketingConsent,
            registration_completed: true,
            registration_step: 3,
            registration_completed_at: new Date().toISOString(),
          }

          await supabase
            .from('profiles')
            .upsert(profileData)
            .eq('id', data.user.id)
        } catch (updateError) {
          console.error("Error updating profile:", updateError)
          // Don't throw - user is created, just profile update failed
        }
      }

      router.push(`/auth/verify?email=${encodeURIComponent(registrationData.email)}`)
    } catch (error) {
      console.error("Error signing up:", error)
      throw error instanceof Error ? error : new Error("Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        throw error
      }
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in:", error)
      throw error instanceof Error ? error : new Error("Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error instanceof Error ? error : new Error("Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error instanceof Error ? error : new Error("Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      throw error instanceof Error ? error : new Error("Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSupabaseAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within an AuthProvider")
  }
  return context
}
