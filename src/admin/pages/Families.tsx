import { useEffect, useState, type FormEvent } from 'react'
import { supabaseAdmin as db } from '../supabaseAdmin'
import { PageHeader, btn, btnGhost } from '../ui'

type Family={id:string;name:string;notes:string}
type Guardian={id:string;family_id:string;full_name:string;email:string;phone:string}
type Student={id:string;family_id:string;full_name:string;school_grade:string;pedagogical_notes:string}
type Kind='family'|'guardian'|'student'
type FormData={name:string;notes:string;full_name:string;email:string;phone:string;school_grade:string;pedagogical_notes:string}
const blank:FormData={name:'',notes:'',full_name:'',email:'',phone:'',school_grade:'',pedagogical_notes:''}
const field='w-full rounded-xl border border-white/20 bg-[#080d19] p-3 text-white'
function errorText(e:{code?:string}|null){if(e?.code==='23505')return 'Registro duplicado: confira e-mail ou nome e série do aluno.';if(e?.code==='42501')return 'Permissão insuficiente.';if(e?.code==='42P01'||e?.code==='PGRST202'||e?.code==='42883')return 'Banco não preparado: falta instalar a migração 0002.';return 'Não foi possível salvar ou carregar os dados. Confira a conexão e tente novamente.'}
const valid=(data:FormData,kind:Kind)=>{
  if(kind==='family'&&data.name.trim().length<3)return 'Informe o nome da família.'
  if(kind==='guardian'&&(data.full_name.trim().length<3||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||!/^\d{10,13}$/.test(data.phone.replace(/\D/g,''))))return 'Informe nome, e-mail válido e telefone com DDD.'
  if(kind==='student'&&(data.full_name.trim().length<2||!data.school_grade.trim()))return 'Informe nome e série escolar.'
  return ''
}
export default function Families(){
 const [families,setFamilies]=useState<Family[]>([]),[guardians,setGuardians]=useState<Guardian[]>([]),[students,setStudents]=useState<Student[]>([])
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [familyId,setFamilyId]=useState(''),[kind,setKind]=useState<Kind>('family'),[editId,setEditId]=useState(''),[form,setForm]=useState<FormData>(blank)
 async function reload(){
  if(!db){setError('Supabase não configurado.');setLoading(false);return}
  setLoading(true)
  try{
   const [f,g,s]=await Promise.all([db.from('families').select('id,name,notes').order('name'),db.from('guardians').select('id,family_id,full_name,email,phone').order('full_name'),db.from('students').select('id,family_id,full_name,school_grade,pedagogical_notes').order('full_name')])
   if(f.error||g.error||s.error){setError(errorText(f.error||g.error||s.error));return}
   setFamilies((f.data||[]) as Family[]);setGuardians((g.data||[]) as Guardian[]);setStudents((s.data||[]) as Student[])
  }catch{setError('Falha de conexão. Tente carregar novamente.')}finally{setLoading(false)}
 }
 useEffect(()=>{void reload()},[])
 function begin(k:Kind,id='',record?:Partial<FormData>){setKind(k);setEditId(id);setForm({...blank,...record});setError('');setNotice('')}
 async function save(e:FormEvent){
  e.preventDefault();if(!db||saving)return
  const problem=kind==='family'&&!editId ? (valid(form,'family')||valid(form,'guardian')) : valid(form,kind);if(problem){setError(problem);return}
  if(kind!=='family'&&!familyId){setError('Selecione um responsável.');return}
  setSaving(true);setError('');setNotice('')
  try{
   let result: {error:{code?:string}|null}
   if(kind==='family'&&!editId){
    result=await db.rpc('aegis_create_family',{p_name:form.name.trim(),p_notes:form.notes.trim(),p_guardian_name:form.full_name.trim(),p_guardian_email:form.email.trim().toLowerCase(),p_guardian_phone:form.phone.replace(/\D/g,'')})
   }else{
    const table=kind==='family'?'families':kind==='guardian'?'guardians':'students'
    const data=kind==='family'?{name:form.name.trim(),notes:form.notes.trim()}:kind==='guardian'?{full_name:form.full_name.trim(),email:form.email.trim().toLowerCase(),phone:form.phone.replace(/\D/g,'')}:{full_name:form.full_name.trim(),school_grade:form.school_grade.trim(),pedagogical_notes:form.pedagogical_notes.trim()}
    result=editId?await db.from(table).update(data).eq('id',editId):await db.from(table).insert({...data,family_id:familyId})
   }
   if(result.error){setError(errorText(result.error));return}
   await reload();begin('family');setNotice('Operação confirmada pelo Supabase. Consulte a lista atualizada.')
  }catch{setError('Conexão interrompida. Confira os registros antes de tentar novamente.')}finally{setSaving(false)}
 }
 async function linkGuardian(id:string){
  if(!db||saving)return
  setSaving(true);setError('');setNotice('')
  const {data,error}=await db.rpc('aegis_link_guardian',{p_guardian_id:id})
  setSaving(false)
  if(error){setError('Não foi possível vincular a conta. Confira a migração 0003 e suas permissões.');return}
  setNotice(data===true?'Conta confirmada vinculada ao responsável.':'Conta ainda não localizada ou e-mail não confirmado. Envie um convite em Supabase → Authentication → Users → Invite user e peça que confirme o e-mail antes de repetir.')
 }
 const family=families.find(f=>f.id===familyId)
 return <div className="space-y-6">
  <PageHeader title="Responsáveis e alunos">Cadastro de responsáveis e seus alunos no Supabase. Nenhuma conta de aluno será criada.</PageHeader>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-blue-500/40 p-4">{notice}</p>}
  <div className="glass-panel rounded-2xl p-5">
   <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl">Responsáveis cadastrados</h2><button className={btnGhost} disabled={loading} onClick={()=>void reload()}>Atualizar</button></div>
   {loading?<p className="mt-4 text-mute">Carregando...</p>:families.length===0?<p className="mt-4 text-mute">Nenhum responsável cadastrado.</p>:<div className="mt-4 space-y-2">{families.map(f=><button key={f.id} onClick={()=>{setFamilyId(f.id);begin('family',f.id,f)}} className={'w-full rounded-xl border p-3 text-left '+(familyId===f.id?'border-blue-400':'border-white/20')}><b>{f.name}</b><span className="ml-3 text-sm text-mute">{guardians.filter(g=>g.family_id===f.id).length} responsáveis · {students.filter(s=>s.family_id===f.id).length} alunos</span></button>)}</div>}
  </div>
  {family&&<div className="glass-panel space-y-5 rounded-2xl p-5"><h2 className="text-xl">{family.name}</h2>
    <h3>Responsáveis</h3>{guardians.filter(g=>g.family_id===familyId).map(g=><div key={g.id} className="flex items-center justify-between border-b border-white/10 pb-2"><span>{g.full_name} <span className="text-mute">· {g.email} · {g.phone}</span></span><span className="flex flex-wrap gap-2"><button className={btnGhost} onClick={()=>begin('guardian',g.id,g)}>Editar</button><button disabled={saving} className={btnGhost} onClick={()=>void linkGuardian(g.id)}>Vincular acesso confirmado</button></span></div>)}
    <h3>Alunos</h3>{students.filter(s=>s.family_id===familyId).map(s=><div key={s.id} className="flex items-center justify-between border-b border-white/10 pb-2"><span>{s.full_name} <span className="text-mute">· {s.school_grade}</span></span><button className={btnGhost} onClick={()=>begin('student',s.id,s)}>Editar</button></div>)}
    <div className="flex flex-wrap gap-3"><button className={btnGhost} onClick={()=>begin('guardian')}>+ Responsável</button><button className={btnGhost} onClick={()=>begin('student')}>+ Aluno</button><button className={btnGhost} onClick={()=>begin('family',family.id,family)}>Editar cadastro</button></div>
  </div>}
  <section className="glass-panel rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">{editId?'Editar':kind==='family'?'Novo cadastro':kind==='guardian'?'Novo responsável':'Novo aluno'}</h2><button className={btnGhost} onClick={()=>begin('family')}>Novo cadastro</button></div>
   <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
    {kind==='family'&&<label>Identificação do cadastro *<input required maxLength={120} className={field} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
    {kind!=='family'||!editId?<><label>Nome do {kind==='student'?'aluno':'responsável'} *<input required maxLength={120} className={field} value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
    {kind!=='student'&&<><label>E-mail *<input required type="email" maxLength={254} className={field} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Telefone com DDD *<input required type="tel" className={field} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></>}
    {kind==='student'&&<label>Série escolar *<input required maxLength={70} className={field} value={form.school_grade} onChange={e=>setForm({...form,school_grade:e.target.value})}/></label>}</>:null}
    <label className="sm:col-span-2">{kind==='student'?'Observações pedagógicas':'Observações administrativas'}<textarea maxLength={kind==='student'?3000:2000} className={field} value={kind==='student'?form.pedagogical_notes:form.notes} onChange={e=>setForm({...form,[kind==='student'?'pedagogical_notes':'notes']:e.target.value})}/></label>
    <button disabled={saving} className={btn+' sm:col-span-2'}>{saving?'Salvando...':'Salvar cadastro'}</button>
   </form>
  </section>
 </div>
}
