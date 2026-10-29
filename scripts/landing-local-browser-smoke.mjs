import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = (process.env.AEGIS_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')
const browser = await chromium.launch({headless:true})
let done=0
const check=async(name,fn)=>{await fn();console.log('PASS',name);done++}
try {
 for(const width of [320,360,375,390,768,1024,1366]){
  const ctx=await browser.newContext({viewport:{width,height:820},locale:'pt-BR',reducedMotion:'reduce'})
  const page=await ctx.newPage()
  page.setDefaultTimeout(10000)
  const errors=[]
  page.on('pageerror',err=>errors.push(err.message))
  // Defensive: even if CI accidentally supplies production keys, never create a real lead.
  await page.route('**/rest/v1/lead_requests**',route=>route.abort('failed'))
  await check('homepage local '+width+'px',async()=>{
   const response=await page.goto(base+'/',{waitUntil:'domcontentloaded'})
   assert.equal(response?.status(),200)
   await page.locator('#portal-preview-not-used, #area-responsavel').first().waitFor()
   assert.equal(await page.locator('.portal-preview-tab').count(),5)
   assert.ok((await page.locator('#portal-showcase-title').innerText()).includes('área do responsável'))
   assert.equal(await page.locator('#form button[type="submit"]').count(),1)
   assert.ok((await page.locator('img[src="/logo.svg"]').count())>=2)
   const dimensions=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,body:document.documentElement.scrollWidth}))
   assert.ok(dimensions.body<=dimensions.viewport+3,JSON.stringify(dimensions))
   const title=await page.locator('main h1').first().evaluate(el=>{
    const textNode=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE && n.textContent?.includes('acompanhamento'))
    if(!textNode)return null
    const start=textNode.textContent.indexOf('acompanhamento')
    const range=document.createRange()
    range.setStart(textNode,start)
    range.setEnd(textNode,start+'acompanhamento'.length)
    return {right:Math.max(...[...range.getClientRects()].map(r=>r.right)),vw:document.documentElement.clientWidth}
   })
   if(title)assert.ok(title.right<=title.vw+2,'Título cortado em '+width+'px: '+JSON.stringify(title))

  })
  await check('cinco abas da demonstração '+width+'px',async()=>{
   await page.locator('[data-portal-tab="materiais"]').click()
   assert.equal(await page.locator('#portal-panel-materiais').isVisible(),true)
   assert.equal(await page.locator('#portal-panel-proxima').isVisible(),false)
   assert.equal(await page.locator('[data-portal-tab="materiais"]').getAttribute('aria-selected'),'true')
   await page.locator('[data-portal-tab="historico"]').click()
   assert.ok((await page.locator('#portal-panel-historico').innerText()).includes('Aula cancelada'))
   await page.locator('[data-portal-tab="proxima"]').click()
   assert.ok((await page.locator('#portal-panel-proxima').innerText()).includes('05/11/2026'))
  })
  await check('preserva observações no CTA '+width+'px',async()=>{
   await page.locator('#notes').fill('Uma observação já digitada pelo responsável.')
   await page.locator('[data-plan]').first().click()
   const notes=await page.locator('#notes').inputValue()
   assert.ok(notes.includes('Uma observação já digitada'))
   assert.ok(notes.includes('Tenho interesse no plano'))
   await page.locator('[data-plan]').first().click()
   const repeated=await page.locator('#notes').inputValue()
   assert.equal(repeated,notes,'O mesmo clique não deve duplicar observações.')
  })
  await check('falha do formulário mantém dados e WhatsApp '+width+'px',async()=>{
   await page.locator('#name').fill('Pessoa de Teste')
   await page.locator('#phone').fill('(41) 99999-9999')
   await page.locator('#email').fill('pessoa.teste@example.invalid')
   await page.locator('#student').fill('Estudante Fictício')
   await page.locator('#grade').fill('8º ano')
   await page.locator('input[name="subject"][value="Matemática"]').check()
   await page.locator('#goal').selectOption({label:'Recuperar a base'})
   await page.locator('.consent input[type="checkbox"]').check()
   await page.locator('#form button[type="submit"]').click()
   await page.locator('#formWhatsappFallback:visible').waitFor()
   assert.equal(await page.locator('#name').inputValue(),'Pessoa de Teste')
   const fallback=await page.locator('#formWhatsappFallback').getAttribute('href')
   assert.ok(fallback.startsWith('https://wa.me/554197655584?text='))
   assert.ok(new URL(fallback).searchParams.get('text')?.includes('Pessoa de Teste'))
  })
  if(width<=360){
   await check('menu mobile abre e fecha com Escape',async()=>{
    const menu=page.locator('#menuBtn')
    await menu.click()
    assert.equal(await menu.getAttribute('aria-expanded'),'true')
    await page.keyboard.press('Escape')
    assert.equal(await menu.getAttribute('aria-expanded'),'false')
    await menu.click()
    await page.locator('#mobileNav a[href="#disciplinas"]').click()
    assert.equal(await menu.getAttribute('aria-expanded'),'false')
   })
  }
  assert.deepEqual(errors,[],'Erros JavaScript: '+errors.join('; '))
  await ctx.close()
 }
 console.log('CONCLUÍDO: '+done+' testes locais da landing, sem enviar dados reais.')
}finally{await browser.close()}
