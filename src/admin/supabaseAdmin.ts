import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined))?.trim()

/** Variáveis que faltam para o painel funcionar (mostradas na tela de "não configurado"). */
export const missingEnv = [
  !url && 'VITE_SUPABASE_URL',
  !anonKey && 'VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY legado)',
].filter(Boolean) as string[]

export const isSupabaseConfigured = missingEnv.length === 0

/** Cliente só existe se houver credenciais. Sem elas, o painel inteiro permanece bloqueado (fail closed). */
export const supabaseAdmin: SupabaseClient | null =
  isSupabaseConfigured ? createClient(url!, anonKey!, {
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000),
      }),
    },
  }) : null
