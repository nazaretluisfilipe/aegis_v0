import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {PageHeader} from '../ui'
import {adminNav} from '../AdminLayout'
import {supabaseAdmin as db} from '../supabaseAdmin'
export default function Overview(){
 const [counts,setCounts]=useState<{label:string;count:number}[]>([]),[error,setError]=useState('')
 useEffect(()=>{let active=true;void (async()=>{const queries=[['Alunos','students','active',true],['Responsáveis ativos','guardians','active',true],['Professores ativos','teachers','active',true],['Pacotes ativos','lesson_packages','status','active'],['Aulas agendadas','lessons','status','scheduled'],['Aulas realizadas','lessons','status','completed'],['Relatórios em rascunho','educational_reports','status','draft']] as const;const results=await Promise.all(queries.map(async([label,table,key,value])=>{const r=await db!.from(table).select('id',{count:'exact',head:true}).eq(key,value);return{label,count:r.count||0,error:r.error}}));if(!active)return;if(results.some(r=>r.error))setError('Não foi possível carregar todos os indicadores.');else setCounts(results)})();return()=>{active=false}},[])
 return <div className="space-y-7"><PageHeader title="Visão geral">Acompanhe a operação e as pendências de atendimento.</PageHeader>{error&&<p role="alert">{error}</p>}<section className="grid gap-4 sm:grid-cols-3">{counts.map(c=><div key={c.label} className="glass-panel rounded-2xl p-5"><p className="text-sm text-mute">{c.label}</p><p className="mt-2 text-3xl">{c.count}</p></div>)}</section><section className="grid gap-4 sm:grid-cols-2">{adminNav.filter(n=>n.to!=='/').map(({to,label,icon:Icon})=><Link className="glass-panel flex items-center gap-3 rounded-2xl p-6 hover:border-blue-400" key={to} to={to}><Icon size={22}/><h2>{label}</h2></Link>)}</section></div>
}
