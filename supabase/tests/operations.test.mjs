import {PGlite} from '@electric-sql/pglite'
import {readFile,readdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
const db=new PGlite()
const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`
await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;
insert into auth.users(id,email,email_confirmed_at) values('${uid(1)}','admin@example.test',now()),('${uid(2)}','one@example.test',now()),('${uid(3)}','two@example.test',now());`)
for(const f of (await readdir(new URL('../migrations/',import.meta.url))).sort())await db.exec(await readFile(new URL('../migrations/'+f,import.meta.url),'utf8'))
await db.exec(`update profiles set role='admin' where id='${uid(1)}';set role authenticated;set request.jwt.claim.sub='${uid(1)}';`)
const value=async q=>Object.values((await db.query(q)).rows[0])[0]
const family1=await value("select aegis_create_family('Familia teste um','','Responsavel um','one@example.test','11999999999')")
const family2=await value("select aegis_create_family('Familia teste dois','','Responsavel dois','two@example.test','11999999998')")
await db.exec(`select aegis_link_guardian(id) from guardians;insert into students(id,family_id,full_name,school_grade) values('${uid(10)}','${family1}','Aluno teste um','9'),('${uid(11)}','${family2}','Aluno teste dois','8');
insert into lesson_packages(id,family_id,title,included_lessons) values('${uid(20)}','${family1}','Pacote teste',1);
insert into lessons(id,family_id,student_id,package_id,subject,teacher_name,starts_at) values('${uid(30)}','${family1}','${uid(10)}','${uid(20)}','Português','Professor teste',now()),('${uid(31)}','${family1}','${uid(10)}','${uid(20)}','Português','Professor teste',now()+interval '1 day');`)
let count=0
const check=async(name,fn)=>{await fn();count++;console.log('PASS',name)}
await check('Conclusão repetida consome apenas uma aula',async()=>{await db.exec(`update lessons set status='completed' where id='${uid(30)}';update lessons set status='completed' where id='${uid(30)}'`);assert.equal(await value("select count(*)::int from lessons where status='completed'"),1)})
await check('Saldo esgotado rejeita segunda conclusão',()=>assert.rejects(db.exec(`update lessons set status='completed' where id='${uid(31)}'`),e=>e.code==='23514'))
await check('Cancelamento libera saldo',async()=>{await db.exec(`update lessons set status='cancelled' where id='${uid(30)}';update lessons set status='completed' where id='${uid(31)}'`);assert.equal(await value("select count(*)::int from lessons where status='completed'"),1)})
await check('Material não pode apontar para pasta de outra aula',()=>assert.rejects(db.exec(`insert into lesson_materials(lesson_id,title,storage_path) values('${uid(31)}','Material teste','${uid(30)}/arquivo.pdf')`),e=>e.code==='23514'))
await db.exec(`insert into educational_reports(id,lesson_id,title,contents) values('${uid(40)}','${uid(31)}','Relatório teste','Frações e proporções');`)
await check('Publicação exige aprovação',()=>assert.rejects(db.exec(`update educational_reports set status='published' where id='${uid(40)}'`),e=>e.code==='23514'))
await db.exec(`set request.jwt.claim.sub='${uid(2)}'`)
await check('Responsável não vê rascunhos',async()=>assert.equal(await value('select count(*)::int from educational_reports'),0))
await check('Responsável não publica relatório',async()=>{await db.exec(`update educational_reports set status='published'`);assert.equal(await value('select count(*)::int from educational_reports'),0)})
await db.exec(`set request.jwt.claim.sub='${uid(1)}';update educational_reports set status='approved' where id='${uid(40)}';update educational_reports set status='published' where id='${uid(40)}';set request.jwt.claim.sub='${uid(2)}'`)
await check('Responsável vê relatório publicado de seu aluno',async()=>assert.equal(await value('select count(*)::int from educational_reports'),1))
await db.exec(`set request.jwt.claim.sub='${uid(3)}'`)
await check('Outra família não vê aulas, saldos ou relatórios',async()=>{for(const t of ['lessons','lesson_packages','educational_reports'])assert.equal(await value(`select count(*)::int from ${t}`),0)})
await check('Outra família não cadastra professor',()=>assert.rejects(db.exec("insert into teachers(full_name) values('Professor intruso')"),e=>e.code==='42501'))
await db.exec(`set request.jwt.claim.sub='${uid(1)}'`)
await check('Edição de publicado exige rascunho',()=>assert.rejects(db.exec(`update educational_reports set contents='Alteração' where id='${uid(40)}'`),e=>e.code==='23514'))
await db.exec(`insert into site_versions(id,content) values('${uid(50)}','{"heroTitle":"Versão um"}'),('${uid(51)}','{"heroTitle":"Versão dois"}');select aegis_publish_site('${uid(50)}');select aegis_publish_site('${uid(51)}');`)
await check('Apenas uma versão pública do site',async()=>assert.equal(await value('select count(*)::int from site_versions where published'),1))
await check('Ações administrativas registradas',async()=>assert.ok(await value('select count(*)::int from admin_events')>0))
await db.exec('reset role;set role anon')
await check('Visitante só vê versão publicada',async()=>assert.equal(await value('select count(*)::int from site_versions'),1))
await check('Visitante não lê relatórios',()=>assert.rejects(db.exec('select * from educational_reports'),e=>e.code==='42501'))
await check('Formulário público aceita lead via perfil anônimo sem login',async()=>{
 await db.exec("insert into lead_requests(guardian_name,email,phone,student_name,school_grade,subjects,goal,consent) values('[TESTE — FICTÍCIO] Responsável','anon-jornada@example.invalid','11999999999','[TESTE — FICTÍCIO] Aluno','8º ano','Matemática','Revisão',true)")
})
await check('Visitante anônimo não consulta os interessados',async()=>{
 await assert.rejects(db.exec('select * from lead_requests'),e=>e.code==='42501')
})
await db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='${uid(1)}'`)
await check('Painel identifica lead e o converte em família com aluno',async()=>{
 const id=await value("select id from lead_requests where email='anon-jornada@example.invalid'")
 const family=await value(`select aegis_convert_lead('${id}')`)
 assert.equal(await value(`select count(*)::int from guardians where family_id='${family}'`),1)
 assert.equal(await value(`select count(*)::int from students where family_id='${family}'`),1)
 assert.equal(await value(`select count(*)::int from lead_requests where id='${id}' and status='converted'`),1)
})
await db.close();console.log(`${count} testes de operação aprovados em PostgreSQL embarcado.`)
