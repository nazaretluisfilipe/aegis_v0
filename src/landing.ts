import {emptyLead, submitLead, validate, type Lead} from './lib'

/** The public HTML keeps its original layout while submissions use the same CRM as the admin panel. */
const form = document.querySelector<HTMLFormElement>('#form')
const status = document.querySelector<HTMLElement>('#status')

if (form && status) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')
  const value = (id: string) =>
    (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value.trim() ?? ''

  let submitting = false

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (submitting) return

    const consent = form.querySelector<HTMLInputElement>('.consent input[type="checkbox"]')?.checked ?? false
    const subjects = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="subject"]:checked'))
      .map(input => input.value)
    const lead: Lead = {
      ...emptyLead,
      guardianName: value('name'),
      whatsapp: value('phone'),
      email: value('email'),
      studentName: value('student'),
      age: value('age'),
      grade: value('grade'),
      school: value('school'),
      subjects,
      goal: value('goal'),
      frequency: value('frequency'),
      difficulties: value('difficulty'),
      availability: value('availability'),
      notes: value('notes'),
      consent
    }

    const errors = validate(lead)
    if (!form.reportValidity() || Object.keys(errors).length) {
      status.textContent = Object.values(errors)[0] ?? 'Verifique os campos obrigatórios.'
      return
    }

    submitting = true
    if (button) {
      button.disabled = true
      button.textContent = 'Enviando…'
    }
    status.textContent = 'Enviando sua solicitação…'

    try {
      const result = await submitLead(lead)
      if (result === 'sent') {
        form.reset()
        status.textContent = 'Solicitação enviada com sucesso. Nossa equipe entrará em contato em breve.'
      } else if (result === 'not-configured') {
        status.textContent = 'O formulário está temporariamente indisponível. Entre em contato pelo WhatsApp.'
      } else {
        status.textContent = 'Não foi possível enviar sua solicitação. Confira os campos e tente novamente.'
      }
    } catch {
      status.textContent = 'Não foi possível enviar agora. Tente novamente ou converse pelo WhatsApp.'
    } finally {
      submitting = false
      if (button) {
        button.disabled = false
        button.textContent = 'Enviar'
      }
    }
  })
}
