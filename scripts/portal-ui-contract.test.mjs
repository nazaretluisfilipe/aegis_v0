import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = path => readFile(new URL('../'+path,import.meta.url),'utf8')

test('portal oferece seleção de aluno e filtra aulas e relatórios sem alterar RLS',async()=>{
 const portal=await read('src/responsavel/ResponsiblePortal.tsx')
 const reports=await read('src/responsavel/PublishedReports.tsx')
 assert.match(portal,/selectedStudentId/)
 assert.match(portal,/visibleLessons=selectedStudentId\?lessons\.filter/)
 assert.match(portal,/Selecionar aluno para acompanhar/)
 assert.match(portal,/lessons=\{visibleLessons\}/)
 assert.match(reports,/selectedStudentId\?:string/)
 assert.match(reports,/setStudentId\(selectedStudentId\)/)
 assert.match(portal,/\.eq\('family_id',family\)/)
})
test('exibe datas em pt-BR no fuso de Brasília',async()=>{
 const portal=await read('src/responsavel/ResponsiblePortal.tsx')
 const reports=await read('src/responsavel/PublishedReports.tsx')
 assert.match(portal,/America\/Sao_Paulo/)
 assert.match(reports,/America\/Sao_Paulo/)
})
test('usa a marca original no portal e no painel',async()=>{
 const ui=await read('src/admin/ui.tsx')
 assert.match(ui,/src="\/logo\.svg"/)
 assert.match(ui,/alt="Aégis Educational"/)
})
test('segredos de servidor não aparecem nos bundles públicos',async()=>{
 const files=await Promise.all(['src/lib.ts','src/landing.ts','src/admin/supabaseAdmin.ts'].map(read))
 for(const src of files){
  assert.doesNotMatch(src,/import\.meta\.env\.VITE_(?:.*SECRET|.*SERVICE_ROLE)/)
  assert.doesNotMatch(src,/SUPABASE_SERVICE_ROLE_KEY/)
  assert.doesNotMatch(src,/TURNSTILE_SECRET_KEY/)
 }
 const lib=files[0]
 assert.match(lib,/fetch\('\/api\/diagnostico'/)
 assert.match(lib,/if \(siteKey\)/)
 assert.match(files[2],/VITE_SUPABASE_PUBLISHABLE_KEY/)
})
