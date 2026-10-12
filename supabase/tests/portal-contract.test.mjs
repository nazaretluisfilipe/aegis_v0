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
