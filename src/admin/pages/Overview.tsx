import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '../ui'
import { adminNav } from '../AdminLayout'

const about: Record<string, string> = {
  '/familias': 'Responsáveis, alunos e os vínculos entre eles.',
  '/planos': 'Plano contratado por família e acompanhamento manual de pagamentos.',
  '/aulas': 'Agenda, professor, disciplina e link do Google Meet.',
  '/relatorios': 'Relatórios de evolução e materiais de apoio por aluno.',
  '/configuracoes': 'Conta administrativa e ajustes do painel.',
}

export default function Overview() {
  return (
    <>
      <PageHeader title="Visão geral">Estrutura inicial do painel. Indicadores e listas aparecem aqui quando as áreas abaixo forem implementadas; nesta etapa nenhum dado é exibido.</PageHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {adminNav.filter(n => n.to !== '/').map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="glass-panel group flex flex-col rounded-2xl p-6 transition-colors hover:border-white/25">
            <div className="flex items-start justify-between">
              <Icon size={22} aria-hidden className="text-[#3b9ce2]" />
              <ArrowRight size={16} aria-hidden className="text-white/20 transition-colors group-hover:text-[#3b9ce2]" />
            </div>
            <h2 className="mt-5 text-lg">{label}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-graphite">{about[to]}</p>
            <p className="mt-auto pt-4 text-xs text-mute">Ainda não implementado</p>
          </Link>
        ))}
      </div>
    </>
  )
}
