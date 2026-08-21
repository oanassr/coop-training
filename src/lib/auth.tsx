import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase, isConfigured } from './supabase'
import { Profile } from './types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', uid)
      .maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      await loadProfile(s?.user?.id)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { error: translateAuthError(error.message) }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    await loadProfile(session?.user?.id)
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, configured: isConfigured, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'بيانات الدخول غير صحيحة'
  if (m.includes('email not confirmed')) return 'لم يتم تفعيل الحساب بعد. يرجى فتح رابط التفعيل من بريدك'
  if (m.includes('rate limit')) return 'محاولات كثيرة، حاول لاحقاً'
  return msg
}
