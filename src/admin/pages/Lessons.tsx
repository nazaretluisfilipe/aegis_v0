import {useEffect,useState,type FormEvent} from 'react'
import {PageHeader,btn} from '../ui'
import {supabaseAdmin as db} from '../supabaseAdmin'
type Student={id:string;full_name:string;family_id:string}
type Package={id:string;title:string;family_id:string}
type Lesson={id:string;student_id:string;subject:string;teacher_name:string;teacher_id:string|null;occurrence:string;starts_at:string;status:string;meet_url:string|null;package_id:string|null;duration_minutes:number}
type Material={id:string;lesson_id:string;title:string;storage_path:string}
const field='w-full rounded-xl border border-white/20 bg-[#080d19] p-3 text-white'
const initial={student_id:'',package_id:'',subject:'Matemática',teacher_name:'',teacher_id:'',occurrence:'',starts_at:'',meet_url:'',duration_minutes:'50',status:'scheduled'}
export default function Lessons(){
 const [teachers,setTeachers]=useState<{id:string;full_name:string}[]>([])
 const [students,setStudents]=useState<Student[]>([]),[packages,setPackages]=useState<Package[]>([]),[lessons,setLessons]=useState<Lesson[]>([]),[materials,setMaterials]=useState<Material[]>([])
 const [form,setForm]=useState(initial),[edit,setEdit]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [fileLesson,setFileLesson]=useState(''),[file,setFile]=useState<File|null>(null),[title,setTitle]=useState('')
 async function load(){
  if(!db)return
  setLoading(true)
  const [s,p,l,m,t]=await Promise.all([db.from('students').select('id,full_name,family_id').eq('active',true),db.from('lesson_packages').select('id,title,family_id'),db.from('lessons').select('id,student_id,subject,teacher_name,teacher_id,occurrence,starts_at,status,meet_url,package_id,duration_minutes').order('starts_at'),db.from('lesson_materials').select('id,lesson_id,title,storage_path').eq('active',true),db.from('teachers').select('id,full_name').eq('active',true)])
  setLoading(false)
  const err=s.error||p.error||l.error||m.error||t.error
  if(err){setError('Não foi possível buscar aulas. Confira a migração 0003 e suas permissões.');return}
  setTeachers(t.data||[]);setStudents((s.data||[]) as Student[]);setPackages((p.data||[]) as Package[]);setLessons((l.data||[]) as Lesson[]);setMaterials((m.data||[]) as Material[])
 }
 useEffect(()=>{void load()},[])
 const chosen=students.find(x=>x.id===form.student_id)
 const validMeet=(url:string)=>!url||/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/.test(url)
 async function save(e:FormEvent){
  e.preventDefault();if(!db||busy)return
  if(!chosen||!form.teacher_name.trim()||!form.starts_at||!validMeet(form.meet_url)){setError('Selecione o aluno, informe professor e horário, e confira o link do Google Meet.');return}
  if(form.package_id&&!packages.some(p=>p.id===form.package_id&&p.family_id===chosen.family_id)){setError('O pacote não pertence ao responsável desse aluno.');return}
  setBusy(true);setError('');setNotice('')
  const data={family_id:chosen.family_id,student_id:chosen.id,package_id:form.package_id||null,subject:form.subject,teacher_name:form.teacher_name.trim(),teacher_id:form.teacher_id||null,occurrence:form.occurrence,starts_at:new Date(form.starts_at).toISOString(),meet_url:form.meet_url.trim()||null,status:form.status,duration_minutes:Number(form.duration_minutes)}
  const r=edit?await db.from('lessons').update(data).eq('id',edit):await db.from('lessons').insert(data)
  setBusy(false)
  if(r.error){setError(r.error.code==='23514'?'Verifique saldo do pacote e disponibilidade do professor: não é permitido agendar aulas sobrepostas ou fora dos horários registrados.':'Não foi possível salvar. Confira datas, vínculo do aluno e permissões.');return}
  setForm(initial);setEdit('');setNotice('Aula salva no Supabase.');await load()
 }
 async function archive(id:string){if(!db)return;const r=await db.from('lesson_materials').update({active:false}).eq('id',id).select('id').single();if(r.error)setError('Não foi possível retirar o material.');else await load()}
 async function upload(e:FormEvent){
  e.preventDefault();if(!db||!file||!fileLesson||busy)return
  if(file.size>10485760||!['application/pdf','image/png','image/jpeg'].includes(file.type)){setError('Envie PDF, PNG ou JPEG de até 10 MB.');return}
  setBusy(true);setError('');setNotice('')
  const path=fileLesson+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
  const uploaded=await db.storage.from('aegis-lesson-materials').upload(path,file,{contentType:file.type,upsert:false})
  if(uploaded.error){setError('Falha no upload. Verifique o Storage e sua permissão.');setBusy(false);return}
  const saved=await db.from('lesson_materials').insert({lesson_id:fileLesson,title:title.trim()||file.name,storage_path:path})
  if(saved.error){await db.storage.from('aegis-lesson-materials').remove([path]);setError('Arquivo enviado, mas não foi possível associá-lo à aula.');setBusy(false);return}
  setFile(null);setTitle('');setFileLesson('');setNotice('Material anexado.');setBusy(false);await load()
 }
 return <div className="space-y-7">
  <PageHeader title="Aulas e materiais">Agendamentos reais, link do Meet e materiais privados. Somente administradores podem alterar.</PageHeader>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-blue-500/40 p-4">{notice}</p>}
  <section className="glass-panel rounded-2xl p-5"><h2 className="mb-4 text-xl">{edit?'Editar aula':'Cadastrar aula'}</h2>
   <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
    <label>Aluno *<select required className={field} value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value,package_id:''})}><option value="">Selecione</option>{students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
    <label>Disciplina<select className={field} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>{['Matemática','Física','Química','Biologia','Português','História','Geografia','Inglês'].map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Professor cadastrado<select className={field} value={form.teacher_id} onChange={e=>setForm({...form,teacher_id:e.target.value,teacher_name:teachers.find(t=>t.id===e.target.value)?.full_name||form.teacher_name})}><option value="">Informar nome manualmente</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label><label>Professor *<input required className={field} value={form.teacher_name} onChange={e=>setForm({...form,teacher_name:e.target.value})}/></label>
    <label>Duração<select className={field} value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})}>{[30,50,60,90,120].map(n=><option key={n} value={n}>{n} minutos</option>)}</select></label>
    <label>Data e horário *<input required type="datetime-local" className={field} value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label>
    <label>Pacote contratado<select className={field} value={form.package_id} onChange={e=>setForm({...form,package_id:e.target.value})}><option value="">Sem pacote associado</option>{packages.filter(p=>p.family_id===chosen?.family_id).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
    <label>Situação<select className={field} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="scheduled">Agendada</option><option value="completed">Realizada</option><option value="cancelled">Cancelada</option><option value="absent">Falta (não consome saldo)</option></select></label>
    <label>Ocorrências<textarea maxLength={2000} className={field} value={form.occurrence} onChange={e=>setForm({...form,occurrence:e.target.value})}/></label><label>Link do Google Meet<input type="url" placeholder="https://meet.google.com/abc-defg-hij" className={field} value={form.meet_url} onChange={e=>setForm({...form,meet_url:e.target.value})}/></label>
    <button disabled={busy} className={btn+' sm:col-span-2'}>{busy?'Salvando...':'Salvar aula'}</button>
   </form><div className="mt-5 space-y-2">{materials.map(m=><div key={m.id} className="flex items-center justify-between gap-3 border-t border-white/10 py-3"><span>{m.title}</span><button className={btn} onClick={()=>void archive(m.id)}>Retirar do portal</button></div>)}</div></section>
  <section className="glass-panel rounded-2xl p-5"><h2 className="mb-4 text-xl">Aulas cadastradas</h2>
   {loading?<p>Carregando...</p>:lessons.length===0?<p className="text-mute">Nenhuma aula registrada.</p>:<div className="space-y-3">{lessons.map(l=><div key={l.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{l.subject}</b><p className="text-sm text-mute">{students.find(s=>s.id===l.student_id)?.full_name||'Aluno'} · {new Date(l.starts_at).toLocaleString('pt-BR')} · {l.teacher_name} · {l.status}</p><p className="text-sm text-mute">{materials.filter(m=>m.lesson_id===l.id).length} materiais</p></div><button className={btn} onClick={()=>{setEdit(l.id);setForm({student_id:l.student_id,package_id:l.package_id||'',subject:l.subject,teacher_name:l.teacher_name,teacher_id:l.teacher_id||'',occurrence:l.occurrence||'',starts_at:new Date(new Date(l.starts_at).getTime()-new Date(l.starts_at).getTimezoneOffset()*60000).toISOString().slice(0,16),meet_url:l.meet_url||'',duration_minutes:String(l.duration_minutes||50),status:l.status});window.scrollTo({top:0,behavior:'smooth'})}}>Editar / Meet</button></div></div>)}</div>}
  </section>
  <section className="glass-panel rounded-2xl p-5"><h2 className="mb-4 text-xl">Adicionar material complementar</h2><form className="grid gap-4 sm:grid-cols-2" onSubmit={upload}>
   <label>Aula<select required className={field} value={fileLesson} onChange={e=>setFileLesson(e.target.value)}><option value="">Selecione</option>{lessons.map(l=><option value={l.id} key={l.id}>{l.subject} · {new Date(l.starts_at).toLocaleString('pt-BR')}</option>)}</select></label>
   <label>Título do material<input maxLength={120} className={field} value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="sm:col-span-2">Arquivo (PDF, PNG ou JPEG, até 10 MB)<input type="file" required accept=".pdf,.png,.jpg,.jpeg" className={field} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
   <button disabled={busy} className={btn+' sm:col-span-2'}>Anexar material</button>
  </form><div className="mt-5 space-y-2">{materials.map(m=><div key={m.id} className="flex items-center justify-between gap-3 border-t border-white/10 py-3"><span>{m.title}</span><button className={btn} onClick={()=>void archive(m.id)}>Retirar do portal</button></div>)}</div></section>
 </div>
}
