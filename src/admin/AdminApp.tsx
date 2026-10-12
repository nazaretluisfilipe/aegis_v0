import { useEffect, useState, type FormEvent } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2, Lock, Mail } from 'lucide-react'
import { AdminAuthProvider, useAdminAuth } from './AdminAuth'
import { missingEnv } from './supabaseAdmin'
import AdminLayout from './AdminLayout'
import { Gate, btn, btnGhost } from './ui'
import Overview from './pages/Overview'
import Families from './pages/Families'
import Plans from './pages/Plans'
import Lessons from './pages/Lessons'
import Reports from './pages/Reports'
import Teachers from './pages/Teachers'
import TeacherAvailability from './pages/TeacherAvailability'
import AdminHistory from './pages/AdminHistory'
import DemoLab from './pages/DemoLab'
import SiteEditor from './pages/SiteEditor'
import Leads from './pages/Leads'
import SettingsPage from './pages/SettingsPage'

const field = 'w-full rounded-xl border border-line bg-white/[0.04] py-3 pl-10 pr-4 text-white outline-none placeholder:text-white/30 focus:border-accent'

function Login() {
  const { signIn } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const message = await signIn(email, password)
      if (message) setErr(message)
    } catch {
      setErr('Não foi possível conectar. Tente novamente.')
    } finally { setBusy(false) }
  }
  return (
    <Gate title="Entrar no painel">
      <p>Acesso restrito à equipe da Aégis Educational.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative"><Mail size={18} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input type="email" required autoComplete="username" aria-label="E-mail" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={field} /></div>
        <div className="relative"><Lock size={18} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input type="password" required autoComplete="current-password" aria-label="Senha" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className={field} /></div>
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={busy} className={btn + ' w-full'}>{busy ? <><Loader2 size={16} className="animate-spin" aria-hidden />Entrando</> : 'Entrar'}</button>
      </form>
    </Gate>
  )
}

function Guard() {
  const { status, email, signOut, recheck } = useAdminAuth()
  switch (status) {
    case 'not-configured':
      return (
        <Gate title="Painel bloqueado: autenticação não configurada">
          <p>O painel só abre com login real do Supabase Auth, e o Supabase ainda não está configurado neste ambiente. Enquanto isso, nenhum acesso administrativo é liberado.</p>
          <div>
            <p className="text-sm font-medium text-white">Variáveis que faltam</p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-[#3b9ce2]">{missingEnv.map(v => <li key={v}>{v}</li>)}</ul>
          </div>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>Crie o projeto no Supabase e rode <code className="text-white">supabase/migrations/0001_admin.sql</code> (SQL Editor).</li>
            <li>Cadastre as variáveis acima no <code className="text-white">.env.local</code> e na hospedagem, e refaça o build.</li>
            <li>Crie o primeiro administrador (passo a passo no README, seção “Painel administrativo”).</li>
          </ol>
        </Gate>
      )
    case 'loading':
      return <main className="flex min-h-screen items-center justify-center bg-black text-white/60" role="status"><Loader2 className="mr-2 animate-spin" size={18} aria-hidden />Verificando acesso…</main>
    case 'signed-out':
      return <Login />
    case 'forbidden':
      return (
        <Gate title="Acesso restrito">
          <p>A conta <b className="text-white">{email}</b> não tem permissão de administrador.</p>
          <button onClick={signOut} className={btnGhost}>Sair</button>
        </Gate>
      )
    case 'error':
      return (
        <Gate title="Não foi possível verificar a permissão">
          <p>Por segurança, o acesso permanece bloqueado. Confirme que a migration <code className="text-white">0001_admin.sql</code> foi aplicada (a função <code className="text-white">is_admin()</code> precisa existir) e tente de novo.</p>
          <div className="flex gap-3"><button onClick={recheck} className={btn}>Tentar de novo</button><button onClick={signOut} className={btnGhost}>Sair</button></div>
        </Gate>
      )
    case 'ready':
      return (
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="familias" element={<Families />} />
            <Route path="planos" element={<Plans />} />
            <Route path="interessados" element={<Leads />} />
            <Route path="site" element={<SiteEditor />} />
            <Route path="professores" element={<Teachers />} />
            <Route path="disponibilidade" element={<TeacherAvailability />} />
            <Route path="historico" element={<AdminHistory />} />
            <Route path="laboratorio" element={<DemoLab />} />
            <Route path="aulas" element={<Lessons />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )
  }
}

export default function AdminApp() {
  // Área restrita: não indexar e título próprio.
  useEffect(() => {
    document.title = 'Painel | Aégis Educational'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => { m.remove() }
  }, [])
  return (
    <BrowserRouter basename="/admin">
      <AdminAuthProvider><Guard /></AdminAuthProvider>
    </BrowserRouter>
  )
}
