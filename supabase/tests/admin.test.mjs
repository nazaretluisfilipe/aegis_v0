import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const db = new PGlite()
const root = new URL('../../', import.meta.url)
let passed = 0
async function ok(name, fn) { await fn(); passed++; console.log('PASS', name) }
await db.exec(`create role anon; create role authenticated;
create schema auth;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
insert into auth.users (id,email,email_confirmed_at) values ('00000000-0000-0000-0000-000000000001','admin@example.test',now());`)
const migration = await readFile(new URL('supabase/migrations/0001_admin.sql', root), 'utf8')
await db.exec(migration)
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0]
const denied = async sql => { await assert.rejects(db.exec(sql), e => e.code === '42501') }
await ok('Migration aplicada com RLS', async()=>assert.equal(await scalar("select relrowsecurity from pg_class where oid='public.profiles'::regclass"),true))
await ok('Conta preexistente recebe perfil sem admin', async()=>assert.equal(await scalar('select role from profiles'),'parent'))
await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values ('00000000-0000-0000-0000-000000000002','user@example.test','{"role":"admin","full_name":"Usuario"}');`)
await ok('Metadados do usuário não concedem admin', async()=>assert.equal(await scalar("select role from profiles where id='00000000-0000-0000-0000-000000000002'"),'parent'))
await db.exec("set role anon")
await ok('Anônimo não lê perfis', ()=>denied('select * from public.profiles'))
await ok('Anônimo não chama is_admin', ()=>denied('select public.is_admin()'))
await db.exec("reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'")
await ok('Usuário lê apenas próprio perfil', async()=>assert.equal(await scalar('select count(*)::int from public.profiles'),1))
await ok('Usuário não é admin', async()=>assert.equal(await scalar('select public.is_admin()'),false))
await ok('Usuário não promove próprio perfil', ()=>denied("update public.profiles set role='admin'"))
await ok('Usuário não insere perfil', ()=>denied("insert into public.profiles(id) values ('00000000-0000-0000-0000-000000000003')"))
await ok('Usuário não apaga perfil', ()=>denied('delete from public.profiles'))
await db.exec('reset role')
let promote = await readFile(new URL('supabase/02_promover_admin.sql', root),'utf8')
await ok('Promoção exige preenchimento do e-mail', ()=>assert.rejects(db.exec(promote)))
promote = promote.replace("admin_email text := 'SEU_EMAIL_AQUI'", "admin_email text := 'admin@example.test'")
await db.exec(promote)
await db.exec("set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'")
await ok('Admin promovido é reconhecido', async()=>assert.equal(await scalar('select public.is_admin()'),true))
await ok('Admin consulta perfis', async()=>assert.equal(await scalar('select count(*)::int from public.profiles'),2))
await db.exec("reset role; update public.profiles set active=false where role='admin'; set role authenticated;")
await ok('Admin desativado perde permissão', async()=>assert.equal(await scalar('select public.is_admin()'),false))
await db.exec("reset role; update public.profiles set active=true,role='parent'; set role authenticated;")
await ok('Revogação tem efeito sem trocar JWT', async()=>assert.equal(await scalar('select public.is_admin()'),false))
await db.exec("reset role; insert into auth.users (id,raw_user_meta_data) values ('00000000-0000-0000-0000-000000000003',jsonb_build_object('full_name',repeat('x',300)));")
await ok('Nome longo não impede criação do perfil', async()=>assert.equal(await scalar("select length(full_name) from profiles where id='00000000-0000-0000-0000-000000000003'"),120))
await db.close()
console.log(`${passed} testes aprovados. PostgreSQL embarcado PGlite; não substitui teste no Supabase real.`)
