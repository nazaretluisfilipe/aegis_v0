import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'
const read = p => readFile(new URL('../../'+p,import.meta.url),'utf8')
test('portal privado nao oferece registro publico',async()=>{
 const source=await read('src/responsavel/ResponsiblePortal.tsx')
 assert.match(source,/signInWithPassword/)
 assert.match(source,/auth_user_id/)
 assert.doesNotMatch(source,/signUp\s*\(/)
})
test('saldo nao contabiliza aulas canceladas',async()=>{
 const source=await read('src/responsavel/ResponsiblePortal.tsx')
 assert.match(source,/l\.status==='completed'/)
 assert.match(source,/included_lessons-used/)
})
test('materiais sao assinados por sessao e bucket privado',async()=>{
 const portal=await read('src/responsavel/ResponsiblePortal.tsx')
 const sql=await read('supabase/migrations/0003_responsavel_aulas.sql')
 assert.match(portal,/createSignedUrl\(m\.storage_path,60\)/)
 assert.match(sql,/aegis-lesson-materials',false/)
 assert.match(sql,/aegis_is_guardian_of\(l\.family_id\)/)
})
test('migracao bloqueia materiais em pasta de outra aula',async()=>{
 const sql=await read('supabase/migrations/0004_material_integrity.sql')
 assert.match(sql,/split_part\(new\.storage_path,'\/',1\) <> new\.lesson_id::text/)
})
test('site publico original nao importou portal',async()=>{
 const source=await read('src/App.tsx')
 assert.doesNotMatch(source,/ResponsiblePortal|supabaseAdmin|lesson_packages/)
})

test('homepage oferece acesso explícito ao responsável e demonstração',async()=>{
 const source=await read('src/App.tsx')
 assert.match(source,/Área do responsável/)
 assert.match(source,/href="\/responsavel"/)
 assert.match(source,/href="\/responsavel\/exemplo"/)
})
test('demonstração pública não consulta dados reais nem contém credenciais',async()=>{
 const source=await read('src/responsavel/PortalExample.tsx')
 assert.match(source,/DEMONSTRAÇÃO FICTÍCIA/)
 assert.doesNotMatch(source,/supabaseAdmin|auth\.admin|service_role|createClient/)
})
test('rota pública de exemplo não exige autenticação',async()=>{
 const source=await read('src/main.tsx')
 assert.match(source,/location\.pathname\.startsWith\('\/responsavel\/exemplo'\)/)
})

test('site mantém os preços aprovados dos cinco planos como configuração inicial',async()=>{
 const source=await read('src/siteContent.tsx')
 const central=await read('src/config.ts')
 assert.match(source,/plansVisible:true,faqVisible:true,plans:defaultPlans/)
 assert.match(source,/plans as approvedPlans, singleLesson/)
 assert.match(source,/\.\.\.approvedPlans\.map/)
 for(const amount of ['135.5','259.99','509.99','719.99','864.9']){
  assert.ok(central.includes(amount),'Preço aprovado ausente do arquivo de configuração: '+amount)
 }
})
test('editor carrega a versão publicada e preserva preços ao editar textos',async()=>{
 const source=await read('src/admin/pages/SiteEditor.tsx')
 assert.match(source,/all\.find\(v=>v\.published&&validContent\(v\.content\)\)/)
 assert.match(source,/if\(published\)setForm\(published\.content\)/)
})

test('formulário registra leads no CRM interno sem desviar para endpoint externo',async()=>{
 const source=await read('src/lib.ts')
 assert.match(source,/\.from\('lead_requests'\)\.insert\(/)
 assert.match(source,/return error \? 'error' : 'sent'/)
 assert.doesNotMatch(source,/fetch\(site\.leadsEndpoint/)
})
test('RLS separa INSERT anônimo do cadastro de demonstração administrativo',async()=>{
 const source=await read('supabase/migrations/20261012190530_lead_anon_insert_policy_split.sql')
 assert.match(source,/leads_public_insert/)
 assert.match(source,/to anon with check/i)
 assert.match(source,/not is_demo/)
 assert.match(source,/leads_authenticated_insert/)
 assert.match(source,/to authenticated with check/i)
})

test('movimento respeita preferência reduzida e não oculta conteúdo sem JS',async()=>{
 const css=await read('src/index.css')
 const hook=await read('src/hooks/useProgressiveReveal.ts')
 const app=await read('src/App.tsx')
 assert.match(css,/prefers-reduced-motion: reduce/)
 assert.match(css,/scroll-behavior: auto/)
 assert.match(css,/\.aegis-reveal-pending/)
 assert.match(hook,/IntersectionObserver/)
 assert.match(hook,/getBoundingClientRect/)
 assert.match(app,/useProgressiveReveal\(\)/)
 assert.match(app,/data-aegis-reveal/)
})
test('menus móveis acessíveis e títulos compactos em telas pequenas',async()=>{
 const home=await read('src/App.tsx')
 const admin=await read('src/admin/AdminLayout.tsx')
 const example=await read('src/responsavel/PortalExample.tsx')
 assert.match(home,/aria-expanded=\{open\}/)
 assert.match(home,/setOpen\(false\)/)
 assert.match(home,/sm:hidden.*Portal/)
 assert.match(admin,/aria-label="Fechar menu administrativo"/)
 assert.match(admin,/overscroll-contain/)
 assert.match(example,/aria-pressed=\{tab===id\}/)
})

test('marca interna usa a logo definitiva compartilhada, sem reconstrução',async()=>{
 const source=await read('src/admin/ui.tsx')
 const logo=await read('public/logo.svg')
 assert.doesNotMatch(source,/logo-aegis-mark\.png/)
 assert.match(source,/src="\/logo\.svg"/)
 assert.match(source,/alt="Aégis Educational"/)
 assert.match(logo,/<title id="title">Aégis Educacional<\/title>/)
})
test('o título principal tem escala responsiva sem quebra forçada de palavras',async()=>{
 const css=await read('src/index.css')
 const home=await read('src/App.tsx')
 assert.doesNotMatch(css,/h1, h2, h3, h4 \{ overflow-wrap: anywhere; \}/)
 assert.match(css,/word-break: normal/)
 assert.match(home,/\[overflow-wrap:normal\]/)
 assert.match(home,/text-\[clamp\(1\.325rem,8\.3vw,2\.25rem\)\]/)
})
test('CTA móvel não duplica o acesso ao responsável',async()=>{
 const source=await read('src/App.tsx')
 const section=source.slice(source.indexOf('function StickyBar()'),source.indexOf('function Privacy()'))
 assert.match(section,/sm:hidden/)
 assert.match(section,/Solicitar diagnóstico/)
 assert.doesNotMatch(section,/href="\/responsavel"/)
 assert.match(source,/hidden sm:inline-flex/)
})
test('demonstração utiliza identificação compacta e três abas em qualquer largura',async()=>{
 const source=await read('src/responsavel/PortalExample.tsx')
 assert.match(source,/DEMONSTRAÇÃO FICTÍCIA/)
 assert.match(source,/grid grid-cols-3/)
 assert.match(source,/aria-label=\{label\}/)
 assert.match(source,/Exemplo ilustrativo, não é uma conta real/)
 assert.doesNotMatch(source,/ESTA É UMA SIMULAÇÃO VISUAL/)
})
