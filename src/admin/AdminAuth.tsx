import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabaseAdmin, isSupabaseConfigured } from './supabaseAdmin'

export type AdminStatus = 'not-configured' | 'loading' | 'signed-out' | 'forbidden' | 'error' | 'ready'
interface Ctx {
  status: AdminStatus
  email: string | null
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  recheck: () => void
}
const AdminAuthContext = createContext<Ctx | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminStatus>(isSupabaseConfigured ? 'loading' : 'not-configured')
  const [session, setSession] = useState<Session | null>(null)
  const [booted, setBooted] = useState(false)
  const [tick, setTick] = useState(0)
  const [check, setCheck] = useState(0)

  useEffect(() => {
    if (!supabaseAdmin) return
    let alive = true
    let authEventReceived = false
    setBooted(false)
    setStatus('loading')
    const accept = (s: Session | null) => {
      if (!alive) return
      setStatus(s ? 'loading' : 'signed-out')
      setSession(s)
      setBooted(true)
      setCheck(n => n + 1)
    }
    // Sem chamadas assíncronas Supabase dentro do callback de autenticação.
    const { data: sub } = supabaseAdmin.auth.onAuthStateChange((_event, s) => {
      authEventReceived = true
      accept(s)
    })
    supabaseAdmin.auth.getSession().then(({ data, error }) => {
      if (!alive || authEventReceived) return
      if (error) { setSession(null); setStatus('error'); return }
      accept(data.session)
    }).catch(() => { if (alive && !authEventReceived) setStatus('error') })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [tick])

  useEffect(() => {
    if (!supabaseAdmin || !booted) return
    if (!session) { setStatus('signed-out'); return }
    let alive = true
    setStatus('loading')
    supabaseAdmin.rpc('is_admin').then(({ data, error }) => {
      if (alive) setStatus(error ? 'error' : data === true ? 'ready' : 'forbidden')
    }, () => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [session, booted, check])

  // Revalidar ao voltar à aba: a permissão pode ter sido revogada no banco.
  useEffect(() => {
    const onFocus = () => {
      if (session) { setStatus('loading'); setCheck(n => n + 1) }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [session])

  const value: Ctx = {
    status,
    email: session?.user.email ?? null,
    async signIn(email, password) {
      if (!supabaseAdmin) return 'Autenticação não configurada.'
      try {
        const { error } = await supabaseAdmin.auth.signInWithPassword({ email: email.trim(), password })
        if (!error) return null
        return error.status === 400 ? 'Não foi possível entrar. Confira e-mail, senha e a confirmação da conta.'
          : 'Não foi possível conectar. Aguarde um momento e tente novamente.'
      } catch {
        return 'Falha de conexão. Verifique sua internet e tente novamente.'
      }
    },
    async signOut() {
      setStatus('loading')
      try {
        const result = await supabaseAdmin?.auth.signOut({ scope: 'local' })
        if (result?.error) { setStatus('error'); return }
        setSession(null)
        setStatus('signed-out')
      } catch { setStatus('error') }
    },
    recheck: () => { setStatus('loading'); setTick(n => n + 1) },
  }
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth fora do AdminAuthProvider')
  return ctx
}
