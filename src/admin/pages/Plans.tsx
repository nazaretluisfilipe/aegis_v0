import {useEffect,useState,type FormEvent} from 'react'
import {PageHeader,btn} from '../ui'
import {supabaseAdmin as db} from '../supabaseAdmin'
type Guardian={id:string;family_id:string;full_name:string}
type Package={id:string;family_id:string;title:string;included_lessons:number;status:string;starts_on:string|null;ends_on:string|null}
export default function Plans(){
 const [guardians,setGuardians]=useState<Guardian[]>([]),[packages,setPackages]=useState<Package[]>([]),[used,setUsed]=useState<Record<string,number>>({}),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [form,setForm]=useState({family_id:'',title:'',included_lessons:'',starts_on:'',ends_on:''})
 async function load(){
  if(!db)return
  const [g,p,l]=await Promise.all([db.from('guardians').select('id,family_id,full_name'),db.from('lesson_packages').select('id,family_id,title,included_lessons,status,starts_on,ends_on').order('created_at',{ascending:false}),db.from('lessons').select('package_id,status')])
  if(g.error||p.error||l.error){setError('Não foi possível carregar os pacotes. Verifique a migração 0003.');return}
  setGuardians((g.data||[]) as Guardian[]);setPackages((p.data||[]) as Package[])
  const totals:Record<string,number>={};for(const row of (l.data||[])){if(row.package_id&&row.status==='completed')totals[row.package_id]=(totals[row.package_id]||0)+1}
  setUsed(totals)
 }
 useEffect(()=>{void load()},[])
 async function save(e:FormEvent){
  e.preventDefault();if(!db||saving)return
  const n=Number(form.included_lessons)
  if(!form.family_id||form.title.trim().length<3||!Number.isInteger(n)||n<1||n>500){setError('Selecione responsável, título e quantidade válida de aulas.');return}
  setSaving(true);setError('');setNotice('')
  const {error}=await db.from('lesson_packages').insert({family_id:form.family_id,title:form.title.trim(),included_lessons:n,starts_on:form.starts_on||null,ends_on:form.ends_on||null})
  setSaving(false)
  if(error){setError('Não foi possível gravar o pacote. Confira as datas e sua autorização.');return}
  setNotice('Pacote cadastrado.');setForm({family_id:'',title:'',included_lessons:'',starts_on:'',ends_on:''});await load()
 }
 const labels=new Map<string,string>();guardians.forEach(g=>{if(!labels.has(g.family_id))labels.set(g.family_id,g.full_name)})
 const input='mt-1 w-full rounded-xl border border-white/20 bg-[#080d19] p-3'
 return <div className="space-y-7"><PageHeader title="Pacotes de aulas">Registre as aulas contratadas; não há cobrança nem confirmação automática de pagamentos.</PageHeader>
 {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-300">{error}</p>}
 {notice&&<p role="status" className="rounded-xl border border-blue-500/40 p-4">{notice}</p>}
 <section className="glass-panel rounded-2xl p-6"><h2 className="mb-4 text-xl">Registrar pacote contratado</h2><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
 <label>Responsável *<select required className={input} value={form.family_id} onChange={e=>setForm({...form,family_id:e.target.value})}><option value="">Selecione</option>{[...labels.entries()].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 <label>Nome do pacote *<input required maxLength={120} placeholder="Ex.: 8 aulas de Matemática" className={input} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
 <label>Quantidade contratada *<input required type="number" min="1" max="500" className={input} value={form.included_lessons} onChange={e=>setForm({...form,included_lessons:e.target.value})}/></label>
 <label>Data inicial<input type="date" className={input} value={form.starts_on} onChange={e=>setForm({...form,starts_on:e.target.value})}/></label>
 <label>Vencimento<input type="date" className={input} value={form.ends_on} onChange={e=>setForm({...form,ends_on:e.target.value})}/></label>
 <button className={btn+' sm:col-span-2'} disabled={saving}>{saving?'Salvando...':'Registrar pacote'}</button>
 </form></section>
 <section className="glass-panel rounded-2xl p-6"><h2 className="mb-4 text-xl">Pacotes registrados</h2>{packages.length===0?<p className="text-mute">Nenhum pacote registrado.</p>:<div className="space-y-3">{packages.map(p=><div className="rounded-xl border border-white/10 p-4" key={p.id}><b>{p.title}</b><p className="text-sm text-mute">{labels.get(p.family_id)||'Responsável'} · Contratadas: {p.included_lessons} · Realizadas: {used[p.id]||0} · Restantes: {Math.max(0,p.included_lessons-(used[p.id]||0))} · {p.status}</p></div>)}</div>}</section>
 </div>
}
