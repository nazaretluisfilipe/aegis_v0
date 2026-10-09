import { site } from './config'

/** Link do WhatsApp; sem número configurado, cai no formulário (#diagnostico) em vez de gerar link quebrado. */
export function wa(message: string): { href: string; external: boolean } {
  if (!site.whatsappNumber) return { href: '#diagnostico', external: false }
  return { href: `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`, external: true }
}

export interface Lead {
  guardianName: string; whatsapp: string; email: string
  studentName: string; age: string; grade: string; school: string
  subjects: string[]; goal: string; difficulties: string; availability: string; frequency: string; notes: string
  consent: boolean; website: string // 'website' é o campo isca (honeypot) anti-spam
}

export const emptyLead: Lead = {
  guardianName: '', whatsapp: '', email: '', studentName: '', age: '', grade: '', school: '',
  subjects: [], goal: '', difficulties: '', availability: '', frequency: '', notes: '', consent: false, website: '',
}

export function validate(l: Lead) {
  const e: Partial<Record<keyof Lead, string>> = {}
  const d = l.whatsapp.replace(/\D/g, '')
  if (l.guardianName.trim().length < 3) e.guardianName = 'Informe o nome do responsável.'
  if (d.length < 10 || d.length > 13) e.whatsapp = 'Informe o WhatsApp com DDD.'
  if (!/^\S+@\S+\.\S+$/.test(l.email)) e.email = 'Informe um e-mail válido.'
  if (!l.studentName.trim()) e.studentName = 'Informe o nome do aluno.'
  if (!l.grade.trim()) e.grade = 'Informe a série ou o ano.'
  if (!l.subjects.length) e.subjects = 'Escolha ao menos uma disciplina.'
  if (!l.goal) e.goal = 'Escolha o principal objetivo.'
  if (!l.consent) e.consent = 'É necessário concordar com o tratamento dos dados para enviar.'
  return e
}

export type SubmitResult = 'sent' | 'not-configured' | 'error'

/** Envia o lead ao endpoint (Google Apps Script). NUNCA retorna 'sent' sem confirmação JSON {ok:true} do servidor. */
export async function submitLead(l: Lead): Promise<SubmitResult> {
  if (l.website) return 'sent' // bot: finge sucesso, não envia
  if (!site.leadsEndpoint) return 'not-configured'
  try {
    const { consent, website, ...data } = l
    void website
    const res = await fetch(site.leadsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS no Apps Script
      body: JSON.stringify({ ...data, consent, source: location.href, submittedAt: new Date().toISOString() }),
    })
    const json = await res.json()
    return json && json.ok === true ? 'sent' : 'error'
  } catch {
    return 'error'
  }
}

export function leadToWhatsApp(l: Lead): string {
  return [
    `Olá! Sou ${l.guardianName}, responsável por ${l.studentName} (${l.grade}).`,
    `Disciplina(s): ${l.subjects.join(', ')}. Objetivo: ${l.goal}.`,
    l.difficulties && `Dificuldades: ${l.difficulties}.`,
    l.availability && `Disponibilidade: ${l.availability}.`,
    l.frequency && `Frequência desejada: ${l.frequency}.`,
  ].filter(Boolean).join(' ')
}
