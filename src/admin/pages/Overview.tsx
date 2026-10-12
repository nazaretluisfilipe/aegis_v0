import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {PageHeader} from '../ui'
import {adminNav} from '../AdminLayout'
import {supabaseAdmin as db} from '../supabaseAdmin'

type Metric={label:string;count:number}
type Alert={label:string;count:number;to:string;description:string}
export default function Overview(){
 const [counts,setCounts]=useState<Metric[]>([])
 const [alerts,setAlerts]=useState<Alert[]>([])
 const [error,setError]=useState('')
 useEffect(()=>{
  let active=true
  void (async()=>{
   if(!db){if(active)setError('Supabase não configurado.');return}
   const now=new Date().toISOString()
   const queries=[
    ['Alunos','students','active',true],
    ['Responsáveis ativos','guardians','active',true],
    ['Professores ativos','teachers','active',true],
    ['Pacotes ativos','lesson_packages','status','active'],
    ['Aulas agendadas','lessons','status','scheduled'],
    ['Aulas realizadas','lessons','status','completed'],
    ['Relatórios em rascunho','educational_reports','status','draft']
   ] as const
   const results=await Promise.all([
    ...queries.map(async([label,table,key,value])=>{
     const r=await db!.from(table).select('id',{count:'exact',head:true}).eq(key,value)
     return {label,count:r.count??0,error:r.error}
    }),
    (async()=>{
     const r=await db!.from('lessons').select('id',{count:'exact',head:true}).eq('status','scheduled').lt('starts_at',now)
     return {label:'Aulas aguardando fechamento',count:r.count??0,error:r.error}
    })(),
    (async()=>{
     const r=await db!.from('lead_requests').select('id',{count:'exact',head:true}).in('status',['new','contacted','qualified','proposal']).lt('follow_up_at',now)
     return {label:'Retornos comerciais atrasados',count:r.count??0,error:r.error}
    })()
   ])
   if(!active)return
   if(results.some(r=>r.error)){setError('Não foi possível carregar todos os indicadores.');return}
   setCounts(results.slice(0,queries.length).map(({label,count})=>({label,count})))
   setAlerts([
    {label:results[7].label,count:results[7].count,to:'/aulas',description:'Aulas com horário passado que continuam agendadas.'},
    {label:results[8].label,count:results[8].count,to:'/interessados',description:'Interessados com acompanhamento vencido e ainda em negociação.'}
   ])
  })()
  return()=>{active=false}
 },[])
 return <div className="space-y-7">
  <PageHeader title="Visão geral">Acompanhe a operação e as pendências de atendimento.</PageHeader>
  {error&&<p role="alert" className="text-red-300">{error}</p>}
  <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-3">{counts.map(c=><div key={c.label} className="glass-panel rounded-2xl p-5"><p className="text-sm text-mute">{c.label}</p><p className="mt-2 text-3xl">{c.count}</p></div>)}</section>
  <section aria-label="Pendências operacionais"><h2 className="mb-4 text-xl">Pendências operacionais</h2><div className="grid gap-4 sm:grid-cols-2">{alerts.map(a=><Link key={a.label} to={a.to} className="glass-panel rounded-2xl p-5 hover:border-blue-400"><p className="text-sm text-mute">{a.label}</p><p className="mt-2 text-3xl">{a.count}</p><p className="mt-2 text-sm text-mute">{a.description}</p><span className="mt-3 inline-block text-sm text-blue-300">Abrir gestão →</span></Link>)}</div></section>
  <section className="grid gap-4 sm:grid-cols-2">{adminNav.filter(n=>n.to!=='/').map(({to,label,icon:Icon})=><Link className="glass-panel flex items-center gap-3 rounded-2xl p-6 hover:border-blue-400" key={to} to={to}><Icon size={22}/><h2>{label}</h2></Link>)}</section>
 </div>
}
