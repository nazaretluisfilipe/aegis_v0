import {SiteContentProvider,useSiteContent} from './siteContent'
import { useState, type ReactNode } from 'react'
import { ArrowRight, Check, Loader2, Menu, MessageCircle, X, LogIn, Eye } from 'lucide-react'
import { site, messages, subjects, plans, singleLesson, brl } from './config'
import { wa, emptyLead, validate, submitLead, leadToWhatsApp, type Lead, type SubmitResult } from './lib'
import HeroGradient from './components/HeroGradient'

export const btn = 'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F7BFF] to-[#0A0A9E] px-6 py-3.5 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(47,123,255,0.4)] active:scale-95'
export const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10 backdrop-blur-sm'
const Wrap = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>
const Eyebrow = ({ children, light }: { children: ReactNode; light?: boolean }) => <p className={`text-xs font-medium uppercase tracking-[.2em] ${light ? 'text-white/50' : 'text-[#3b9ce2]'}`}>{children}</p>



/** Marca provisória, só tipografia. Para trocar pela logo definitiva: ponha /public/logo.svg e defina LOGO_SRC. */
const LOGO_SRC = ''
function Brand({ className = 'text-2xl' }: { className?: string }) {
  if (LOGO_SRC) return <img src={LOGO_SRC} alt={site.name} className="h-8 w-auto" />
  return <span className={`font-serif tracking-tight whitespace-nowrap ${className}`}>Aegis<span className="text-brass"> Educational</span></span>
}

export function Cta({ message, children, className = btn, icon = true }: { message: string; children: ReactNode; className?: string; icon?: boolean }) {
  const content=useSiteContent()
  const l = content.whatsapp ? {href:`https://wa.me/${content.whatsapp}?text=${encodeURIComponent(message)}`,external:true} : wa(message)
  return <a href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={className}>{children}{icon && <ArrowRight size={16} aria-hidden />}</a>
}

const nav: [string, string][] = [['Como funciona', '#como-funciona'], ['Disciplinas', '#disciplinas'], ['Planos', '#planos'], ['Dúvidas', '#duvidas'], ['Área do responsável', '/responsavel']]

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
      <Wrap className="flex h-16 items-center justify-between">
        <a href="/" aria-label="Aegis Educational, início"><Brand /></a>
        <nav aria-label="Principal" className="hidden items-center gap-4 xl:flex">
          {nav.map(([n, h]) => <a key={h} href={h} className="text-sm text-white/70 hover:text-[#3b9ce2] transition-colors">{n}</a>)}
<a href="/responsavel" className={btnGhost+' !px-4 !py-2.5'}><LogIn size={15} aria-hidden />Acessar portal</a>
          <a href="#diagnostico" className={btn + ' !py-2.5'}>Solicitar diagnóstico</a>
        </nav>
        <div className="flex items-center gap-2 xl:hidden"><a href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-[#3b9ce2]/50 bg-[#2F7BFF]/10 px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm"><LogIn size={16} aria-hidden/>Área do responsável</a><button className="rounded-full p-2 text-white" aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
      </Wrap>
      {open && <nav id="menu-mobile" aria-label="Menu móvel" className="border-t border-white/10 bg-black xl:hidden"><Wrap className="flex flex-col py-2">
        {nav.map(([n, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-serif text-lg text-white">{n}</a>)}
        <a href="#diagnostico" onClick={() => setOpen(false)} className={btn + ' my-5'}>Solicitar diagnóstico</a>
      </Wrap></nav>}
    </header>
  )
}

function Hero() {
  const content=useSiteContent()
  return (
    <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
      <HeroGradient />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,.7) 38%, rgba(0,0,0,.15) 75%, rgba(0,0,0,0) 100%), linear-gradient(180deg, rgba(0,0,0,.6) 0%, rgba(0,0,0,0) 25%), linear-gradient(0deg, #000 0%, rgba(0,0,0,0) 12%)' }} />
      <Wrap className="relative z-10 grid gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-20">
        <div>
          <Eyebrow>Aegis Educational · Acompanhamento de Elite</Eyebrow>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.1] sm:text-6xl lg:text-7xl font-bold">
            {content.heroTitle}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
            {content.heroDescription}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a href="#diagnostico" className={btn}>Solicitar diagnóstico gratuito <ArrowRight size={16} aria-hidden /></a>
            <a href="#planos" className={btnGhost}>Ver planos e valores</a>
            <a href="/responsavel" className={btnGhost}><LogIn size={17} aria-hidden />Sou responsável</a>
          </div>
          <p className="mt-6 text-sm text-white/40">Resposta personalizada via WhatsApp.</p>
          <a href="/responsavel/exemplo" className="mt-5 inline-flex items-center gap-2 text-sm text-[#8bbaff] underline underline-offset-4 hover:text-white"><Eye size={16} aria-hidden/>Conhecer a área do responsável — demonstração fictícia</a>
        </div>
        <aside className="glass-card rounded-2xl p-8 shadow-2xl sm:p-10">
          <p className="text-xs uppercase tracking-widest text-[#3b9ce2] font-bold">O Método Aégis</p>
          <ul className="mt-8 space-y-6">
            {[['Diagnóstico', 'Entendemos a série, a dificuldade e o objetivo antes de indicar o professor.'], ['Match de Perfil', 'A escolha parte do perfil do aluno, não da agenda livre.'], ['Foco Individual', 'Exclusividade total: só o aluno e o professor.'], ['Transparência Real', 'A família sabe exatamente o que foi trabalhado e o que vem a seguir.']].map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3b9ce2]/20 text-[#3b9ce2]"><Check size={14} aria-hidden /></span>
                <span><b className="font-serif text-xl text-white">{t}</b><span className="mt-1 block text-sm leading-relaxed text-white/60">{d}</span></span>
              </li>
            ))}
          </ul>
        </aside>
      </Wrap>
    </section>
  )
}

function Problem() {
  const items = [['Uma boa aula isolada não basta.', 'Sem continuidade, cada aula recomeça do zero e o progresso se perde entre uma semana e outra.'], ['Cada dificuldade pede um caminho.', 'Falta de base, insegurança em prova e pressa na interpretação não se resolvem do mesmo jeito.'], ['A família precisa enxergar o andamento.', 'Sem informação clara, decidir se vale continuar vira intuição.']]
  return (
    <section className="border-b border-line bg-[#04070f] py-20 sm:py-24"><Wrap className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
      <h2 className="text-4xl leading-tight sm:text-5xl lg:sticky lg:top-28 lg:self-start">Uma aula particular não resolve, sozinha, o problema do aluno.</h2>
      <ol className="divide-y divide-line">{items.map(([t, d]) => <li key={t} className="py-7 first:pt-0"><h3 className="text-2xl">{t}</h3><p className="mt-2 max-w-lg leading-relaxed text-graphite">{d}</p></li>)}</ol>
    </Wrap></section>
  )
}

function How() {
  const steps = [['Você nos conta', 'Preenche o diagnóstico (2 minutos) ou chama no WhatsApp.'], ['Conversamos', 'Entendemos o momento do aluno, a rotina e a urgência.'], ['Indicamos o professor', 'Escolha pelo perfil do aluno e pela disciplina.'], ['Definimos o plano', 'Frequência e formato combinados com a família.'], ['Começam as aulas', 'Individuais, por videochamada, com retorno ao responsável.']]
  return (
    <section id="como-funciona" className="bg-ink py-20 text-paper sm:py-24"><Wrap>
      <Eyebrow light>Da primeira conversa à primeira aula</Eyebrow>
      <h2 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">Você não compra uma aula. Contrata um acompanhamento.</h2>
      <ol className="relative mt-14 grid gap-8 lg:grid-cols-5 lg:gap-6">
        {steps.map(([t, d], i) => <li key={t} className="relative pl-14 lg:pl-0 lg:pt-14"><span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-brass/60 bg-ink font-serif text-lg text-brass">{i + 1}</span><h3 className="text-xl">{t}</h3><p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p></li>)}
      </ol>
      <a href="#diagnostico" className="mt-12 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink">Começar pelo diagnóstico <ArrowRight size={16} aria-hidden /></a>
    </Wrap></section>
  )
}

function Subjects() {
  const d: Record<string, string> = { 'Matemática': 'Do reforço de base à resolução de problemas mais exigentes.', 'Física': 'Conceito, modelagem e cálculo, sem decorar fórmulas soltas.', 'Química': 'Da leitura de enunciados ao raciocínio quantitativo.' }
  return (
    <section id="disciplinas" className="py-20 sm:py-24"><Wrap>
      <h2 className="max-w-3xl text-4xl leading-tight sm:text-5xl">Disciplinas</h2>
      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">{subjects.map(s => <div key={s} className="bg-[#070a14] p-8"><h3 className="text-2xl">{s}</h3><p className="mt-3 leading-relaxed text-graphite">{d[s]}</p></div>)}</div>
      <p className="mt-6 max-w-2xl text-sm text-mute">Outra disciplina? Conte no diagnóstico e verificamos se conseguimos atender.</p>
    </Wrap></section>
  )
}

function Teachers() {
  return (
    <section id="professores" className="border-y border-line bg-[#04070f] py-20 sm:py-24"><Wrap className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
      <h2 className="text-4xl leading-tight sm:text-5xl">Você não escolhe sozinho. Nós indicamos.</h2>
      <div className="space-y-4 text-lg leading-relaxed text-graphite">
        <p>A Aegis Educational seleciona o professor a partir do aluno: série, disciplina, dificuldade e objetivo. Não pela primeira agenda livre.</p>
        <p>Depois da conversa com a família, apresentamos o professor indicado antes da primeira aula.</p>
      </div>
    </Wrap></section>
  )
}

function Plans() {
  const content=useSiteContent()
  const list=content.plans
  if(!content.plansVisible||!list.length)return <section id="planos" className="py-20"><Wrap><h2 className="text-4xl">Um plano para o momento do aluno</h2><p className="my-5 text-graphite">Converse com a equipe para conhecer as opções e condições de acompanhamento.</p><Cta message={messages.general}>Consultar planos</Cta></Wrap></section>
  return (
    <section id="planos" className="py-20 sm:py-24"><Wrap>
      <Eyebrow>Planos mensais e aula avulsa</Eyebrow>
      <h2 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">Valores claros, aulas sempre individuais.</h2>
      <p className="mt-5 max-w-2xl text-lg text-graphite">Cada aula é só do aluno com o professor. As condições de cada plano são apresentadas abaixo.</p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {list.map(p => {
          const per = p.price / p.lessons
          const save = 0
          return (
            <article key={p.id} className={`relative flex flex-col rounded-sm border bg-white/[0.03] p-6 ${p.featured ? 'border-accent shadow-[0_24px_60px_-30px_rgba(47,123,255,.5)] lg:-mt-3 lg:pb-9' : 'border-line'}`}>
              {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-brass px-3 py-1 text-xs font-medium text-white">Ritmo semanal</span>}
              <h3 className="text-xl">{p.label}</h3>
              <p className="mt-4 font-serif text-3xl">{brl(p.price)}</p>
              <p className="text-xs text-mute">{p.lessons === 1 ? 'por aula' : `por mês · ${brl(per)} por aula`}</p>
              {p.lessons > 1 && save > 0.5 && <p className="mt-2 text-xs text-accent">{brl(save)} a menos que {p.lessons} aulas avulsas</p>}
              <p className="mt-4 flex-1 text-sm leading-relaxed text-graphite">{p.note}</p>
              <Cta message={p.lessons === 1 ? messages.single : messages.plan(p.label)} className={(p.featured ? btn : btnGhost) + ' mt-6 !px-4'} icon={false}>Quero este plano</Cta>
            </article>
          )
        })}
      </div>
      <p className="mt-6 text-sm text-mute">Valores informados pela Aegis Educational. Forma de pagamento e demais condições são combinadas na conversa, antes de qualquer cobrança.</p>
    </Wrap></section>
  )
}

const faq: [string, string][] = [
  ['Como é escolhido o professor?', 'Pelo perfil do aluno, pela disciplina e pelo objetivo, e não pela disponibilidade de agenda. Depois da conversa com a família, indicamos o professor.'],
  ['Como funciona o primeiro contato?', 'Você preenche o diagnóstico ou chama no WhatsApp. Nossa equipe conversa com o responsável para entender o caso antes de qualquer proposta.'],
  ['As aulas são individuais?', 'Sim. Cada aula é exclusiva do aluno com o professor.'],
  ['Como são as aulas?', 'As aulas são online, por videochamada.'],
  ['Preciso assinar algum contrato antes de conversar?', 'Não. O diagnóstico e a conversa inicial vêm antes de qualquer contratação.'],
  ['O que a Aegis Educational faz com os dados que eu informo?', 'Usamos apenas para entender o aluno e entrar em contato com você. Veja a Política de Privacidade.'],
]
function Faq() {
  const content=useSiteContent()
  if(!content.faqVisible)return null
  const faq=content.faq.map(f=>[f.question,f.answer])
  return (
    <section id="duvidas" className="border-t border-line bg-[#04070f] py-20 sm:py-24"><Wrap className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
      <h2 className="text-4xl leading-tight sm:text-5xl">Perguntas frequentes</h2>
      <div className="divide-y divide-line border-y border-line">{faq.map(([q, a]) => <details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">{q}<span aria-hidden className="text-2xl text-brass transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-xl leading-relaxed text-graphite">{a}</p></details>)}</div>
    </Wrap></section>
  )
}

const goals = ['Recuperar a base', 'Acompanhar o conteúdo da escola', 'Preparar para provas e vestibulares', 'Aprofundar o conhecimento']
const freqs = ['1 aula por semana', '2 aulas por semana', 'Aula avulsa', 'Ainda não sei']
const fieldCls = (err?: string) => `w-full rounded-md border bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-white/30 transition-colors focus:border-accent ${err ? 'border-red-500' : 'border-line'}`

function Field({ id, label, error, children, wide }: { id: string; label: string; error?: string; children: ReactNode; wide?: boolean }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>{children}{error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-red-400">{error}</p>}</div>
}

function LeadForm() {
  const content=useSiteContent()
  const hasWhatsApp=!!(content.whatsapp||site.whatsappNumber)
  const [v, setV] = useState<Lead>(emptyLead)
  const [touched, setTouched] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | SubmitResult>('idle')
  const errs = touched ? validate(v) : {}
  const set = <K extends keyof Lead>(k: K, val: Lead[K]) => setV(p => ({ ...p, [k]: val }))
  const inp = (k: keyof Lead & string) => ({ id: k, value: v[k] as string, onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), 'aria-invalid': !!errs[k], 'aria-describedby': errs[k] ? `${k}-err` : undefined })
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setTouched(true)
    if (Object.keys(validate(v)).length) return
    setState('sending'); setState(await submitLead(v))
  }
  const msg = leadToWhatsApp(v)
  if (state === 'sent' || state === 'not-configured' || state === 'error') {
    const ok = state === 'sent'
    return (
      <div role="status" className="self-start rounded-sm border border-line bg-white/[0.03] p-8">
        <h3 className="text-2xl">{ok ? 'Recebemos as informações.' : hasWhatsApp?'Continue pelo WhatsApp.':'Não foi possível enviar.'}</h3>
        <p className="mt-3 leading-relaxed text-graphite">{ok ? 'Nossa equipe entrará em contato para conversar sobre o aluno.' : hasWhatsApp?'Não conseguimos registrar o formulário. Você pode enviar as informações pelo WhatsApp.':'Suas informações continuam neste formulário. Tente novamente em alguns instantes.'}</p>
        {hasWhatsApp&&<Cta message={msg} className={btn + ' mt-6'}><MessageCircle size={16} aria-hidden />Continuar pelo WhatsApp</Cta>}
        {!ok && <button onClick={() => setState('idle')} className="mt-4 block text-sm text-mute underline underline-offset-4">Voltar e tentar de novo</button>}
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <p className="text-sm font-medium text-brass sm:col-span-2">Responsável</p>
      <Field id="guardianName" label="Nome" error={errs.guardianName}><input {...inp('guardianName')} autoComplete="name" className={fieldCls(errs.guardianName)} /></Field>
      <Field id="whatsapp" label="WhatsApp" error={errs.whatsapp}><input {...inp('whatsapp')} type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" className={fieldCls(errs.whatsapp)} /></Field>
      <Field id="email" label="E-mail" error={errs.email} wide><input {...inp('email')} type="email" autoComplete="email" className={fieldCls(errs.email)} /></Field>
      <p className="mt-2 text-sm font-medium text-brass sm:col-span-2">Aluno</p>
      <Field id="studentName" label="Nome do aluno" error={errs.studentName}><input {...inp('studentName')} className={fieldCls(errs.studentName)} /></Field>
      <Field id="age" label="Idade (opcional)"><input {...inp('age')} inputMode="numeric" className={fieldCls()} /></Field>
      <Field id="grade" label="Série / ano" error={errs.grade}><input {...inp('grade')} placeholder="Ex.: 2º ano do Ensino Médio" className={fieldCls(errs.grade)} /></Field>
      <Field id="school" label="Escola (opcional)"><input {...inp('school')} className={fieldCls()} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1.5 text-sm font-medium">Disciplina(s)</legend>
        <div className="flex flex-wrap gap-2">{subjects.map(s => { const on = v.subjects.includes(s); return <label key={s} className={`cursor-pointer rounded-full border px-4 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${on ? 'border-accent bg-accent/20 text-white' : 'border-line bg-white/[0.04] hover:border-white/40'}`}><input type="checkbox" className="sr-only" checked={on} onChange={() => set('subjects', on ? v.subjects.filter(x => x !== s) : [...v.subjects, s])} />{s}</label> })}</div>
        {errs.subjects && <p role="alert" className="mt-1.5 text-sm text-red-400">{errs.subjects}</p>}
      </fieldset>
      <Field id="goal" label="Principal objetivo" error={errs.goal}><select {...inp('goal')} className={fieldCls(errs.goal)}><option value="">Selecione</option>{goals.map(g => <option key={g}>{g}</option>)}</select></Field>
      <Field id="frequency" label="Frequência desejada (opcional)"><select {...inp('frequency')} className={fieldCls()}><option value="">Selecione</option>{freqs.map(g => <option key={g}>{g}</option>)}</select></Field>
      <Field id="difficulties" label="Principais dificuldades (opcional)" wide><textarea {...inp('difficulties')} rows={3} className={fieldCls()} /></Field>
      <Field id="availability" label="Disponibilidade de dias e horários (opcional)" wide><input {...inp('availability')} placeholder="Ex.: terças e quintas à tarde" className={fieldCls()} /></Field>
      <Field id="notes" label="Observações (opcional)" wide><textarea {...inp('notes')} rows={3} className={fieldCls()} /></Field>
      <div className="absolute -left-[9999px]" aria-hidden><label>Não preencha<input tabIndex={-1} autoComplete="off" value={v.website} onChange={e => set('website', e.target.value)} /></label></div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-graphite"><input type="checkbox" checked={v.consent} onChange={e => set('consent', e.target.checked)} className="mt-1 h-4 w-4 accent-[#2F7BFF]" aria-invalid={!!errs.consent} /><span>Sou o responsável pelo aluno e concordo com o uso dos dados informados para contato sobre o acompanhamento, conforme a <a href="/privacidade" className="underline underline-offset-4">Política de Privacidade</a>.</span></label>
        {errs.consent && <p role="alert" className="mt-1.5 text-sm text-red-400">{errs.consent}</p>}
      </div>
      <div className="sm:col-span-2"><button type="submit" disabled={state === 'sending'} className={btn + ' w-full disabled:opacity-60 sm:w-auto'}>{state === 'sending' ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Enviando</> : 'Enviar diagnóstico'}</button></div>
    </form>
  )
}

function Diagnostic() {
  return (
    <section id="diagnostico" className="border-t border-line py-20 sm:py-28"><Wrap className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
      <div>
        <Eyebrow>Diagnóstico inicial</Eyebrow>
        <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">Conte-nos o momento do aluno.</h2>
        <p className="mt-6 leading-relaxed text-graphite">Leva cerca de dois minutos. Depois do envio, nossa equipe chama você pelo WhatsApp para conversar e propor o acompanhamento.</p>
        <p className="mt-4 text-sm text-mute">Pedimos só o necessário para entender o aluno.</p>
        <div className="mt-8"><Cta message={messages.general} className={btnGhost}><MessageCircle size={16} aria-hidden />Prefiro falar pelo WhatsApp</Cta></div>
      </div>
      <LeadForm />
    </Wrap></section>
  )
}

function Footer() {
  const content=useSiteContent()
  const email=content.email||site.email
  return (
    <footer className="bg-ink pb-28 pt-14 text-paper md:pb-14"><Wrap className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
      <div><Brand className="text-3xl" /><p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">Acompanhamento educacional individual em Matemática, Física e Química.</p></div>
      <ul className="space-y-2 text-sm text-white/80">{nav.map(([n, h]) => <li key={h}><a href={h} className="hover:text-white">{n}</a></li>)}<li><a href="#diagnostico" className="hover:text-white">Solicitar diagnóstico</a></li></ul>
      <ul className="space-y-2 text-sm text-white/80">
        {email && <li><a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>}
        <li><a href="/privacidade" className="hover:text-white">Política de Privacidade</a></li>
        <li><Cta message={messages.teacher} className="hover:text-white" icon={false}>Sou professor e quero conversar</Cta></li>
      </ul>
    </Wrap></footer>
  )
}

function StickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-white/10 bg-black/90 p-3 backdrop-blur xl:hidden" style={{ paddingBottom: 'max(.75rem, env(safe-area-inset-bottom))' }}>
      <a href="/responsavel" className={btnGhost+' !px-3 flex-1 !py-2 text-xs sm:text-sm'}><LogIn size={16} aria-hidden/>Área do responsável</a>
      <a href="#diagnostico" className={btn + ' flex-1 !px-3 text-xs sm:text-sm'}>Solicitar diagnóstico</a>
      <Cta message={messages.general} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white" icon={false}><MessageCircle size={20} aria-label="Conversar pelo WhatsApp" /></Cta>
    </div>
  )
}

function Privacy() {
  return (
    <main className="py-16"><Wrap className="max-w-3xl">
      <a href="/" className="text-sm text-accent underline underline-offset-4">← Voltar ao site</a>
      <h1 className="mt-6 text-4xl">Política de Privacidade</h1>
      <div className="mt-8 space-y-5 leading-relaxed text-graphite">
        <p><b>Quais dados coletamos.</b> No formulário de diagnóstico: nome, WhatsApp e e-mail do responsável; nome, série, idade (opcional), escola (opcional), disciplina, objetivo, dificuldades, disponibilidade e observações sobre o aluno.</p>
        <p><b>Para que usamos.</b> Exclusivamente para entender o caso do aluno, entrar em contato com o responsável e propor o acompanhamento. Pedimos só o necessário e o consentimento do responsável antes do envio.</p>
        <p><b>Onde ficam.</b> Os dados são armazenados em sistemas de acesso restrito da equipe, incluindo o Supabase, para atendimento e gestão do acompanhamento educacional. Ao continuar pelo WhatsApp, a conversa passa a seguir as regras daquele serviço.</p>
        <p><b>Seus direitos (LGPD).</b> O responsável pode pedir acesso, correção ou exclusão dos dados dele e do aluno, ou retirar o consentimento, a qualquer momento{site.email ? <>, pelo e-mail <a className="underline" href={`mailto:${site.email}`}>{site.email}</a></> : ' pelos canais de contato da Aegis Educational'}.</p>
        <p className="rounded-sm border border-line bg-white/[0.03] p-4 text-sm text-mute">Revisão jurídica pendente: antes da publicação, este texto deve ser revisado por advogado e completado com a razão social, o CNPJ e o encarregado de dados da empresa.</p>
      </div>
    </Wrap></main>
  )
}

function PublicApp() {
  if (location.pathname.replace(/\/$/, '') === '/privacidade') return <><Header /><Privacy /><Footer /></>
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3 focus:text-black">Ir para o conteúdo</a>
      <Header />
      <main id="conteudo"><Hero /><Problem /><How /><Subjects /><Teachers /><Plans /><Faq /><Diagnostic /></main>
      <Footer /><StickyBar />
    </>
  )
}

export default function App(){return <SiteContentProvider><PublicApp/></SiteContentProvider>}
