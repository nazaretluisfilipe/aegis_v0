import {useEffect,useState} from 'react'
import {supabaseAdmin as db} from '../supabaseAdmin'
import {PageHeader,btn} from '../ui'
type Lead={id:string;guardian_name:string;email:string;phone:string;student_name:string;school_grade:string;subjects:string;goal:string;status:string;created_at:string}
export default function Leads(){
 const [rows,setRows]=useState<Lead[]>([]),[error,setError]=useState('')
 async function load(){const r=await db!.from('lead_requests').select('*').order('created_at',{ascending:false});if(r.error)setError('Não foi possível carregar os interessados.');else setRows(r.data as Lead[])}
 useEffect(()=>{void load()},[])
 async function mark(id:string,status:string){const r=await db!.from('lead_requests').update({status}).eq('id',id).select('id').single();if(r.error)setError('Não foi possível atualizar o contato.');else await load()}
 return <div className="space-y-5"><PageHeader title="Interessados">Contatos recebidos pelo formulário do site. Nenhuma mensagem é enviada automaticamente.</PageHeader>{error&&<p role="alert">{error}</p>}{rows.length===0&&<p>Nenhum contato recebido.</p>}{rows.map(l=><article className="glass-panel space-y-2 rounded-2xl p-5" key={l.id}><h2 className="text-xl">{l.guardian_name}</h2><p>{l.email} · {l.phone}</p><p className="text-mute">{l.student_name} · {l.school_grade} · {l.subjects}</p><p>{l.goal}</p><p className="text-sm">{new Date(l.created_at).toLocaleString('pt-BR')} · {({new:'Novo',contacted:'Contatado',closed:'Encerrado'} as Record<string,string>)[l.status]}</p><div className="flex gap-3"><button className={btn} onClick={()=>void mark(l.id,'contacted')}>Marcar contatado</button><button className={btn} onClick={()=>void mark(l.id,'closed')}>Encerrar</button></div></article>)}</div>
}
