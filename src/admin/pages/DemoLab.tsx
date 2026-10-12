import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {PageHeader,btn,btnGhost} from '../ui'
import {supabaseAdmin as db} from '../supabaseAdmin'

type Scenario={
 id:string;created_at:string;family_id:string;guardian_id:string;student_id:string;
 teacher_id:string;package_id:string;completed_lesson_id:string;scheduled_lesson_id:string;
 cancelled_lesson_id:string;report_id:string;lead_id:string
}
type Check={label:string;detail:string;ok:boolean;route:string}
const sections=[
 {route:'/familias',title:'Responsáveis e alunos',help:'Abra a família [TESTE — FICTÍCIO] e confira os dois cadastros.'},
 {route:'/professores',title:'Professores',help:'Verifique o professor demonstrativo e seu cadastro sem remuneração real.'},
 {route:'/planos',title:'Planos e saldos',help:'Pacote de 8 aulas: 1 realizada, 1 agendada, 1 cancelada e 7 restantes.'},
 {route:'/aulas',title:'Agendamento e aulas',help:'Edite a aula futura fictícia e confira o controle de status e o saldo.'},
 {route:'/relatorios',title:'Relatórios pedagógicos',help:'Veja o relatório publicado, sempre identificado como ficção.'},
 {route:'/interessados',title:'Funil comercial',help:'Altere a etapa do lead de teste e experimente a conversão sem contato real.'},
 {route:'/historico',title:'Histórico administrativo',help:'Consulte os eventos de inclusão gerados pela demonstração.'}
]
export default function DemoLab(){
 const [scenario,setScenario]=useState<Scenario|null>(null)
 const [checks,setChecks]=useState<Check[]>([])
 const [busy,setBusy]=useState(false)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 async function verify(s:Scenario) {
  if(!db)return
  const queries=await Promise.all([
   db.from('families').select('id,is_demo').eq('id',s.family_id).maybeSingle(),
   db.from('guardians').select('id,is_demo').eq('id',s.guardian_id).maybeSingle(),
   db.from('students').select('id,is_demo').eq('id',s.student_id).maybeSingle(),
   db.from('teachers').select('id,is_demo').eq('id',s.teacher_id).maybeSingle(),
   db.from('lesson_packages').select('id,is_demo,included_lessons').eq('id',s.package_id).maybeSingle(),
   db.from('lessons').select('id,is_demo,status').in('id',[s.completed_lesson_id,s.scheduled_lesson_id,s.cancelled_lesson_id]),
   db.from('educational_reports').select('id,is_demo,status').eq('id',s.report_id).maybeSingle(),
   db.from('lead_requests').select('id,is_demo,status').eq('id',s.lead_id).maybeSingle()
  ])
  if(queries.some(q=>q.error)){setError('Algum registro não pôde ser verificado no Supabase. Consulte as permissões.');return}
  const [f,g,student,t,p,l,r,lead]=queries
  const lessons=(l.data||[]) as {id:string;is_demo:boolean;status:string}[]
  const lesson=(id:string,status:string)=>lessons.some(x=>x.id===id&&x.status===status&&x.is_demo)
  setChecks([
   {label:'Família e responsável',detail:'Ambos identificados como TESTE.',ok:!!f.data?.is_demo&&!!g.data?.is_demo,route:'/familias'},
   {label:'Estudante fictício',detail:'Vinculado à família de demonstração.',ok:!!student.data?.is_demo,route:'/familias'},
   {label:'Professor fictício',detail:'Cadastro de demonstração separado da equipe real.',ok:!!t.data?.is_demo,route:'/professores'},
   {label:'Plano de oito aulas',detail:'O pacote é fictício e não possui valor de cobrança.',ok:!!p.data?.is_demo&&p.data?.included_lessons===8,route:'/planos'},
   {label:'Consumo de aulas',detail:'Uma realizada consome 1 de 8; cancelada e agendada não consomem.',ok:lesson(s.completed_lesson_id,'completed')&&lesson(s.scheduled_lesson_id,'scheduled')&&lesson(s.cancelled_lesson_id,'cancelled'),route:'/aulas'},
   {label:'Relatório publicado',detail:'Exemplo pedagógico explicitamente fictício.',ok:!!r.data?.is_demo&&r.data?.status==='published',route:'/relatorios'},
   {label:'Interessado de teste',detail:'O contato é fictício e não recebe mensagens.',ok:!!lead.data?.is_demo,route:'/interessados'}
  ])
 }
 async function load(){
  if(!db){setLoading(false);setError('Supabase não configurado.');return}
  setLoading(true);setError('')
  const r=await db.from('demo_scenarios').select('*').eq('scenario_key','operacao_basica').maybeSingle()
  if(r.error){setError('Não foi possível carregar o laboratório. Confira a migração e seu acesso de administrador.');setLoading(false);return}
  const s=(r.data||null) as Scenario|null
  setScenario(s)
  if(s)await verify(s)
  else setChecks([])
  setLoading(false)
 }
 useEffect(()=>{void load()},[])
 async function generate(){
  if(!db||busy||scenario)return
  if(!window.confirm('Gerar um cenário inteiramente FICTÍCIO no Supabase? Os registros ficarão nos cadastros até serem removidos em uma futura limpeza administrativa. Nenhuma mensagem será enviada.'))return
  setBusy(true);setError('');setNotice('')
  const r=await db.rpc('aegis_create_demo_scenario')
  if(r.error)setError('Não foi possível criar o cenário. Confira sua autorização administrativa e as migrações do laboratório.')
  else{setNotice('Cenário TESTE — FICTÍCIO gravado com sucesso. Nenhum cliente ou professor foi contatado.');await load()}
  setBusy(false)
 }
 return <div className="space-y-7">
  <PageHeader title="Laboratório de testes">Experimente a gestão com registros reais no banco, mas inteiramente fictícios. Nenhuma cobrança, aula externa ou convite é realizado.</PageHeader>
  <section className="rounded-2xl border-2 border-amber-400/60 bg-amber-500/10 p-5" role="note">
   <p className="text-lg font-semibold text-amber-200">AMBIENTE DE TREINAMENTO — DADOS FICTÍCIOS</p>
   <p className="mt-2 text-sm leading-relaxed">Os cadastros de demonstração são identificados com o prefixo <b>[TESTE — FICTÍCIO]</b> e a marca técnica <b>is_demo</b>. Eles não representam pessoas, receitas ou professores reais. O botão abaixo não cria contas de login, não envia e-mails nem dispara WhatsApp.</p>
  </section>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-blue-500/40 p-4">{notice}</p>}
  <section className="glass-panel rounded-2xl p-5">
   <h2 className="mb-2 text-xl">Cenário: operação educacional completa</h2>
   <p className="mb-4 text-sm text-mute">Uma família, um responsável, um estudante, um professor, oito aulas contratadas, três aulas em estados diferentes, um relatório publicado e um interessado comercial.</p>
   {loading?<p role="status">Consultando Supabase…</p>:scenario?
    <div className="space-y-3">
     <p className="text-sm"><b>Cenário criado</b> em {new Date(scenario.created_at).toLocaleString('pt-BR')}.</p>
     <p className="text-sm text-mute">A criação é idempotente: o sistema mantém um único cenário padrão, evitando gerar cópias a cada clique.</p>
     <button className={btnGhost} onClick={()=>void load()} disabled={busy}>Atualizar verificações</button>
    </div>:
    <button disabled={busy} className={btn} onClick={()=>void generate()}>{busy?'Criando cenário…':'Criar dados TESTE — FICTÍCIO'}</button>}
  </section>
  {scenario&&<>
   <section className="glass-panel rounded-2xl p-5">
    <h2 className="mb-4 text-xl">Verificações do banco</h2>
    <div className="grid gap-3 sm:grid-cols-2">{checks.map(c=><div className="rounded-xl border border-white/15 p-4" key={c.label}>
     <p className="font-medium"><span aria-hidden className={c.ok?'text-emerald-300':'text-amber-300'}>{c.ok?'✓':'!'}</span> {c.label}</p>
     <p className="mt-1 text-sm text-mute">{c.detail}</p>
     <Link className="mt-3 inline-block text-sm text-blue-300 underline underline-offset-4" to={c.route}>Abrir área</Link>
    </div>)}</div>
    <p className="mt-4 text-xs text-mute">As verificações consultam o Supabase no momento em que você atualiza. Não substituem testes de login com contas de responsáveis.</p>
   </section>
   <section className="glass-panel rounded-2xl p-5"><h2 className="mb-4 text-xl">Roteiro para conhecer cada módulo</h2>
    <ol className="space-y-4">{sections.map((x,i)=><li key={x.route} className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
     <div className="max-w-xl"><p className="font-medium">{i+1}. {x.title}</p><p className="mt-1 text-sm text-mute">{x.help}</p></div>
     <Link className={btnGhost} to={x.route}>Testar módulo</Link>
    </li>)}</ol>
   </section>
  </>}
  <p className="text-xs text-mute">Ação restrita aos administradores. Dados de demonstração permanecem marcados como fictícios e não são automaticamente eliminados ou usados para faturamento.</p>
 </div>
}
