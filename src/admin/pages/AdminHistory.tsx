import { useEffect, useState } from 'react'
import { PageHeader, btnGhost } from '../ui'
import { supabaseAdmin as db } from '../supabaseAdmin'

type Event = { id: number; entity: string; entity_id: string | null; action: string; actor: string | null; created_at: string }
type Adjustment = { id: string; package_id: string; previous_quantity: number; new_quantity: number; reason: string; created_at: string }
const entityNames: Record<string,string> = {
 teachers: 'Professores', teacher_availability: 'Disponibilidade', lead_requests: 'Interessados',
 lessons: 'Aulas', lesson_packages: 'Pacotes', lesson_materials: 'Materiais',
 educational_reports: 'Relatórios', site_versions: 'Conteúdo do site'
}
const actionNames: Record<string,string> = { INSERT:'Inclusão', UPDATE:'Atualização', DELETE:'Remoção' }
const pageSize = 25
const field = 'rounded-xl border border-white/20 bg-[#080d19] px-3 py-2 text-white'
const date = (value:string) => new Date(value).toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'})

export default function AdminHistory() {
 const [events,setEvents] = useState<Event[]>([])
 const [adjustments,setAdjustments] = useState<Adjustment[]>([])
 const [page,setPage] = useState(0)
 const [count,setCount] = useState(0)
 const [entity,setEntity] = useState('')
 const [action,setAction] = useState('')
 const [loading,setLoading] = useState(true)
 const [error,setError] = useState('')
 async function load() {
  if (!db) return
  setLoading(true);setError('')
  let query = db.from('admin_events').select('id,entity,entity_id,action,actor,created_at',{count:'exact'}).order('id',{ascending:false})
  if (entity) query=query.eq('entity',entity)
  if (action) query=query.eq('action',action)
  const [history,changes] = await Promise.all([
   query.range(page*pageSize,(page+1)*pageSize-1),
   db.from('package_adjustments').select('id,package_id,previous_quantity,new_quantity,reason,created_at').order('created_at',{ascending:false}).limit(10)
  ])
  setLoading(false)
  if(history.error||changes.error) {
   setError('Falha ao consultar o histórico administrativo. Confira as permissões de administrador.')
   return
  }
  setEvents((history.data||[]) as Event[]);setCount(history.count||0)
  setAdjustments((changes.data||[]) as Adjustment[])
 }
 useEffect(()=>{void load()},[page,entity,action])
 const pages = Math.max(1, Math.ceil(count/pageSize))
 function downloadPage(){
  const csv = [['Data','Operação','Área','Registro','Autor'],...events.map(e=>[
   date(e.created_at),actionNames[e.action]||e.action,entityNames[e.entity]||e.entity,e.entity_id||'',e.actor||''
  ])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download='aegis-historico-pagina-'+(page+1)+'.csv';a.click()
  URL.revokeObjectURL(url)
 }
 return <div className="space-y-6">
  <PageHeader title="Histórico administrativo">Consulte alterações registradas pelo banco de dados, com responsável pela ação e horário. Registros não contêm conteúdo pedagógico.</PageHeader>
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
  <section className="glass-panel space-y-4 rounded-2xl p-5">
   <div className="flex flex-wrap items-end gap-3">
    <label className="flex flex-col gap-1 text-sm">Área
     <select className={field} value={entity} onChange={e=>{setPage(0);setEntity(e.target.value)}}>
      <option value="">Todas</option>
      {Object.entries(entityNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}
     </select>
    </label>
    <label className="flex flex-col gap-1 text-sm">Operação
     <select className={field} value={action} onChange={e=>{setPage(0);setAction(e.target.value)}}>
      <option value="">Todas</option>
      {Object.entries(actionNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}
     </select>
    </label>
    <button className={btnGhost} onClick={()=>void load()} disabled={loading}>Atualizar</button>
    <button className={btnGhost} onClick={downloadPage} disabled={!events.length}>Exportar página CSV</button>
   </div>
   {loading?<p role="status">Carregando histórico…</p>:events.length===0?<p className="text-mute">Nenhuma alteração registrada para estes filtros.</p>:
   <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
    <thead><tr className="border-b border-white/20 text-mute"><th className="py-3">Data</th><th>Operação</th><th>Área</th><th>Registro</th><th>Autor</th></tr></thead>
    <tbody>{events.map(e=><tr key={e.id} className="border-b border-white/10">
      <td className="py-3">{date(e.created_at)}</td><td>{actionNames[e.action]||e.action}</td>
      <td>{entityNames[e.entity]||e.entity}</td><td className="font-mono text-xs" title={e.entity_id||''}>{e.entity_id?.slice(0,8)||'—'}</td>
      <td className="font-mono text-xs" title={e.actor||''}>{e.actor?.slice(0,8)||'—'}</td>
    </tr>)}</tbody>
   </table></div>}
   <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-mute">{count} registros · página {page+1} de {pages}</span>
    <div className="flex gap-2">
     <button className={btnGhost} disabled={loading||page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Anterior</button>
     <button className={btnGhost} disabled={loading||page+1>=pages} onClick={()=>setPage(p=>p+1)}>Próxima</button>
    </div>
   </div>
  </section>
  <section className="glass-panel rounded-2xl p-5">
   <h2 className="mb-3 text-xl">Ajustes de saldo justificados</h2>
   <p className="mb-4 text-sm text-mute">Últimos dez ajustes de quantidade contratada, com justificativa registrada.</p>
   {adjustments.length===0?<p className="text-mute">Nenhum ajuste registrado.</p>:
   <ul className="space-y-3">{adjustments.map(a=><li key={a.id} className="rounded-xl border border-white/10 p-3">
    <p className="text-sm"><b>{a.previous_quantity} → {a.new_quantity} aulas</b> · {date(a.created_at)}</p>
    <p className="mt-1 whitespace-pre-wrap text-sm">{a.reason}</p>
    <p className="mt-1 font-mono text-xs text-mute">Pacote {a.package_id.slice(0,8)}</p>
   </li>)}</ul>}
  </section>
 </div>
}
