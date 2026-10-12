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
