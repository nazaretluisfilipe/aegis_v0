import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {PageHeader,btnGhost} from '../ui'
import {adminNav} from '../AdminLayout'
import {supabaseAdmin as db} from '../supabaseAdmin'

type Metric={label:string;count:number}
type Lead={id:string;guardian_name:string;student_name:string;follow_up_at:string;status:string}
type Lesson={id:string;subject:string;teacher_name:string;starts_at:string}
type Report={id:string;title:string;updated_at:string}
const time=(v:string)=>new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})

export default function Overview(){
 const [counts,setCounts]=useState<Metric[]>([])
 const [leads,setLeads]=useState<Lead[]>([])
 const [lessons,setLessons]=useState<Lesson[]>([])
 const [reports,setReports]=useState<Report[]>([])
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(true)
 async function load(){
  if(!db){setError('Supabase não configurado.');setLoading(false);return}
  setLoading(true);setError('')
  const end=new Date(Date.now()+7*24*60*60*1000).toISOString()
  const now=new Date().toISOString()
  const definitions=[
   ['Alunos','students','active',true],
   ['Responsáveis ativos','guardians','active',true],
   ['Professores ativos','teachers','active',true],
   ['Pacotes ativos','lesson_packages','status','active'],
   ['Aulas agendadas','lessons','status','scheduled'],
   ['Aulas realizadas','lessons','status','completed'],
   ['Relatórios em rascunho','educational_reports','status','draft']
  ] as const
  const [stats,followUps,upcoming,pending]=await Promise.all([
   Promise.all(definitions.map(async([label,table,key,value])=>{
    const r=await db!.from(table).select('id',{count:'exact',head:true}).eq(key,value).eq('is_demo',false)
    return {label,count:r.count||0,error:r.error}
   })),
   db.from('lead_requests').select('id,guardian_name,student_name,follow_up_at,status')
     .eq('is_demo',false).in('status',['new','contacted','qualified','proposal'])
     .lte('follow_up_at',now).order('follow_up_at').limit(5),
   db.from('lessons').select('id,subject,teacher_name,starts_at').eq('is_demo',false).eq('status','scheduled')
     .gte('starts_at',now).lte('starts_at',end).order('starts_at').limit(6),
   db.from('educational_reports').select('id,title,updated_at').eq('is_demo',false).eq('status','draft')
     .order('updated_at',{ascending:false}).limit(5)
  ])
  setLoading(false)
  if(stats.some(x=>x.error)||followUps.error||upcoming.error||pending.error){
   setError('Não foi possível carregar completamente a central de operações. Verifique a conexão e as permissões.')
   return
  }
  setCounts(stats.map(({label,count})=>({label,count})))
  setLeads((followUps.data||[]) as Lead[])
  setLessons((upcoming.data||[]) as Lesson[])
  setReports((pending.data||[]) as Report[])
 }
 useEffect(()=>{void load()},[])
 return <div className="space-y-7">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <PageHeader title="Visão geral">Acompanhe os indicadores reais, os retornos comerciais e as atividades da equipe. Dados TESTE — FICTÍCIO não entram aqui.</PageHeader>
   <button className={btnGhost} onClick={()=>void load()} disabled={loading}>{loading?'Atualizando…':'Atualizar dados'}</button>
  </div>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  {loading&&!counts.length&&<p role="status" className="text-mute">Carregando indicadores do Supabase…</p>}
  <section aria-label="Indicadores da operação real" className="grid gap-4 sm:grid-cols-3">{counts.map(c=>
   <div key={c.label} className="glass-panel rounded-2xl p-5"><p className="text-sm text-mute">{c.label}</p><p className="mt-2 text-3xl">{c.count}</p></div>
  )}</section>
  <section className="grid gap-4 lg:grid-cols-2">
   <div className="glass-panel rounded-2xl p-5">
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xl">Retornos comerciais vencidos</h2><Link to="/interessados" className="text-sm text-blue-300 underline">Ver interessados</Link></div>
    {leads.length===0?<p className="text-sm text-mute">Nenhum retorno vencido entre os registros carregados.</p>:
     <ul className="space-y-3">{leads.map(l=><li key={l.id} className="rounded-xl border border-white/10 p-3">
      <b className="text-sm">{l.guardian_name}</b>
      <p className="text-xs text-mute">{l.student_name} · retorno previsto em {time(l.follow_up_at)}</p>
     </li>)}</ul>}
   </div>
   <div className="glass-panel rounded-2xl p-5">
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xl">Próximas aulas — 7 dias</h2><Link to="/aulas" className="text-sm text-blue-300 underline">Abrir agenda</Link></div>
    {lessons.length===0?<p className="text-sm text-mute">Nenhuma aula programada para os próximos sete dias.</p>:
     <ul className="space-y-3">{lessons.map(l=><li key={l.id} className="rounded-xl border border-white/10 p-3">
      <b className="text-sm">{l.subject}</b>
      <p className="text-xs text-mute">{l.teacher_name} · {time(l.starts_at)}</p>
     </li>)}</ul>}
   </div>
   <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xl">Relatórios aguardando revisão</h2><Link to="/relatorios" className="text-sm text-blue-300 underline">Abrir relatórios</Link></div>
    {reports.length===0?<p className="text-sm text-mute">Nenhum rascunho aguardando revisão.</p>:
     <ul className="grid gap-3 sm:grid-cols-2">{reports.map(r=><li key={r.id} className="rounded-xl border border-white/10 p-3">
      <b className="text-sm">{r.title}</b>
      <p className="text-xs text-mute">Última alteração: {time(r.updated_at)}</p>
     </li>)}</ul>}
   </div>
  </section>
  <h2 className="text-xl">Acesso rápido</h2>
  <section className="grid gap-4 sm:grid-cols-2">{adminNav.filter(n=>n.to!=='/').map(({to,label,icon:Icon})=>
   <Link className="glass-panel flex items-center gap-3 rounded-2xl p-5 hover:border-blue-400" key={to} to={to}>
    <Icon size={21}/><h3>{label}</h3>
   </Link>
  )}</section>
 </div>
}
