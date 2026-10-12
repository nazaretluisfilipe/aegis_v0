import type { ReactNode } from 'react'

/** Mesmos estilos de botão do site público (gradiente azul), copiados para não importar o App inteiro no chunk do painel. */
export const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F7BFF] to-[#0A0A9E] px-6 py-3 text-sm font-medium text-white transition-[transform,box-shadow,opacity] duration-300 ease-out hover:shadow-[0_0_20px_rgba(47,123,255,0.3)] active:scale-[.98] motion-safe:hover:-translate-y-0.5 disabled:opacity-60'
export const btnGhost = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-[transform,border-color,background-color] duration-300 ease-out hover:border-white/40 hover:bg-white/10 active:scale-[.98]'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={'font-serif leading-none tracking-tight text-white '+(compact?'text-lg sm:text-xl':'text-xl sm:text-2xl')}>Aégis<span className="text-brass"> Educational</span></span>
    </span>
  )
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      <p className="text-xs font-medium uppercase tracking-[.2em] text-[#3b9ce2]">Painel administrativo</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      {children && <p className="mt-3 max-w-2xl leading-relaxed text-graphite">{children}</p>}
    </header>
  )
}

/** Estado vazio honesto: a área existe, mas a funcionalidade ainda não foi construída. Não mostra nenhum dado. */
export function NotBuilt({ items }: { items: string[] }) {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      <span className="inline-block rounded-full border border-white/15 px-3 py-1 text-xs text-mute">Ainda não implementado</span>
      <p className="mt-4 max-w-xl leading-relaxed text-graphite">Esta área está reservada na estrutura do painel. Nenhum dado é exibido ou gravado aqui nesta etapa.</p>
      <p className="mt-6 text-sm font-medium text-white">Previsto para esta área</p>
      <ul className="mt-2 space-y-1.5 text-sm text-graphite">
        {items.map(i => <li key={i} className="flex gap-2"><span aria-hidden className="text-[#3b9ce2]">·</span>{i}</li>)}
      </ul>
    </div>
  )
}

/** Tela cheia usada nos estados bloqueados (não configurado, login, sem permissão, erro). */
export function Gate({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-5">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center"><Brand /></div>
        <div className="glass-panel rounded-3xl p-7 shadow-2xl sm:p-9">
          <h1 className="text-2xl">{title}</h1>
          <div className="mt-4 space-y-4 leading-relaxed text-graphite">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm"><a href="/" className="text-mute underline underline-offset-4 hover:text-white">Voltar ao site</a></p>
      </div>
    </main>
  )
}
