// Aégis: auditoria responsiva real em Chromium, sem logins nem envios.
import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
const base=(process.env.AEGIS_BASE_URL||'https://www.aegisedu.com.br').replace(/\/$/,'')
const sizes=[
 {width:320,height:700,label:'compacto'},
 {width:375,height:812,label:'celular'},
 {width:390,height:844,label:'celular-grande'},
 {width:768,height:1024,label:'tablet-vertical'},
 {width:1024,height:768,label:'tablet-horizontal'},
 {width:1440,height:900,label:'desktop'}
]
const browser=await chromium.launch({headless:true})
let checks=0
async function verify(label,fn){try{await fn();checks++;console.log('PASS',label)}catch(err){console.error('FAIL',label,err?.message||err);throw err}}
function withinViewport(page){return page.evaluate(()=>{
 const vw=document.documentElement.clientWidth
 const docWidth=document.documentElement.scrollWidth
 const brokenImages=[...document.querySelectorAll('img')].filter(im=>im.complete && im.naturalWidth===0).map(im=>im.getAttribute('src'))
  const root=document.querySelector('#root')
 const rootWidth=root?.scrollWidth||0
 const buttons=[...document.querySelectorAll('header a[href="/responsavel"], nav button, main a[href="/responsavel"]')]
 const clipped=buttons.filter(node=>{
  const style=getComputedStyle(node)
  if(style.display==='none'||style.visibility==='hidden')return false
  const r=node.getBoundingClientRect()
  if(r.width===0||r.height===0)return false
  return r.left < -2 || r.right > vw+2
 })
 return {vw,docWidth,rootWidth,brokenImages,clipped:clipped.map(x=>x.textContent?.trim())}
})}
try{
 await mkdir('artifacts/responsive',{recursive:true})
 for(const size of sizes){
  const ctx=await browser.newContext({viewport:{width:size.width,height:size.height},locale:'pt-BR',isMobile:size.width<600,hasTouch:size.width<600})
  const page=await ctx.newPage()
  page.setDefaultTimeout(25000)
  const jsErrors=[]
  page.on('pageerror',e=>jsErrors.push(e.message))
  await verify('homepage '+size.label+' '+size.width+'px',async()=>{
   const r=await page.goto(base+'/',{waitUntil:'domcontentloaded'})
   assert.equal(r?.status(),200)
   await page.locator('h1').first().waitFor()
   const layout=await withinViewport(page)
   assert.ok(layout.docWidth<=layout.vw+3,'Rolagem horizontal: '+JSON.stringify(layout))
   assert.deepEqual(layout.clipped,[],'Botões cortados')
   assert.ok(await page.locator('header a[href$="/responsavel"]:visible').count(),'Link do responsável ausente')
   assert.deepEqual(layout.brokenImages,[],'A homepage não deve conter imagens quebradas')
   const title=await page.locator('main h1').first().evaluate(el=>{
    const textNode=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE && n.textContent?.includes('acompanhamento'))
    if(!textNode)return null
    const start=textNode.textContent.indexOf('acompanhamento')
    const range=document.createRange()
    range.setStart(textNode,start)
    range.setEnd(textNode,start+'acompanhamento'.length)
    const rects=[...range.getClientRects()]
    return {count:rects.length,right:Math.max(...rects.map(x=>x.right)),vw:document.documentElement.clientWidth}
   })
   if(title){
    assert.equal(title.count,1,'A palavra acompanhamento está quebrada entre linhas: '+JSON.stringify(title))
    assert.ok(title.right<=title.vw+2,'A palavra acompanhamento está cortada pelo viewport: '+JSON.stringify(title))
   }
  })
  if(size.width===320||size.width===390||size.width===768||size.width===1440)
   await page.screenshot({path:'artifacts/responsive/home-'+size.width+'.png',fullPage:true,animations:'disabled'})
  if(size.width<1280)await verify('menu responsivo '+size.label,async()=>{
   const menu=page.getByRole('button',{name:'Abrir menu'})
   await menu.click()
   assert.equal(await page.getByRole('button',{name:'Fechar menu'}).getAttribute('aria-expanded'),'true')
   await page.getByRole('link',{name:'Disciplinas'}).first().click()
   assert.equal(await page.getByRole('button',{name:'Abrir menu'}).getAttribute('aria-expanded'),'false')
  })
  await verify('portal de exemplo '+size.label,async()=>{
   const r=await page.goto(base+'/responsavel/exemplo',{waitUntil:'domcontentloaded'})
   assert.equal(r?.status(),200)
   await page.getByText('DEMONSTRAÇÃO FICTÍCIA',{exact:true}).first().waitFor()
   const layout=await withinViewport(page)
   assert.ok(layout.docWidth<=layout.vw+3,'Portal excede viewport: '+JSON.stringify(layout))
   assert.deepEqual(layout.clipped,[])
   assert.deepEqual(layout.brokenImages,[],'O portal demonstrativo não deve ter logotipo quebrado')
   await page.getByRole('button',{name:'Agenda e aulas'}).click()
   await page.getByText('Cancelada',{exact:true}).first().waitFor()
   await page.getByRole('button',{name:'Acompanhamento'}).click()
   await page.getByText('Relatório de Matemática · Lucas Silva').waitFor()
  })
  if(size.width===390||size.width===768||size.width===1440)
   await page.screenshot({path:'artifacts/responsive/portal-'+size.width+'.png',fullPage:true,animations:'disabled'})
  await verify('login responsivo '+size.label,async()=>{
   const r=await page.goto(base+'/responsavel',{waitUntil:'domcontentloaded'})
   assert.equal(r?.status(),200)
   await page.getByRole('button',{name:'Entrar',exact:true}).waitFor()
   const layout=await withinViewport(page)
   assert.ok(layout.docWidth<=layout.vw+3,'Login excede viewport: '+JSON.stringify(layout))
   assert.deepEqual(layout.brokenImages,[],'Login do responsável deve mostrar marca sem imagem quebrada')
  })
  if(size.width===320||size.width===390)await verify('login administrativo sem imagem quebrada '+size.label,async()=>{
   await page.goto(base+'/admin',{waitUntil:'domcontentloaded'})
   await page.getByRole('heading',{name:'Entrar no painel'}).waitFor()
   const layout=await withinViewport(page)
   assert.deepEqual(layout.brokenImages,[])
   assert.ok(layout.docWidth<=layout.vw+3)
  })
  assert.deepEqual(jsErrors,[],size.label+' apresentou erro JavaScript')
  await ctx.close()
 }
 const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}})
 const page=await reduced.newPage()
 await verify('preferência de movimento reduzido',async()=>{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'})
  const value=await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)
  assert.equal(value,'auto')
  const animation=await page.locator('h1').first().evaluate(el=>getComputedStyle(el).animationDuration)
  assert.ok(animation==='1e-05s'||animation==='0s'||animation==='0.00001s','A animação não respeita movimento reduzido: '+animation)
 })
 await reduced.close()
 console.log('CONCLUÍDO: '+checks+' verificações responsivas de navegação e movimento')
}finally{await browser.close()}
