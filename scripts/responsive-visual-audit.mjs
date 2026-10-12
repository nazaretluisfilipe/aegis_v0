// AEGIS AUDITORIA VISUAL SOMENTE LEITURA. Nao envia formularios nem toca em contas.
import {chromium} from 'playwright'
const browser=await chromium.launch({headless:true})
const base='https://www.aegisedu.com.br'
const sizes=[['desktop',1440,900],['laptop',1024,768],['tablet820',820,1180],['tablet768',768,1024],['phone390',390,844],['phone320',320,700]]
let i=0
const shots=new Set(['home-desktop','home-laptop','home-tablet820','home-tablet768','home-phone390','home-phone320','plans-desktop','plans-tablet768','plans-phone390','portal-desktop','portal-tablet768','portal-phone390','login-phone390','admin-phone390','agenda-phone390','reports-phone390'])
async function screenshot(page,label){
 if(!shots.has(label))return
 const buf=await page.screenshot({type:'jpeg',quality:52,animations:'disabled',fullPage:false})
 const b64=buf.toString('base64')
 console.log('AEGIS_SCREEN_BEGIN|'+label+'|'+b64.length)
 let idx=0
 for(let n=0;n<b64.length;n+=3500) console.log('AEGIS_SCREEN_CHUNK|'+label+'|'+(idx++)+'|'+b64.slice(n,n+3500))
 console.log('AEGIS_SCREEN_END|'+label)
}
async function inspect(page,label){
 const metrics=await page.evaluate(()=>{
  const w=window.innerWidth, h=window.innerHeight, de=document.documentElement
  const large=[...document.querySelectorAll('h1,h2,header,nav,a,button,input,select')].map(el=>{
    const rect=el.getBoundingClientRect();const css=getComputedStyle(el)
    return {tag:el.tagName.toLowerCase(),text:(el.textContent||'').trim().slice(0,38),x:Math.round(rect.x),y:Math.round(rect.y),w:Math.round(rect.width),h:Math.round(rect.height),font:css.fontSize}
  }).filter(z=>z.w>0&&z.h>0)
  const clipped=large.filter(z=>z.x<-2||z.x+z.w>w+2).slice(0,12)
  const smallTap=large.filter(z=>['a','button'].includes(z.tag)&&z.w>0&&z.h<32).length
  const brokenImages=[...document.querySelectorAll('img')].filter(im=>im.complete&&im.naturalWidth===0).map(im=>im.getAttribute('src')?.slice(0,100))
  return {w,h,documentWidth:de.scrollWidth,bodyWidth:document.body.scrollWidth,horizontalOverflow:de.scrollWidth>w+2,clipped,smallTap,brokenImages,heading:large.find(z=>z.tag==='h1')||null,nav:large.filter(z=>z.tag==='nav').slice(0,2)}
 })
 console.log('AUDIT_METRIC|'+label+'|'+JSON.stringify(metrics))
 if(metrics.horizontalOverflow) console.log('AUDIT_WARNING|HORIZONTAL_OVERFLOW|'+label+'|'+metrics.documentWidth+' > '+metrics.w)
 if(metrics.brokenImages.length) console.log('AUDIT_WARNING|BROKEN_IMAGES|'+label)
 await screenshot(page,label)
 i++
}
try{
 for(const [name,width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},isMobile:name.startsWith('phone'),hasTouch:name.startsWith('phone'),locale:'pt-BR',deviceScaleFactor:1})
  const page=await context.newPage()
  page.setDefaultTimeout(17000)
  const errs=[]
  page.on('pageerror',e=>errs.push(e.message))
  await page.goto(base+'/',{waitUntil:'domcontentloaded'})
  await page.locator('h1').first().waitFor()
  await page.waitForTimeout(1000)
  await inspect(page,'home-'+name)
  if(['desktop','tablet768','phone390'].includes(name)){
   await page.locator('#planos').scrollIntoViewIfNeeded()
   await page.waitForTimeout(150)
   await inspect(page,'plans-'+name)
  }
  await page.goto(base+'/responsavel/exemplo',{waitUntil:'domcontentloaded'})
  await page.getByText('DEMONSTRAÇÃO FICTÍCIA',{exact:true}).first().waitFor()
  await inspect(page,'portal-'+name)
  if(name==='phone390'){
   await page.getByRole('button',{name:'Agenda e aulas'}).click()
   await inspect(page,'agenda-phone390')
   await page.getByRole('button',{name:'Acompanhamento'}).click()
   await inspect(page,'reports-phone390')
   await page.goto(base+'/responsavel',{waitUntil:'domcontentloaded'})
   await page.getByRole('button',{name:'Entrar',exact:true}).waitFor()
   await inspect(page,'login-phone390')
   await page.goto(base+'/admin',{waitUntil:'domcontentloaded'})
   await page.waitForTimeout(850)
   await inspect(page,'admin-phone390')
  }
  console.log('AUDIT_PAGE_ERRORS|'+name+'|'+JSON.stringify(errs))
  await context.close()
 }
 console.log('AUDIT_COMPLETE|'+i+'|No forms submitted and no mutations performed.')
}finally{await browser.close()}
