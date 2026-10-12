// Teste de navegação real, SEM enviar contatos, e-mails, pagamentos ou dados.
import assert from 'node:assert/strict'
import {chromium} from 'playwright'

const base=(process.env.AEGIS_BASE_URL||'https://www.aegisedu.com.br').replace(/\/$/,'')
const browser=await chromium.launch({headless:true})
let checks=0
async function check(label,fn){
  try { await fn();checks++;console.log('PASS',label)}
  catch(e){ console.error('FAIL',label, e?.message||e);throw e }
}
const desktop=await browser.newContext({viewport:{width:1366,height:850},locale:'pt-BR'})
const page=await desktop.newPage()
page.setDefaultTimeout(20000)
const failures=[]
page.on('pageerror',e=>failures.push(e.message))
try {
 await check('Homepage pública tem título e entrada do responsável',async()=>{
  const response=await page.goto(base+'/',{waitUntil:'domcontentloaded'})
  assert.equal(response?.status(),200)
  await page.locator('h1').first().waitFor()
  assert.ok(await page.locator('header a[href="/responsavel"]:visible').count())
  assert.ok(await page.locator('a[href="/responsavel/exemplo"]:visible').count())
 })
 await check('Planos comerciais publicados mostram valores aprovados',async()=>{
  await page.waitForFunction(()=>document.querySelector('#planos')?.textContent?.includes('509,99'))
  const prices=(await page.locator('#planos').innerText()).replace(/\s/g,' ')
  for (const price of ['135,50','259,99','509,99','719,99','864,90']) {
   assert.ok(prices.includes(price),'Valor ausente: '+price)
  }
 })
 await check('Formulário exige preenchimento sem enviar dados',async()=>{
  await page.getByRole('button',{name:'Enviar diagnóstico'}).click()
  assert.ok((await page.getByText('Informe o nome do responsável.').count())>0)
  assert.ok((await page.getByText('É necessário concordar com o tratamento dos dados para enviar.').count())>0)
 })
 await check('Demonstração é fictícia, pública e possui navegação entre áreas',async()=>{
  const response=await page.goto(base+'/responsavel/exemplo',{waitUntil:'domcontentloaded'})
  assert.equal(response?.status(),200)
  await page.getByText('DEMONSTRAÇÃO FICTÍCIA',{exact:true}).first().waitFor()
  await page.getByRole('button',{name:'Agenda e aulas'}).click()
  assert.ok((await page.getByText('Cancelada',{exact:true}).count())>0)
  await page.getByRole('button',{name:'Acompanhamento'}).click()
  assert.ok((await page.getByText('Relatório de Matemática · Lucas Silva').count())>0)
 })
 await check('Portal real exige login e não permite cadastro público',async()=>{
  const response=await page.goto(base+'/responsavel',{waitUntil:'domcontentloaded'})
  assert.equal(response?.status(),200)
  await page.getByRole('button',{name:'Entrar',exact:true}).waitFor()
  assert.equal(await page.locator('input[type="password"]').count(),1)
  assert.equal(await page.locator('form button:has-text("Cadastrar")').count(),0)
 })
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'pt-BR'})
 const mob=await mobile.newPage()
 mob.setDefaultTimeout(20000)
 await check('Botão de acesso permanece visível no celular',async()=>{
  const response=await mob.goto(base+'/',{waitUntil:'domcontentloaded'})
  assert.equal(response?.status(),200)
  await mob.locator('h1').first().waitFor()
  assert.ok((await mob.locator('header a[href="/responsavel"]:visible').count())>0)
 })
 await check('Demonstração abre em resolução móvel',async()=>{
  const response=await mob.goto(base+'/responsavel/exemplo',{waitUntil:'domcontentloaded'})
  assert.equal(response?.status(),200)
  await mob.getByText('DEMONSTRAÇÃO FICTÍCIA',{exact:true}).first().waitFor()
  await mob.getByRole('button',{name:'Agenda e aulas'}).click()
  assert.ok((await mob.getByText('Agendada',{exact:true}).count())>0)
 })
 await mobile.close()
 assert.deepEqual(failures,[], 'Erro não tratado no navegador')
 console.log('CONCLUÍDO: '+checks+' verificações visuais e de navegação pública em '+base)
} finally {
 await desktop.close()
 await browser.close()
}
