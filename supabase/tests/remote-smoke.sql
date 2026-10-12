-- Synthetic fixtures only, transaction always rolls back. Never run without ROLLBACK.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('00000000-0000-0000-0000-000000009001','aegis-admin-smoke@example.test',now(),'{}'),
('00000000-0000-0000-0000-000000009002','aegis-parent-smoke@example.test',now(),'{}'),
('00000000-0000-0000-0000-000000009003','aegis-other-smoke@example.test',now(),'{}');
update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000009001';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009001',true);
insert into public.families(id,name) values('00000000-0000-0000-0000-000000009010','Familia ficticia de teste');
insert into public.guardians(family_id,full_name,email,phone,auth_user_id) values('00000000-0000-0000-0000-000000009010','Responsavel ficticio','aegis-parent-smoke@example.test','11999999999','00000000-0000-0000-0000-000000009002');
insert into public.students(id,family_id,full_name,school_grade) values('00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009010','Aluno ficticio','9 ano');
insert into public.lesson_packages(id,family_id,title,included_lessons) values('00000000-0000-0000-0000-000000009030','00000000-0000-0000-0000-000000009010','Pacote ficticio',1);
insert into public.lessons(id,family_id,student_id,package_id,subject,teacher_name,starts_at,status) values('00000000-0000-0000-0000-000000009040','00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009030','Matemática','Professor ficticio',now(),'completed');
update public.lessons set status='completed' where id='00000000-0000-0000-0000-000000009040';
do $$ begin
 begin
 insert into public.lessons(family_id,student_id,package_id,subject,teacher_name,starts_at,status) values('00000000-0000-0000-0000-000000009010','00000000-0000-0000-0000-000000009020','00000000-0000-0000-0000-000000009030','Matemática','Professor ficticio',now()+interval '1 day','completed');
 raise exception 'TEST FAILED: saldo excedido';
 exception when check_violation then null; end;
end $$;
insert into public.educational_reports(id,lesson_id,title,contents) values('00000000-0000-0000-0000-000000009050','00000000-0000-0000-0000-000000009040','Relatorio ficticio','Conteudo ficticio');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009002',true);
do $$ begin
 if exists(select 1 from public.educational_reports where id='00000000-0000-0000-0000-000000009050') then raise exception 'TEST FAILED: rascunho exposto';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009001',true);
update public.educational_reports set status='approved' where id='00000000-0000-0000-0000-000000009050';
update public.educational_reports set status='published' where id='00000000-0000-0000-0000-000000009050';
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009002',true);
do $$ begin
 if not exists(select 1 from public.educational_reports where id='00000000-0000-0000-0000-000000009050') then raise exception 'TEST FAILED: publicado inacessivel';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009003',true);
do $$ begin
 if exists(select 1 from public.educational_reports where id='00000000-0000-0000-0000-000000009050') or exists(select 1 from public.lessons where id='00000000-0000-0000-0000-000000009040') then raise exception 'TEST FAILED: acesso entre familias';end if;
end $$;
select 'PASS: cadastro, saldo idempotente, limite de saldo, rascunho, publicação e isolamento no Supabase real; fixtures revertidas' as result;
rollback;
