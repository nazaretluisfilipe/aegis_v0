import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const db = new PGlite()
const root = new URL('../../', import.meta.url)
let count = 0
async function check(name, fn) { await fn(); count++; console.log('PASS', name) }
async function denied(sql) { await assert.rejects(db.exec(sql), err => err.code === '42501') }
await db.exec(`create role anon; create role authenticated;
create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');`)
await db.exec(await readFile(new URL('supabase/migrations/0001_admin.sql', root),'utf8'))
await db.exec(await readFile(new URL('supabase/migrations/0002_families_students.sql', root),'utf8'))
await check('RLS ativada em tres tabelas',async()=>{for(const t of ['families','guardians','students']) assert.equal((await db.query(`select relrowsecurity from pg_class where oid='public.${t}'::regclass`)).rows[0].relrowsecurity,true)})
await db.exec("set role anon")
for(const table of ['families','guardians','students']) await check('Anonimo bloqueado: '+table,()=>denied('select * from public.'+table))
await db.exec("reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'")
await check('Nao admin nao cadastra familias',()=>denied("insert into public.families(name) values ('Familia Teste')"))
await check('Nao admin nao consulta tabela de alunos',async()=>assert.equal((await db.query('select count(*)::int as n from public.students')).rows[0].n,0))
await db.exec("reset role; update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000001'; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'")
await db.exec("select public.aegis_create_family('Familia Teste','','Responsavel Um','responsavel@example.test','11999999999')")
await check('Criacao atomica gera uma familia e responsavel',async()=>{
 assert.equal((await db.query('select count(*)::int as n from public.families')).rows[0].n,1)
 assert.equal((await db.query('select count(*)::int as n from public.guardians')).rows[0].n,1)
})
await check('E-mail duplicado impede nova familia',async()=>{
 await assert.rejects(db.exec("select public.aegis_create_family('Outra Familia','','Duplicado','RESPONSAVEL@example.test','11999999999')"),err=>err.code==='23505')
 assert.equal((await db.query('select count(*)::int as n from public.families')).rows[0].n,1)
})
await db.exec("insert into public.students(family_id,full_name,school_grade) select id,'Estudante Um','8 ano' from public.families")
await db.exec("insert into public.students(family_id,full_name,school_grade) select id,'Estudante Dois','9 ano' from public.families")
await check('Dois alunos associados',async()=>assert.equal((await db.query('select count(*)::int as n from public.students')).rows[0].n,2))
await check('Aluno duplicado rejeitado',()=>assert.rejects(db.exec("insert into public.students(family_id,full_name,school_grade) select id,'Estudante Um','8 ano' from public.families"),err=>err.code==='23505'))
await db.exec("update public.students set school_grade='1 medio' where full_name='Estudante Dois'")
await check('Edicao persiste',async()=>assert.equal((await db.query("select school_grade from public.students where full_name='Estudante Dois'")).rows[0].school_grade,'1 medio'))
await check('Exclusao direta negada',()=>denied('delete from public.students'))
await db.exec("reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'")
await check('Usuario comum nao le familia',async()=>assert.equal((await db.query('select count(*)::int as n from public.families')).rows[0].n,0))
await db.close()
console.log(count+' verificacoes locais aprovadas (PGlite, nao Supabase remoto).')
