-- EXECUTAR APENAS EM AMBIENTE AUTORIZADO POR ADMINISTRADOR.
-- Os registros são fictícios e toda a execução é revertida.
begin;
select set_config('request.jwt.claim.sub',
  (select id::text from public.profiles where role='admin' and active limit 1), true);
set local role authenticated;
do $test$
declare
 v_id uuid; v_family uuid; v_lead uuid; v_package uuid; v_converted uuid;
 v_completed integer; v_published integer; v_demo_count integer;
begin
 v_id := public.aegis_create_demo_scenario();
 if public.aegis_create_demo_scenario() is distinct from v_id then
  raise exception 'Falha: criação de cenário duplicou registros';
 end if;
 select family_id, lead_id, package_id into v_family,v_lead,v_package
 from public.demo_scenarios where id=v_id;
 if not exists(select 1 from public.families where id=v_family and is_demo) then
  raise exception 'Falha: a família não foi sinalizada como fictícia';
 end if;
 if not exists(select 1 from public.guardians where family_id=v_family and is_demo) or
    not exists(select 1 from public.students where family_id=v_family and is_demo) or
    not exists(select 1 from public.teachers where is_demo and id=(select teacher_id from public.demo_scenarios where id=v_id)) then
  raise exception 'Falha: relacionamento dos registros fictícios';
 end if;
 select count(*) into v_completed from public.lessons
 where package_id=v_package and status='completed' and is_demo;
 select count(*) into v_published from public.educational_reports r
 join public.lessons l on r.lesson_id=l.id
 where l.package_id=v_package and r.status='published' and r.is_demo;
 if v_completed<>1 or v_published<>1 then
  raise exception 'Falha: aula e relatório de exemplo não estão consistentes';
 end if;
 v_converted:=public.aegis_convert_lead(v_lead);
 select count(*) into v_demo_count from public.guardians
 where family_id=v_converted and is_demo;
 if not exists(select 1 from public.families where id=v_converted and is_demo) or
    v_demo_count<>1 or
    not exists(select 1 from public.students where family_id=v_converted and is_demo) then
  raise exception 'Falha: conversão do lead fictício criou cadastro real';
 end if;
 if public.aegis_convert_lead(v_lead) is distinct from v_converted then
  raise exception 'Falha: conversão duplicou o cliente fictício';
 end if;
end $test$;
rollback;