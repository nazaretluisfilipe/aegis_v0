-- Teste transacional da área do responsável.
-- Executar em ambiente controlado. Tudo é revertido por ROLLBACK.
begin;
select set_config('request.jwt.claim.sub',
  (select id::text from public.profiles where role='admin' and active limit 1), true);
set local role authenticated;
-- A administração publica um novo relatório na família do laboratório.
insert into public.educational_reports(lesson_id,title,contents,status,is_demo)
select s.completed_lesson_id,'[TESTE — FICTÍCIO] Relatório publicado na simulação',
  'Matemática — conteúdo fictício inserido pela administração.', 'draft',true
from public.demo_scenarios s where s.scenario_key='operacao_basica';
update public.educational_reports set status='approved'
  where title='[TESTE — FICTÍCIO] Relatório publicado na simulação';
update public.educational_reports set status='published'
  where title='[TESTE — FICTÍCIO] Relatório publicado na simulação';
-- Criar uma segunda família, para verificar isolamento de dados.
do $setup$
declare foreign_family uuid; foreign_student uuid; foreign_lesson uuid;
begin
 foreign_family:=public.aegis_create_family(
  '[TESTE — FICTÍCIO] Outra família','TRANSIENTE — rollback',
  '[TESTE — FICTÍCIO] Outro responsável',
  'teste-isolamento-'||replace(gen_random_uuid()::text,'-','')||'@example.invalid',
  '00000000000');
 update public.families set is_demo=true where id=foreign_family;
 insert into public.students(family_id,full_name,school_grade,is_demo)
 values(foreign_family,'[TESTE — FICTÍCIO] Outro estudante','7º ano',true)
 returning id into foreign_student;
 insert into public.lessons(family_id,student_id,subject,teacher_name,starts_at,
  duration_minutes,status,is_demo)
 values(foreign_family,foreign_student,'Química','[TESTE — FICTÍCIO] Docente externo',
 now()-interval '20 days',50,'completed',true)
 returning id into foreign_lesson;
 insert into public.educational_reports(lesson_id,title,contents,is_demo)
 values(foreign_lesson,'[TESTE — FICTÍCIO] Relatório de outra família',
 'Conteúdo confidencial fictício.',true);
 update public.educational_reports set status='approved'
 where lesson_id=foreign_lesson;
 update public.educational_reports set status='published'
 where lesson_id=foreign_lesson;
 perform set_config('aegis.test_foreign_family_id',foreign_family::text,true);
end $setup$;
reset role;
-- Simular um responsável autorizado da primeira família, sem tornar
-- a conta administrativa realmente responsável depois do ROLLBACK.
update public.guardians set auth_user_id=(select id from public.profiles where role='admin' and active limit 1)
where id=(select guardian_id from public.demo_scenarios where scenario_key='operacao_basica');
update public.profiles set role='parent' where id=(select auth.uid());
set local role authenticated;
do $rls$
declare own_family uuid; other_family uuid; n integer;
begin
 select family_id into own_family from public.guardians where auth_user_id=auth.uid() and active;
 other_family:=current_setting('aegis.test_foreign_family_id',true)::uuid;
 if own_family is null or public.is_admin() or
    not public.aegis_is_guardian_of(own_family) or
    public.aegis_is_guardian_of(other_family)
 then raise exception 'Falha no contexto de responsável'; end if;
 select count(*) into n from public.students;
 if n<>1 then raise exception 'Isolamento de estudantes falhou: %',n; end if;
 select count(*) into n from public.lessons;
 if n<>3 then raise exception 'Isolamento de aulas falhou: %',n; end if;
 select count(*) into n from public.lesson_packages;
 if n<>1 then raise exception 'Isolamento de pacotes falhou: %',n; end if;
 select count(*) into n from public.educational_reports where status='published';
 if n<>2 then raise exception 'Relatórios publicados não ficaram restritos à família: %',n; end if;
 select count(*) into n from public.educational_reports where status='draft';
 if n<>0 then raise exception 'Rascunhos ficaram visíveis: %',n; end if;
 select count(*) into n from public.guardians;
 if n<>1 then raise exception 'Isolamento de responsáveis falhou: %',n; end if;
 select count(*) into n from public.lead_requests;
 if n<>0 then raise exception 'Leads ficaram visíveis: %',n; end if;
 select count(*) into n from public.teachers;
 if n<>0 then raise exception 'Dados administrativos de professores ficaram visíveis: %',n; end if;
 select count(*) into n from public.admin_events;
 if n<>0 then raise exception 'Histórico administrativo ficou visível: %',n; end if;
 update public.lesson_packages set title='EDIÇÃO INDEVIDA' where family_id=own_family;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Responsável alterou um pacote: %',n; end if;
 update public.lessons set status='cancelled' where family_id=own_family;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Responsável alterou uma aula: %',n; end if;
end $rls$;
rollback;
