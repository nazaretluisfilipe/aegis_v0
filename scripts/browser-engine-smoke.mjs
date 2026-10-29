import assert from 'node:assert/strict'
import { chromium, webkit, devices } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base=(process.env.AEGIS_BASE_URL??'http://127.0.0.1:4173').replace(/\/$/,'')
const cases=[
 {label:'chrome-android-pixel5',engine:chromium,device:devices['Pixel 5']},
 {label:'webkit-iphone13',engine:webkit,device:devices['iPhone 13']}
]
await mkdir('artifacts/responsive',{recursive:true})
for(const {label,engine,device} of cases){
 const browser=await engine.launch({headless:true})
 try{
  const context=await browser.newContext({...device,locale:'pt-BR',reducedMotion:'reduce'})
  const page=await context.newPage()
  page.setDefaultTimeout(12000)
  const failures=[]
  page.on('pageerror',e=>failures.push(e.message))
  // Jamais criar leads reais durante testes.
  await page.route('**/rest/v1/lead_requests**',r=>r.abort('failed'))
  const response=await page.goto(base+'/',{waitUntil:'domcontentloaded'})
  assert.equal(response?.status(),200,label+': homepage')
  const dimension=await page.evaluate(()=>({
   viewport:document.documentElement.clientWidth,
   width:document.documentElement.scrollWidth
  }))
  assert.ok(dimension.width<=dimension.viewport+3,label+': overflow '+JSON.stringify(dimension))
  const menu=page.locator('#menuBtn')
  await menu.click()
  assert.equal(await menu.getAttribute('aria-expanded'),'true',label+': abre menu')
  await page.keyboard.press('Escape')
  assert.equal(await menu.getAttribute('aria-expanded'),'false',label+': Escape')
  await page.locator('[data-portal-tab="relatorio"]').click()
  assert.equal(await page.locator('#portal-panel-relatorio').isVisible(),true,label+': relatório')
  await page.locator('[data-portal-tab="evolucao"]').click()
  assert.equal(await page.locator('#portal-panel-relatorio').isVisible(),false,label+': troca de aba')
  assert.equal(await page.locator('#portal-panel-evolucao').isVisible(),true,label+': evolução')
  await page.locator('[data-portal-tab="historico"]').click()
  assert.ok((await page.locator('#portal-panel-historico').innerText()).includes('Aula cancelada'))
  await page.screenshot({path:'artifacts/responsive/'+label+'.png',fullPage:true})
  assert.deepEqual(failures,[],label+': erro JS '+failures.join(' | '))
  console.log('PASS '+label+': menu, abas, largura e console — '+dimension.viewport+' CSS px')
  await context.close()
 }finally{await browser.close()}
}
console.log('AVISO: emulação Chromium/WebKit no CI não substitui dispositivos Android e iOS físicos.')
