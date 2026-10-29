import {useEffect,useMemo,useState} from 'react'
import {supabaseAdmin as db} from '../admin/supabaseAdmin'

const labels={
 contents:'Conteúdos trabalhados',
 activities:'Atividades realizadas',
 difficulties:'Dificuldades observadas',
 strengths:'Pontos fortes',
 progress:'Evolução registrada',
 recommendations:'Recomendações',
 next_steps:'Próximos passos'
} as const
type Lesson={id:string;subject:string;starts_at:string;student_id:string}
type Student={id:string;full_name:string}
type Report={
 id:string;title:string;lesson_id:string;published_at:string|null;is_demo:boolean
}&Record<keyof typeof labels,string>
const field='rounded-xl border border-white/20 bg-[#080d19] px-3 py-2 text-white'
const date=(value:string|null)=>value?new Date(value).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Data indisponível'

export default function PublishedReports({lessons,students,selectedStudentId=''}:{lessons:Lesson[];students:Student[];selectedStudentId?:string}){
 const [rows,setRows]=useState<Report[]>([])
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(true)
 const [studentId,setStudentId]=useState(selectedStudentId)
 useEffect(()=>{setStudentId(selectedStudentId)},[selectedStudentId])
 const [subject,setSubject]=useState('')
 const [openAll,setOpenAll]=useState(false)
 const lessonIds=lessons.map(l=>l.id).sort().join(',')
 useEffect(()=>{
  let active=true
  async function load(){
   if(!db||!lessonIds){setRows([]);setError('');setLoading(false);return}
   setLoading(true);setError('')
   const r=await db.from('educational_reports')
    .select('id,title,lesson_id,published_at,contents,activities,difficulties,strengths,progress,recommendations,next_steps,is_demo')
    .eq('status','published')
    .in('lesson_id',lessonIds.split(','))
    .order('published_at',{ascending:false})
   if(!active)return
   setLoading(false)
   if(r.error){setError('Não foi possível consultar os relatórios publicados.');setRows([])}
   else setRows((r.data||[]) as Report[])
  }
  void load()
  return ()=>{active=false}
 },[lessonIds])
 const lookup=useMemo(()=>new Map(lessons.map(l=>[l.id,l])),[lessons])
 const subjects=useMemo(()=>Array.from(new Set(rows.map(r=>lookup.get(r.lesson_id)?.subject).filter((v):v is string=>!!v))).sort((a,b)=>a.localeCompare(b,'pt-BR')),[rows,lookup])
 const visible=useMemo(()=>rows.filter(r=>{
  const lesson=lookup.get(r.lesson_id)
  return lesson&&(!studentId||lesson.student_id===studentId)&&(!subject||lesson.subject===subject)
 }),[rows,lookup,studentId,subject])
 const represented=useMemo(()=>new Set(visible.map(r=>lookup.get(r.lesson_id)?.subject).filter(Boolean)).size,[visible,lookup])
 const activeStudent=students.find(s=>s.id===studentId)
 return <section id="relatorios" className="space-y-5">
  <header>
   <h2 className="text-2xl">Acompanhamento educacional</h2>
   <p className="mt-2 text-sm leading-relaxed text-mute">Consulte o histórico de aulas com relatórios aprovados e publicados pela equipe Aégis. As informações representam observações registradas, não notas ou diagnósticos automáticos.</p>
  </header>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="glass-panel rounded-xl p-4"><p className="text-sm text-mute">Relatórios publicados</p><b className="mt-1 block text-2xl">{visible.length}</b></div>
   <div className="glass-panel rounded-xl p-4"><p className="text-sm text-mute">Disciplinas acompanhadas</p><b className="mt-1 block text-2xl">{represented}</b></div>
   <div className="glass-panel rounded-xl p-4"><p className="text-sm text-mute">Última publicação</p><b className="mt-1 block text-lg">{visible[0]?date(visible[0].published_at):'—'}</b></div>
  </div>
  <div className="glass-panel grid gap-3 rounded-2xl p-4 sm:grid-cols-2">
   <label className="text-sm">Estudante
    <select className={'mt-1 w-full '+field} value={studentId} onChange={e=>setStudentId(e.target.value)}>
     <option value="">Todos os estudantes</option>
     {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
    </select>
   </label>
   <label className="text-sm">Disciplina
    <select className={'mt-1 w-full '+field} value={subject} onChange={e=>setSubject(e.target.value)}>
     <option value="">Todas as disciplinas</option>
     {subjects.map(s=><option key={s}>{s}</option>)}
    </select>
   </label>
   <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
    <p className="text-xs text-mute">{activeStudent?'Exibindo '+activeStudent.full_name:'Todos os estudantes'} · {visible.length} relatório(s)</p>
    <button type="button" className="text-sm text-blue-300 underline underline-offset-4" onClick={()=>{setStudentId('');setSubject('');setOpenAll(false)}}>Limpar filtros</button>
   </div>
  </div>
  {loading?<p role="status" className="glass-panel rounded-xl p-5">Carregando relatórios publicados…</p>:
   visible.length===0?<p className="glass-panel rounded-xl p-5 text-mute">Nenhum relatório publicado para esta seleção. Relatórios em preparação não aparecem aqui.</p>:
   <div className="space-y-4">{visible.map(r=>{
    const l=lookup.get(r.lesson_id)!
    const learner=students.find(s=>s.id===l.student_id)
    return <details key={r.id} open={openAll||undefined} className="glass-panel rounded-2xl p-5">
     <summary className="cursor-pointer text-lg">
      <span className="block font-medium">{r.title}{r.is_demo&&<span className="ml-2 rounded-md border border-amber-400/50 px-2 py-1 text-xs text-amber-200">TESTE — FICTÍCIO</span>}</span>
      <span className="mt-1 block text-sm text-mute">{learner?.full_name||'Estudante'} · {l.subject} · Aula de {date(l.starts_at)} · Publicado em {date(r.published_at)}</span>
     </summary>
     <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {Object.entries(labels).map(([k,label])=>r[k as keyof typeof labels]&&<div key={k} className="rounded-xl border border-white/10 p-4">
       <h3 className="font-semibold">{label}</h3>
       <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-mute">{r[k as keyof typeof labels]}</p>
      </div>)}
     </div>
    </details>
   })}</div>}
  <p className="text-xs text-mute">Apenas relatórios publicados e autorizados são consultados. Para esclarecimentos ou mudanças no acompanhamento, converse com a equipe Aégis.</p>
 </section>
}
