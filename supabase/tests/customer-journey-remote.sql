-- AÉGIS - Jornada de cliente fictício de ponta a ponta (sem envio de e-mails)
-- O visitante anônimo envia o lead; a administração converte e publica;
-- o responsável simulado vê somente a própria família.
-- Todas as alterações são ROLLBACK: dados reais permanecem intactos.
begin;
select set_config('aegis.client_test_email',
  'jornada-'||replace(gen_random_uuid()::text,'-','')||'@example.invalid',true);

-- Visitante sem login.
set local role anon;
insert into public.lead_requests(
  guardian_name,email,phone,student_name,school_grade,subjects,goal,consent)
values (
  '[TESTE — FICTÍCIO] Responsável Jornada',
  current_setting('aegis.client_test_email'),
  '11999999999','[TESTE — FICTÍCIO] Estudante Jornada',
  '8º ano','Matemática','Frações e álgebra',true);
reset role;

-- Administração encontra e converte o lead vindo do formulário.
select set_config('request.jwt.claim.sub',
  (select id::text from public.profiles where role='admin' and active limit 1),true);
set local role authenticated;
do $admin$
declare
  v_lead uuid; v_family uuid; v_student uuid; v_package uuid;
  v_lesson uuid; v_report uuid; v_lesson_future uuid; v_count integer;
begin
  select id into v_lead from public.lead_requests
   where email=current_setting('aegis.client_test_email') and status='new';
  if v_lead is null then raise exception 'FAIL: formulário não criou lead'; end if;
  update public.lead_requests set status='contacted',
    admin_notes='[TESTE — FICTÍCIO] Acompanhamento simulado',follow_up_at=now()+interval '1 day'
    where id=v_lead;
  v_family:=public.aegis_convert_lead(v_lead);
  if v_family is distinct from public.aegis_convert_lead(v_lead) then
    raise exception 'FAIL: conversão não idempotente'; end if;
  select id into v_student from public.students where family_id=v_family;
  if v_student is null or not exists(
    select 1 from public.guardians where family_id=v_family
      and email=current_setting('aegis.client_test_email')) then
    raise exception 'FAIL: cadastro família/responsável/aluno incompleto';
  end if;
  insert into public.lesson_packages(family_id,title,included_lessons,status)
  values(v_family,'[TESTE — FICTÍCIO] Plano com 4 aulas',4,'active')
  returning id into v_package;
  insert into public.lessons(family_id,student_id,package_id,subject,teacher_name,
    starts_at,duration_minutes,status)
  values(v_family,v_student,v_package,'Matemática','[TESTE — FICTÍCIO] Docente simulado',
    now()-interval '2 days',60,'completed')
  returning id into v_lesson;
  insert into public.lessons(family_id,student_id,package_id,subject,teacher_name,
    starts_at,duration_minutes,status)
  values(v_family,v_student,v_package,'Matemática','[TESTE — FICTÍCIO] Docente simulado',
    now()+interval '3 days',60,'scheduled')
  returning id into v_lesson_future;
  insert into public.educational_reports(lesson_id,title,contents,difficulties,strengths)
  values(v_lesson,'[TESTE — FICTÍCIO] Relatório por aula','Frações e equações',
    'Dificuldade fictícia na simplificação','Participação fictícia')
  returning id into v_report;
  -- Rascunho não pode ser publicado sem aprovação.
  begin
    update public.educational_reports set status='published' where id=v_report;
    raise exception 'FAIL: relatório publicado sem aprovação';
  exception when check_violation then null;
  end;
  update public.educational_reports set status='approved' where id=v_report;
  update public.educational_reports set status='published' where id=v_report;
  if not exists(select 1 from public.educational_reports where id=v_report and status='published')
    then raise exception 'FAIL: relatório não publicado'; end if;
  select count(*) into v_count from public.lessons
   where package_id=v_package and status='completed';
  if v_count<>1 then raise exception 'FAIL: saldo esperado de 3 aulas'; end if;
  perform set_config('aegis.client_test_family',v_family::text,true);
end $admin$;
reset role;

-- Mesmo usuário da simulação troca TEMPORARIAMENTE para papel responsável.
-- Tudo volta ao estado original no ROLLBACK final.
update public.guardians set auth_user_id=(select id from public.profiles
   where role='admin' and active limit 1)
 where family_id=current_setting('aegis.client_test_family')::uuid;
update public.profiles set role='parent' where id=auth.uid();
set local role authenticated;
do $parent$
declare v_family uuid; v_packages integer; v_completed integer; v_reports integer;
  v_admin_tables integer; v_changed integer;
begin
  v_family:=current_setting('aegis.client_test_family')::uuid;
  if public.is_admin() or not public.aegis_is_guardian_of(v_family) then
    raise exception 'FAIL: responsável não ficou autorizado para própria família';end if;
  select count(*) into v_packages from public.lesson_packages
   where family_id=v_family and included_lessons=4;
  select count(*) into v_completed from public.lessons
   where family_id=v_family and status='completed';
  select count(*) into v_reports from public.educational_reports
   where status='published';
  if v_packages<>1 or v_completed<>1 or v_reports<>1 then
    raise exception 'FAIL: portal sem conteúdo: plano %, aulas %, relatórios %',
    v_packages,v_completed,v_reports;end if;
  select count(*) into v_admin_tables from public.lead_requests;
  if v_admin_tables<>0 then raise exception 'FAIL: CRM visível no portal';end if;
  update public.lessons set status='cancelled' where family_id=v_family;
  get diagnostics v_changed=row_count;
  if v_changed<>0 then raise exception 'FAIL: responsável conseguiu alterar agenda';end if;
end $parent$;
rollback;
