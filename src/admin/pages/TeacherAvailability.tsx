import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, btn, btnGhost } from '../ui'
import { supabaseAdmin as db } from '../supabaseAdmin'

type Teacher = { id: string; full_name: string; subjects: string; active: boolean }
type Slot = { id: string; teacher_id: string; weekday: number; start_time: string; end_time: string }
const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const field = 'mt-1 w-full rounded-xl border border-white/20 bg-[#080d19] p-3 text-white'
const time = (value: string) => value.slice(0, 5)
const initial = { weekday: '1', start_time: '14:00', end_time: '18:00' }

export default function TeacherAvailability() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [teacherId, setTeacherId] = useState('')
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function reload() {
    if (!db) return
    setLoading(true)
    const [t, s] = await Promise.all([
      db.from('teachers').select('id,full_name,subjects,active').order('full_name'),
      db.from('teacher_availability').select('id,teacher_id,weekday,start_time,end_time').order('weekday').order('start_time')
    ])
    setLoading(false)
    if (t.error || s.error) {
      setError('Não foi possível carregar a agenda. Confira se a migração de disponibilidade foi instalada.')
      return
    }
    setTeachers((t.data || []) as Teacher[])
    setSlots((s.data || []) as Slot[])
  }
  useEffect(() => { void reload() }, [])
  const selected = teachers.find(t => t.id === teacherId)
  const teacherSlots = useMemo(() => slots.filter(s => s.teacher_id === teacherId), [slots, teacherId])
  async function add(e: FormEvent) {
    e.preventDefault()
    if (!db || busy || !teacherId) return
    setError(''); setNotice('')
    const weekday = Number(form.weekday)
    if (form.start_time >= form.end_time) {
      setError('O horário de término deve ser posterior ao início.')
      return
    }
    if (teacherSlots.some(s => s.weekday === weekday && time(s.start_time) < form.end_time && time(s.end_time) > form.start_time)) {
      setError('Este intervalo se sobrepõe a outro horário já cadastrado.')
      return
    }
    setBusy(true)
    try {
      const r = await db.from('teacher_availability').insert({
        teacher_id: teacherId, weekday, start_time: form.start_time, end_time: form.end_time
      })
      if (r.error) throw r.error
      await reload()
      setNotice('Horário semanal registrado no Supabase.')
    } catch {
      setError('Não foi possível salvar. Verifique sobreposição e permissões do usuário.')
    } finally { setBusy(false) }
  }
  async function remove(id: string) {
    if (!db || busy) return
    setBusy(true); setError(''); setNotice('')
    const r = await db.from('teacher_availability').delete().eq('id', id).select('id').single()
    if (r.error) setError('Não foi possível remover este intervalo.')
    else { await reload(); setNotice('Disponibilidade removida.') }
    setBusy(false)
  }
  return <div className="space-y-6">
    <PageHeader title="Disponibilidade dos professores">
      Configure intervalos semanais de atendimento. As horas são interpretadas no horário de Brasília (America/Sao_Paulo).
      O agendamento verifica esses intervalos e impede conflitos quando um professor cadastrado é selecionado.
    </PageHeader>
    {error && <p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-blue-500/40 p-4">{notice}</p>}
    <div className="glass-panel space-y-4 rounded-2xl p-5">
      <label className="block">Professor
        <select className={field} value={teacherId} onChange={e => { setTeacherId(e.target.value); setError(''); setNotice('') }}>
          <option value="">Selecione um professor</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}{t.active ? '' : ' (inativo)'}</option>)}
        </select>
      </label>
      {selected && <>
        <p className="text-sm text-mute">Disciplinas: {selected.subjects || 'Não informadas'} · {selected.active ? 'Ativo' : 'Inativo'}</p>
        <form className="grid gap-4 sm:grid-cols-4" onSubmit={add}>
          <label>Dia da semana<select className={field} value={form.weekday} onChange={e => setForm({ ...form, weekday: e.target.value })}>
            {weekdays.map((d, i) => <option value={i} key={d}>{d}</option>)}
          </select></label>
          <label>Início<input required type="time" className={field} value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></label>
          <label>Término<input required type="time" className={field} value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></label>
          <button disabled={busy || !selected.active} className={btn + ' self-end'}>{busy ? 'Salvando…' : 'Adicionar intervalo'}</button>
        </form>
      </>}
    </div>
    {selected && <section className="glass-panel rounded-2xl p-5">
      <h2 className="mb-4 text-xl">Agenda semanal</h2>
      {loading ? <p>Carregando…</p> : teacherSlots.length === 0
        ? <p className="text-mute">Nenhum intervalo definido. O professor ainda pode ser atribuído a aulas, como na configuração anterior.</p>
        : <ul className="space-y-2">{teacherSlots.map(s => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3">
          <span><b>{weekdays[s.weekday]}</b> · {time(s.start_time)} às {time(s.end_time)}</span>
          <button disabled={busy} className={btnGhost} onClick={() => void remove(s.id)}>Remover intervalo</button>
        </li>)}</ul>}
      <p className="mt-4 text-xs text-mute">Dica: cadastre todos os intervalos em que o professor atende. As aulas já existentes são preservadas.</p>
    </section>}
    <Link className={btnGhost} to="/professores">Voltar ao cadastro de professores</Link>
  </div>
}
