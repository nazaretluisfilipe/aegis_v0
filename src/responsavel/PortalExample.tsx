import {useState} from 'react'
import {ArrowRight,BookOpen,CalendarDays,CheckCircle2,Clock3,FileText,GraduationCap,LockKeyhole,ShieldCheck} from 'lucide-react'
import {Brand,btn,btnGhost} from '../admin/ui'

type Lesson={id:number;subject:string;date:string;teacher:string;status:'completed'|'scheduled'|'cancelled';description:string}
const lessons:Lesson[]=[
 {id:1,subject:'Matemática',date:'10/10/2026, 15h',teacher:'Professor demonstrativo',status:'completed',description:'Frações e equações de 1º grau'},
 {id:2,subject:'Matemática',date:'15/10/2026, 15h',teacher:'Professor demonstrativo',status:'scheduled',description:'Revisão e exercícios de fixação'},
 {id:3,subject:'Física',date:'17/10/2026, 14h',teacher:'Professor demonstrativo',status:'cancelled',description:'Aula cancelada sem consumo de saldo'}
]
const statuses={completed:'Realizada',scheduled:'Agendada',cancelled:'Cancelada'}
const card='aegis-card glass-panel rounded-2xl border border-white/10 p-5 sm:p-6'
const pill='inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-200'

export default function PortalExample(){
 const [tab,setTab]=useState<'inicio'|'agenda'|'relatorios'>('inicio')
 return <main className="min-h-screen bg-black pb-16 text-white">
  <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur">
   <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
    <a href="/" aria-label="Aégis Educational, início"><Brand compact /></a>
    <a href="/responsavel" className={btnGhost+' shrink-0 !px-3 !py-2 sm:!px-4'}><LockKeyhole size={15} aria-hidden/><span className="sm:hidden">Portal real</span><span className="hidden sm:inline">Entrar de verdade</span></a>
   </div>
  </header>
  <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:space-y-7 sm:px-8 sm:py-10">
   <section className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 sm:px-5 sm:py-4" role="note">
    <div className="flex flex-wrap items-center gap-2">
     <span className={pill}>DEMONSTRAÇÃO FICTÍCIA</span>
     <strong className="text-sm font-medium text-amber-100">Exemplo ilustrativo, não é uma conta real.</strong>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-white/70 sm:text-sm">Estudantes, aulas e relatórios simulados, sem dados de clientes. Para testar o acesso autenticado, use o laboratório administrativo.</p>
   </section>
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#3b9ce2]">Área do responsável · Exemplo</p>
     <h1 className="mt-2 font-serif text-[clamp(1.7rem,7.2vw,2.25rem)] leading-tight sm:text-4xl">Bem-vinda ao acompanhamento, Júlia.</h1>
     <p className="mt-2 text-white/65">Uma visão clara das aulas, do saldo e do progresso de quem você acompanha.</p>
    </div>
   </div>
   <nav aria-label="Navegação da demonstração" className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[.03] p-1.5 sm:flex sm:gap-2 sm:p-2">
    {([['inicio','Visão geral','Resumo'],['agenda','Agenda e aulas','Aulas'],['relatorios','Acompanhamento','Relatórios']] as const).map(([id,label,short])=>
      <button key={id} type="button" aria-label={label} onClick={()=>setTab(id)}
       aria-pressed={tab===id} className={'aegis-tab min-h-11 min-w-0 rounded-xl px-1.5 py-2.5 text-xs font-medium sm:px-4 sm:py-3 sm:text-sm '+(tab===id?'bg-[#2F7BFF]/20 text-white ring-1 ring-[#2F7BFF]/50':'text-white/60 hover:bg-white/10 hover:text-white')}>
       <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span>
      </button>)}
   </nav>
   {tab==='inicio'&&<div className="aegis-tab-panel space-y-4">
    <section className="grid gap-4 sm:grid-cols-3">
     <div className={card}><GraduationCap size={22} className="text-[#3b9ce2]"/><p className="mt-4 text-sm text-white/60">Estudante acompanhado</p><b className="mt-1 block text-xl">Lucas Silva</b><p className="text-sm text-white/50">8º ano · exemplo</p></div>
     <div className={card}><BookOpen size={22} className="text-[#3b9ce2]"/><p className="mt-4 text-sm text-white/60">Saldo de aulas</p><b className="mt-1 block text-3xl">7 <span className="text-base font-normal text-white/60">de 8</span></b><p className="text-sm text-white/50">1 realizada · 1 agendada · 1 cancelada</p></div>
     <div className={card}><CalendarDays size={22} className="text-[#3b9ce2]"/><p className="mt-4 text-sm text-white/60">Próxima aula</p><b className="mt-1 block text-xl">15 de outubro</b><p className="text-sm text-white/50">Matemática · 15h</p></div>
    </section>
    <div className="grid gap-4 lg:grid-cols-2">
     <section className={card}><h2 className="text-xl">Seu plano de acompanhamento</h2><p className="mt-2 text-sm text-white/60">[TESTE — FICTÍCIO] Plano de 8 aulas individuais</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[12.5%] rounded-full bg-[#3b9ce2]"/></div>
      <p className="mt-3 text-sm text-white/70">1 aula concluída · 7 disponíveis</p>
      <button type="button" onClick={()=>setTab('agenda')} className="mt-5 text-sm text-blue-300 underline underline-offset-4">Ver agenda de exemplo</button>
     </section>
     <section className={card}><div className="flex items-center gap-2"><FileText size={19} className="text-[#3b9ce2]"/><h2 className="text-xl">Relatório mais recente</h2></div>
      <p className="mt-4 text-sm text-white/60">Matemática · Aula demonstrativa</p><h3 className="mt-1 text-lg">Revisão de frações e equações</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">Exemplo fictício de observações: boa participação nas atividades e necessidade de reforçar a simplificação de frações.</p>
      <button type="button" onClick={()=>setTab('relatorios')} className="mt-5 text-sm text-blue-300 underline underline-offset-4">Ler relatório de exemplo</button>
     </section>
    </div>
   </div>}
   {tab==='agenda'&&<section className="aegis-tab-panel space-y-4">
    <div><h2 className="font-serif text-2xl">Agenda e histórico de aulas</h2><p className="mt-2 text-sm text-white/60">Exemplos de aula agendada, realizada e cancelada.</p></div>
    {lessons.map(lesson=><article className={card} key={lesson.id}>
     <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-medium">{lesson.subject} · Lucas Silva</h3>
      <p className="mt-1 text-sm text-white/60">{lesson.date} · {lesson.teacher}</p></div>
      <span className="rounded-full border border-white/20 px-3 py-1 text-xs">{statuses[lesson.status]}</span>
     </div><p className="mt-4 text-sm text-white/65">{lesson.description}</p>
     {lesson.status==='scheduled'&&<p className="mt-3 flex items-center gap-2 text-xs text-amber-200"><Clock3 size={14}/> Link do Google Meet não disponível nesta simulação.</p>}
    </article>)}
   </section>}
   {tab==='relatorios'&&<section className="aegis-tab-panel space-y-4">
    <div><h2 className="font-serif text-2xl">Acompanhamento educacional</h2><p className="mt-2 text-sm text-white/60">Conteúdos e observações produzidos exclusivamente para ilustrar o formato do portal.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">
     <div className={card}><p className="text-sm text-white/60">Relatórios de exemplo</p><p className="mt-2 text-3xl font-semibold">1</p></div>
     <div className={card}><p className="text-sm text-white/60">Disciplina acompanhada</p><p className="mt-2 text-xl font-semibold">Matemática</p></div>
     <div className={card}><p className="text-sm text-white/60">Última aula</p><p className="mt-2 text-xl font-semibold">10/10/2026</p></div>
    </div>
    <article className={card}><div className="flex items-center gap-2 text-emerald-200"><CheckCircle2 size={18}/><span className="text-xs font-medium uppercase">Publicado — exemplo fictício</span></div>
     <h3 className="mt-3 text-xl">Relatório de Matemática · Lucas Silva</h3>
     {([['Conteúdos trabalhados','Frações equivalentes, operações com frações e equações de primeiro grau.'],['Atividades realizadas','Resolução guiada de exercícios e revisão de questões demonstrativas.'],['Pontos fortes','Participação nas atividades e atenção aos exemplos.'],['Dificuldades observadas','Simplificação de frações e organização das etapas do cálculo.'],['Evolução registrada','Exemplo ilustrativo de maior autonomia no início das atividades.'],['Recomendações','Revisar operações com frações, com exercícios de dificuldade progressiva.'],['Próximos passos','Consolidar frações e iniciar problemas envolvendo equações.']] as const).map(([label,description])=>
      <div className="mt-5 rounded-xl border border-white/10 p-4" key={label}><h4 className="text-sm font-semibold">{label}</h4><p className="mt-2 text-sm leading-relaxed text-white/65">{description}</p></div>)}
    </article>
   </section>}
   <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
    <div className="flex items-center gap-2 text-xs text-white/50"><ShieldCheck size={15}/> Demonstração pública, sem dados pessoais ou acesso a contas.</div>
    <a href="/" className="text-sm text-blue-300 underline underline-offset-4">Voltar ao site Aégis</a>
   </footer>
  </div>
 </main>
}
