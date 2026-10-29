import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'

const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8')

test('A landing pública mantém CTA de planos sem apagar observações', async () => {
  const html = await read('index.html')
  assert.match(html, /const previous=field\.value\.trim\(\)/)
  assert.match(html, /previous\.includes\(intention\)/)
  assert.match(html, /previous\?previous\+'/)
})
test('Formulário mantém alternativa WhatsApp em falha de envio', async () => {
  const html = await read('index.html')
  const app = await read('src/landing.ts')
  assert.match(html, /id="formWhatsappFallback"/)
  assert.match(html, /hidden>Não foi possível enviar/)
  assert.match(app, /showWhatsAppFallback\(lead\)/)
  assert.match(app, /leadToWhatsApp\(lead\)/)
  assert.match(app, /if \(submitting\) return/)
  assert.match(app, /button\.disabled = true/)
})
test('HTML público possui campos nomeados e limites de tamanho', async () => {
  const html = await read('index.html')
  for (const id of ['name','phone','email','student','grade','school','goal','notes']) {
    assert.ok(html.includes('id="'+id+'" name="'+id+'"'),id+' sem name')
  }
  assert.match(html,/id="grade" name="grade"[^>]*maxlength="120"/)
  assert.match(html,/id="school" name="school"[^>]*maxlength="120"/)
})
test('Rotas restritas possuem cabeçalhos e tela de privacidade tem rewrite', async () => {
  const config=JSON.parse(await read('vercel.json'))
  assert.ok(config.rewrites.some(x=>x.source==='/privacidade' && x.destination==='/portal.html'))
  for (const route of ['/admin','/admin/:path*','/responsavel','/responsavel/:path*','/portal.html']) {
    const rule=config.headers.find(x=>x.source===route)
    assert.ok(rule,'Cabeçalhos faltando em '+route)
    assert.ok(rule.headers.some(x=>x.key==='X-Robots-Tag' && /noindex/.test(x.value)))
    assert.ok(rule.headers.some(x=>x.key==='Cache-Control' && x.value==='no-store'))
  }
  assert.match(await read('portal.html'),/name="robots" content="noindex,nofollow"/)
})
test('HTML pública usa rotas internas relativas', async () => {
  const html = await read('index.html')
  assert.doesNotMatch(html,/href="https:\/\/aegisedu\.com\.br\/(responsavel|privacidade)/)
  assert.match(html,/href="\/responsavel\/exemplo"/)
})
