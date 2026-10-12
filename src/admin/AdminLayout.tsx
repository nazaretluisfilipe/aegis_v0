import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, CreditCard, CalendarDays, FileText, Settings, LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { useAdminAuth } from './AdminAuth'
import { Brand, btnGhost } from './ui'

export const adminNav: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/familias', label: 'Responsáveis e alunos', icon: Users },
  { to: '/professores', label: 'Professores', icon: Users },
  { to: '/planos', label: 'Planos e saldos', icon: CreditCard },
  { to: '/aulas', label: 'Aulas', icon: CalendarDays },
  { to: '/relatorios', label: 'Relatórios e materiais', icon: FileText },
  { to: '/interessados', label: 'Interessados', icon: Users },
  { to: '/site', label: 'Editor do site', icon: FileText },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout() {
  const { email, signOut } = useAdminAuth()
  const [open, setOpen] = useState(false)

  const links = (
    <nav aria-label="Painel administrativo" className="flex flex-col gap-1">
      {adminNav.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${isActive ? 'bg-[#2F7BFF]/15 text-white ring-1 ring-[#3b9ce2]/40' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>
          <Icon size={18} aria-hidden className="shrink-0 text-[#3b9ce2]" />{label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-black text-white lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-line bg-[#04070f] lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-5 py-6"><Brand compact /></div>
        <div className="flex-1 overflow-y-auto px-3">{links}</div>
        <div className="border-t border-line p-4">
          <p className="truncate text-xs text-mute" title={email ?? ''}>{email}</p>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sm text-white/60 hover:text-white"><LogOut size={16} aria-hidden />Sair</button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-black/85 px-4 backdrop-blur lg:hidden">
          <Brand compact />
          <button className="rounded-full p-2" aria-expanded={open} aria-controls="admin-menu" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </header>
        {open && (
          <div id="admin-menu" className="border-b border-line bg-[#04070f] p-3 lg:hidden">
            {links}
            <div className="mt-3 flex items-center justify-between border-t border-line px-2 pt-3">
              <span className="truncate text-xs text-mute">{email}</span>
              <button onClick={signOut} className={btnGhost + ' !px-4 !py-2'}><LogOut size={14} aria-hidden />Sair</button>
            </div>
          </div>
        )}
        <main id="conteudo-admin" className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12"><Outlet /></main>
      </div>
    </div>
  )
}
