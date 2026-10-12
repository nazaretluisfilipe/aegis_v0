import {useEffect,useState,type FormEvent} from 'react'
import {supabaseAdmin as db,isSupabaseConfigured} from '../admin/supabaseAdmin'
import {Brand,btn,btnGhost} from '../admin/ui'
type Lesson={id:string;subject:string;teacher_name:string;starts_at:string;status:string;meet_url:string|null;student_id:string;package_id:string|null}
type Package={id:string;title:string;included_lessons:number;status:string;starts_on:string|null;ends_on:string|null}
type Student={id:string;full_name:string;school_grade:string}
type Material={id:string;lesson_id:string;title:string;storage_path:string}
export default function ResponsiblePortal(){
 const [auth,setAuth]=useState<'loading'|'signed-out'|'ready'|'denied'|'error'>('loading')
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [students,setStudents]=useState<Student[]>([]),[packages,setPackages]=useState<Package[]>([]),[lessons,setLessons]=useState<Lesson[]>([]),[materials,setMaterials]=useState<Material[]>([])
 useEffect(()=>{
  if(!db){setAuth('error');return}
  const client=db
  let mounted=true
  async function refresh(){
   const {data:{user},error:authError}=await client.auth.getUser()
   if(!mounted)return
   if(authError||!user){setAuth('signed-out');return}
   const guardian=await client.from('guardians').select('family_id').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
   if(!mounted)return
   if(guardian.error){setAuth('error');return}
   if(!guardian.data){setAuth('denied');return}
   const family=guardian.data.family_id as string
   const [s,p,l,m]=await Promise.all([
    client.from('students').select('id,full_name,school_grade').eq('family_id',family).eq('active',true),
    client.from('lesson_packages').select('id,title,included_lessons,status,starts_on,ends_on').eq('family_id',family),
    client.from('lessons').select('id,subject,teacher_name,starts_at,status,meet_url,student_id,package_id').eq('family_id',family).order('starts_at'),
    client.from('lesson_materials').select('id,lesson_id,title,storage_path')
   ])
   if(!mounted)return
   if(s.error||p.error||l.error||m.error){setAuth('error');return}
   const retrieved=(l.data||[]) as Lesson[]
   setStudents((s.data||[]) as Student[]);setPackages((p.data||[]) as Package[]);setLessons(retrieved)
   setMaterials(((m.data||[]) as Material[]).filter(mat=>retrieved.some(lesson=>lesson.id===mat.lesson_id)))
   setAuth('ready')
  }
  const {data:subscription}=client.auth.onAuthStateChange(()=>{queueMicrotask(()=>{void refresh()})})
  void refresh()
  return ()=>{mounted=false;subscription.subscription.unsubscribe()}
 },[])
 async function login(e:FormEvent){e.preventDefault();if(!db)return;setBusy(true);setError('');const {error:err}=await db.auth.signInWithPassword({email:email.trim(),password});if(err)setError('Não foi possível entrar. Confira e-mail, senha e confirmação da conta.');setBusy(false)}
 async function logout(){await db?.auth.signOut();setAuth('signed-out');setLessons([]);setStudents([]);setPackages([]);setMaterials([])}
 async function download(m:Material){
  if(!db)return
  const {data,error:err}=await db.storage.from('aegis-lesson-materials').createSignedUrl(m.storage_path,60)
  if(err||!data){setError('Não foi possível abrir o material.');return}
  window.open(data.signedUrl,'_blank','noopener,noreferrer')
 }
 const today=Date.now()
 const future=lessons.filter(l=>l.status==='scheduled'&&new Date(l.starts_at).getTime()>=today)
 if(!isSupabaseConfigured)return <main className="min-h-screen bg-black p-10 text-white">Área do responsável indisponível. Configure as variáveis públicas do Supabase no ambiente.</main>
 if(auth==='loading')return <main role="status" className="min-h-screen bg-black p-10 text-white">Verificando acesso...</main>
 if(auth==='signed-out')return <main className="flex min-h-screen items-center justify-center bg-black p-5 text-white"><div className="glass-panel w-full max-w-md rounded-2xl p-8"><Brand/><h1 className="my-6 text-2xl">Área do responsável</h1><p className="mb-5 text-sm text-mute">Acesso enviado pela Aégis. Não há cadastro público.</p><form onSubmit={login} className="space-y-4"><label className="block">E-mail<input className="mt-1 w-full rounded-xl border border-white/20 bg-black p-3" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block">Senha<input className="mt-1 w-full rounded-xl border border-white/20 bg-black p-3" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="text-red-300">{error}</p>}<button disabled={busy} className={btn+' w-full'}>{busy?'Entrando...':'Entrar'}</button></form><a className="mt-4 block text-sm text-blue-300 underline" href="/responsavel/recuperar">Esqueci minha senha</a></div></main>
 if(auth==='denied'||auth==='error')return <main className="min-h-screen bg-black p-10 text-white"><h1 className="text-xl">Acesso indisponível</h1><p className="my-4 text-mute">{auth==='denied'?'Sua conta ainda não está vinculada a um responsável. Solicite liberação à Aégis.':'Não foi possível conferir seu acesso. Tente novamente mais tarde.'}</p><button className={btnGhost} onClick={logout}>Sair</button></main>
 return <main className="min-h-screen bg-black px-5 py-9 text-white"><div className="mx-auto max-w-5xl space-y-8"><header className="flex flex-wrap items-center justify-between gap-4"><Brand/><button className={btnGhost} onClick={logout}>Sair</button></header><div><h1 className="text-3xl">Minhas aulas</h1><p className="mt-2 text-mute">Acompanhe as aulas contratadas e os materiais disponibilizados.</p></div>
 {error&&<p role="alert" className="text-red-300">{error}</p>}
 <section className="grid gap-3 sm:grid-cols-3"><div className="glass-panel rounded-xl p-5"><p className="text-mute">Alunos vinculados</p><b className="text-2xl">{students.length}</b></div><div className="glass-panel rounded-xl p-5"><p className="text-mute">Próximas aulas</p><b className="text-2xl">{future.length}</b></div><div className="glass-panel rounded-xl p-5"><p className="text-mute">Aulas realizadas</p><b className="text-2xl">{lessons.filter(l=>l.status==='completed').length}</b></div></section>
 <section><h2 className="mb-4 text-xl">Aulas contratadas</h2>{packages.length===0?<p className="glass-panel rounded-xl p-5 text-mute">Nenhum pacote cadastrado ainda.</p>:<div className="grid gap-3 sm:grid-cols-2">{packages.map(p=>{const used=lessons.filter(l=>l.package_id===p.id&&l.status==='completed').length;return <div key={p.id} className="glass-panel rounded-xl p-5"><b>{p.title}</b><p className="mt-2 text-sm text-mute">Contratadas: {p.included_lessons} · Realizadas: {used} · Restantes: {Math.max(0,p.included_lessons-used)}</p><p className="mt-1 text-sm text-mute">Situação: {p.status}</p></div>})}</div>}</section>
 <section><h2 className="mb-4 text-xl">Agenda e materiais</h2>{lessons.length===0?<p className="glass-panel rounded-xl p-5 text-mute">Nenhuma aula cadastrada até o momento.</p>:<div className="space-y-4">{lessons.map(l=><article key={l.id} className="glass-panel rounded-2xl p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-lg">{l.subject} — {students.find(s=>s.id===l.student_id)?.full_name||'Aluno'}</h3><p className="mt-1 text-sm text-mute">{new Date(l.starts_at).toLocaleString('pt-BR')} · {l.teacher_name} · {l.status}</p></div>{l.meet_url&&l.status==='scheduled'?<a href={l.meet_url} target="_blank" rel="noopener noreferrer" className={btn}>Entrar no Google Meet</a>:<span className="text-sm text-mute">Link ainda não disponibilizado</span>}</div><h4 className="mt-5 mb-2 text-sm">Materiais complementares</h4>{materials.filter(m=>m.lesson_id===l.id).length===0?<p className="text-sm text-mute">Nenhum material disponível.</p>:<div className="flex flex-wrap gap-2">{materials.filter(m=>m.lesson_id===l.id).map(m=><button key={m.id} className={btnGhost} onClick={()=>void download(m)}>{m.title}</button>)}</div>}</article>)}</div>}</section>
 <p className="text-xs text-mute">Área restrita. Seus dados são carregados conforme a autorização da conta vinculada.</p>
 </div></main>
}
