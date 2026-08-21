import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'
import { Settings } from './types'
import { useAuth } from './auth'

interface SettingsCtx {
  settings: Settings | null
  refresh: () => Promise<void>
}
const Ctx = createContext<SettingsCtx>({ settings: null, refresh: async () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)

  const refresh = useCallback(async () => {
    if (!isConfigured) return
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
    if (data) setSettings(data as Settings)
  }, [])

  useEffect(() => {
    if (session) refresh()
  }, [session, refresh])

  return <Ctx.Provider value={{ settings, refresh }}>{children}</Ctx.Provider>
}

export const useSettings = () => useContext(Ctx)
