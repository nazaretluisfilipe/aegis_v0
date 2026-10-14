/**
 * CONFIGURAÇÃO CENTRAL DO SITE
 * Para ativar o WhatsApp em TODOS os botões, defina o número em UM lugar:
 *   - variável de ambiente VITE_WHATSAPP_NUMBER (recomendado), ou
 *   - a constante WHATSAPP_NUMBER abaixo.
 * Formato: só dígitos, com 55 + DDD + número. Ex.: 5541999999999
 * Enquanto estiver vazio, os botões levam ao formulário (nenhum link quebrado).
 */
const WHATSAPP_NUMBER = ''

const env = import.meta.env

export const site = {
  name: 'Aégis Educational',
  short: 'Aégis Educational',
  url: (env.VITE_SITE_URL as string | undefined) ?? '',
  whatsappNumber: ((env.VITE_WHATSAPP_NUMBER as string | undefined) || WHATSAPP_NUMBER).replace(/\D/g, ''),
  email: (env.VITE_CONTACT_EMAIL as string | undefined) ?? '',
  leadsEndpoint: (env.VITE_LEADS_ENDPOINT as string | undefined) ?? '',
}

/** Mensagens pré-preenchidas por contexto. */
export const messages = {
  general: 'Olá, gostaria de saber mais sobre o acompanhamento da Aégis Educational.',
  plan: (label: string) => `Olá, tenho interesse no plano "${label}" da Aégis Educational.`,
  single: 'Olá, tenho interesse em uma aula individual na Aégis Educational.',
  teacher: 'Olá, sou professor(a) e gostaria de conversar sobre fazer parte da equipe da Aégis Educational.',
}

export const subjects = ['Matemática', 'Física', 'Química'] as const

/** Preços informados pela empresa. Valores por aula e economia são CALCULADOS a partir destes números. */
export const singleLesson = { label: 'Aula individual', lessons: 1, price: 135.5 }
export const plans = [
  { id: '2', label: '2 aulas por mês', lessons: 2, price: 259.99, note: 'Para manter contato constante com a matéria.' },
  { id: '4', label: '4 aulas por mês', lessons: 4, price: 509.99, note: 'Uma aula por semana: o ritmo que dá continuidade ao trabalho.', featured: true },
  { id: '6', label: '6 aulas por mês', lessons: 6, price: 719.99, note: 'Para quem precisa de mais volume antes de provas ou para recuperar base.' },
  { id: '8', label: '8 aulas por mês', lessons: 8, price: 864.9, note: 'Duas aulas por semana, com o menor valor por aula.' },
]

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
