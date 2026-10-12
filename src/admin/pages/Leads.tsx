import {useEffect,useMemo,useState,type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {supabaseAdmin as db} from '../supabaseAdmin'
import {PageHeader,btn,btnGhost} from '../ui'

type Lead={
 id:string;guardian_name:string;email:string;phone:string;student_name:string;school_grade:string;
 subjects:string;goal:string;status:string;created_at:string;admin_notes:string;follow_up_at:string|null;
 converted_family_id:string|null
}
const stages:Record<string,string>={new:'Novo',contacted:'Contatado',qualified:'Qualificado',proposal:'Proposta enviada',converted:'Convertido',closed:'Encerrado'}
const activeStages=['new','contacted','qualified','proposal','closed']
const field='w-full rounded-xl border border-white/20 bg-[#080d19] p-3 text-white'
const localDate=(date:string|null)=>date?new Date(new Date(date).getTime()-new Date(date).getTimezoneOffset()*60000).toISOString().slice(0,16):''
const showDate=(date:string)=>new Date(date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})
const waPhone=(value:string)=>{const phone=value.replace(/\D/g,'');return phone.startsWith('55')?phone:'55'+phone}

export default function Leads(){
 const [rows,setRows]=useState<Lead[]>([])
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
 const [loading,setLoading]=useState(true)
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('')
 const [selected,setSelected]=useState(''),[notes,setNotes]=useState(''),[stage,setStage]=useState('new'),[followUp,setFollowUp]=useState('')
 async function load(){
  if(!db)return
  setLoading(true)
  const r=await db.from('lead_requests').select('id,guardian_name,email,phone,student_name,school_grade,subjects,goal,status,created_at,admin_notes,follow_up_at,converted_family_id').order('created_at',{ascending:false}).limit(200)
  setLoading(false)
  if(r.error){setError('Não foi possível carregar os interessados.');return}
  setRows((r.data||[]) as Lead[])
 }
 useEffect(()=>{void load()},[])
 const visible=useMemo(()=>rows.filter(l=>(!filter||l.status===filter)&&
  [l.guardian_name,l.email,l.phone,l.student_name,l.subjects].join(' ').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim())),[rows,filter,query])
 const pending=rows.filter(l=>l.follow_up_at&&l.status!=='converted'&&l.status!=='closed'&&new Date(l.follow_up_at)<=new Date()).length
 function edit(l:Lead){
  setSelected(l.id);setNotes(l.admin_notes||'');setStage(l.status);setFollowUp(localDate(l.follow_up_at));setError('');setNotice('')
  window.scrollTo({top:0,behavior:'smooth'})
 }
 async function save(e:FormEvent){
  e.preventDefault();if(!db||!selected||busy)return
  setError('');setNotice('');setBusy(true)
  const item=rows.find(x=>x.id===selected)
  if(!item){setBusy(false);return}
  const r=await db.from('lead_requests').update({
   status:item.status==='converted'?'converted':stage,
   admin_notes:notes.trim(),
   follow_up_at:followUp?new Date(followUp).toISOString():null
  }).eq('id',selected).select('id').single()
  setBusy(false)
  if(r.error){setError('Não foi possível salvar as anotações ou o andamento.');return}
  setNotice('Atendimento atualizado no Supabase.');setSelected('');await load()
 }
 async function convert(l:Lead){
  if(!db||busy||l.converted_family_id)return
  if(!window.confirm('Criar a família, o responsável e o estudante a partir deste contato? Esta ação não cria login nem envia e-mails.'))return
  setBusy(true);setError('');setNotice('')
  const r=await db.rpc('aegis_convert_lead',{p_lead_id:l.id})
  setBusy(false)
  if(r.error){
   setError(r.error.code==='23505'
    ? 'E-mail já cadastrado em outra família. Verifique os responsáveis antes de converter.'
    : 'Não foi possível converter. Confira nome do estudante (mínimo 2 caracteres), permissões e dados do contato.')
   return
  }
  setSelected('');setNotice('Interessado convertido em família e estudante. Vincule a conta autenticada na área de responsáveis.');await load()
 }
 return <div className="space-y-6">
  <PageHeader title="Interessados e funil comercial">Acompanhe o atendimento, programe retornos e converta contatos em famílias cadastradas. Mensagens e convites não são enviados automaticamente.</PageHeader>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-blue-500/40 p-4">{notice}</p>}
  <section className="grid gap-3 sm:grid-cols-3">
   <div className="glass-panel rounded-2xl p-4"><p className="text-mute text-sm">Interessados carregados</p><p className="text-3xl">{rows.length}</p></div>
   <div className="glass-panel rounded-2xl p-4"><p className="text-mute text-sm">Retornos pendentes</p><p className="text-3xl">{pending}</p></div>
   <div className="glass-panel rounded-2xl p-4"><p className="text-mute text-sm">Convertidos</p><p className="text-3xl">{rows.filter(l=>l.status==='converted').length}</p></div>
  </section>
  {selected&&<section className="glass-panel space-y-4 rounded-2xl p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">Registrar atendimento</h2><button className={btnGhost} onClick={()=>setSelected('')}>Fechar</button></div>
   <p className="text-sm text-mute">{rows.find(l=>l.id===selected)?.guardian_name}</p>
   <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
    <label>Etapa<select className={field} disabled={rows.find(l=>l.id===selected)?.status==='converted'} value={stage} onChange={e=>setStage(e.target.value)}>
     {Object.entries(stages).filter(([s])=>s!=='converted'||stage==='converted').map(([s,label])=><option key={s} value={s}>{label}</option>)}
    </select></label>
    <label>Próximo retorno (horário local)<input type="datetime-local" className={field} value={followUp} onChange={e=>setFollowUp(e.target.value)}/></label>
    <label className="sm:col-span-2">Anotações internas<textarea rows={4} maxLength={3000} className={field} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Último contato, objeções, plano solicitado e próximos passos."/></label>
    <button className={btn+' sm:col-span-2'} disabled={busy}>{busy?'Salvando…':'Salvar atendimento'}</button>
   </form>
  </section>}
  <section className="glass-panel space-y-3 rounded-2xl p-5">
   <div className="flex flex-wrap items-center gap-3">
    <input aria-label="Pesquisar interessados" className={field+' flex-1'} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar nome, e-mail, telefone ou matéria"/>
    <select aria-label="Filtrar por etapa" className={field} value={filter} onChange={e=>setFilter(e.target.value)}>
     <option value="">Todas as etapas</option>
     {Object.entries(stages).map(([s,label])=><option value={s} key={s}>{label}</option>)}
    </select>
    <button className={btnGhost} disabled={loading} onClick={()=>void load()}>Atualizar</button>
   </div>
   <p className="text-xs text-mute">Exibindo {visible.length} de {rows.length} contatos carregados (até 200 mais recentes).</p>
  </section>
  {loading?<p role="status">Carregando contatos…</p>:visible.length===0?<p className="text-mute">Nenhum interessado encontrado.</p>:
   visible.map(l=><article className="glass-panel space-y-3 rounded-2xl p-5" key={l.id}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl">{l.guardian_name}</h2>
      <p className="text-sm text-mute">{l.email} · {l.phone}</p></div>
     <span className="rounded-full border border-white/20 px-3 py-1 text-xs">{stages[l.status]||l.status}</span>
    </div>
    <p className="text-sm">{l.student_name} · {l.school_grade} · {l.subjects}</p>
    <p className="whitespace-pre-wrap text-sm text-mute">{l.goal}</p>
    {l.admin_notes&&<p className="whitespace-pre-wrap rounded-xl border border-white/10 p-3 text-sm">Notas: {l.admin_notes}</p>}
    <p className="text-xs text-mute">Recebido em {showDate(l.created_at)}{l.follow_up_at?' · Retorno em '+showDate(l.follow_up_at):''}</p>
    <div className="flex flex-wrap items-center gap-2">
     <button className={btnGhost} onClick={()=>edit(l)}>Editar atendimento</button>
     <a className={btnGhost} href={'https://wa.me/'+waPhone(l.phone)} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
     {l.converted_family_id
      ? <Link className={btnGhost} to="/familias">Família cadastrada</Link>
      : <button className={btn} disabled={busy} onClick={()=>void convert(l)}>Converter em família</button>}
    </div>
   </article>)}
  <p className="text-xs text-mute">O cadastro convertido não cria acesso automaticamente. Convide e vincule o responsável com e-mail confirmado em Responsáveis e alunos.</p>
 </div>
}
