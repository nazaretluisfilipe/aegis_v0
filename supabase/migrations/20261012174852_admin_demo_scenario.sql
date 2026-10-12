begin;
-- Os registros fictícios são dados de treinamento administrativos, nunca clientes.
alter table public.families add column is_demo boolean not null default false;
alter table public.guardians add column is_demo boolean not null default false;
alter table public.students add column is_demo boolean not null default false;
alter table public.teachers add column is_demo boolean not null default false;
alter table public.lesson_packages add column is_demo boolean not null default false;
alter table public.lessons add column is_demo boolean not null default false;
alter table public.educational_reports add column is_demo boolean not null default false;
alter table public.lead_requests add column is_demo boolean not null default false;

-- Anônimos nunca podem definir is_demo, e usuários não administrativos
-- não devem forjar registros do laboratório.
grant insert(is_demo) on public.lead_requests to authenticated;
alter policy leads_insert on public.lead_requests
 with check (consent and status='new' and (not is_demo or (select public.is_admin())));

create table public.demo_scenarios(
 id uuid primary key default gen_random_uuid(),
 scenario_key text not null unique check(scenario_key='operacao_basica'),
 family_id uuid not null references public.families(id),
 guardian_id uuid not null references public.guardians(id),
 student_id uuid not null references public.students(id),
 teacher_id uuid not null references public.teachers(id),
 package_id uuid not null references public.lesson_packages(id),
 completed_lesson_id uuid not null references public.lessons(id),
 scheduled_lesson_id uuid not null references public.lessons(id),
 cancelled_lesson_id uuid not null references public.lessons(id),
 report_id uuid not null references public.educational_reports(id),
 lead_id uuid not null references public.lead_requests(id),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.demo_scenarios enable row level security;
revoke all on public.demo_scenarios from public,anon,authenticated;
grant select,insert on public.demo_scenarios to authenticated;
create policy demo_scenarios_read on public.demo_scenarios for select to authenticated
 using ((select public.is_admin()));
create policy demo_scenarios_insert on public.demo_scenarios for insert to authenticated
 with check ((select public.is_admin()) and created_by=(select auth.uid()));

-- Um único cenário global, idempotente mesmo com dois administradores.
-- A função roda como o usuário: todas as políticas RLS continuam valendo.
create function public.aegis_create_demo_scenario()
returns uuid language plpgsql security invoker set search_path='' as $$
declare
 v_scenario uuid; v_family uuid; v_guardian uuid; v_student uuid; v_teacher uuid;
 v_package uuid; v_completed uuid; v_scheduled uuid; v_cancelled uuid;
 v_report uuid; v_lead uuid; v_email text;
begin
 if (select auth.uid()) is null or not (select public.is_admin()) then
   raise exception 'Somente administradores podem gerar cenários fictícios' using errcode='42501';
 end if;
 perform pg_advisory_xact_lock(92026701);
 select id into v_scenario from public.demo_scenarios where scenario_key='operacao_basica';
 if v_scenario is not null then return v_scenario; end if;

 v_email:='cenario-'||replace(gen_random_uuid()::text,'-','')||'@example.invalid';
 insert into public.families(name,notes,is_demo)
 values('[TESTE — FICTÍCIO] Família Exemplo','Demonstração administrativa. Não representa cliente real.',true)
 returning id into v_family;
 insert into public.guardians(family_id,full_name,email,phone,is_primary,is_demo)
 values(v_family,'[TESTE — FICTÍCIO] Responsável Exemplo',v_email,'00000000000',true,true)
 returning id into v_guardian;
 insert into public.students(family_id,full_name,school_grade,pedagogical_notes,is_demo)
 values(v_family,'[TESTE — FICTÍCIO] Aluno Exemplo','8º ano',
 'Demonstração fictícia: revisão de frações e equações de primeiro grau.',true)
 returning id into v_student;
 insert into public.teachers(full_name,contact,subjects,availability,notes,active,rate_cents,is_demo)
 values('[TESTE — FICTÍCIO] Professor Exemplo','NÃO CONTATAR','Matemática, Física',
 'Demonstração: não atribuir alunos reais','Professor fictício para capacitação administrativa.',true,null,true)
 returning id into v_teacher;
 insert into public.lesson_packages(family_id,title,included_lessons,status,terms,is_demo)
 values(v_family,'[TESTE — FICTÍCIO] Plano 8 aulas',8,'active',
 'Exemplo de contrato: NÃO COBRAR. Sem preço definido.',true)
 returning id into v_package;
 insert into public.lessons(family_id,student_id,package_id,subject,teacher_name,teacher_id,
  starts_at,duration_minutes,status,occurrence,is_demo)
 values(v_family,v_student,v_package,'Matemática','[TESTE — FICTÍCIO] Professor Exemplo',v_teacher,
 now()-interval '2 days',50,'completed','Aula concluída apenas para simulação.',true)
 returning id into v_completed;
 insert into public.lessons(family_id,student_id,package_id,subject,teacher_name,teacher_id,
  starts_at,duration_minutes,status,occurrence,is_demo)
 values(v_family,v_student,v_package,'Matemática','[TESTE — FICTÍCIO] Professor Exemplo',v_teacher,
 now()+interval '2 days',50,'scheduled','Aula futura fictícia. Sem link Meet.',true)
 returning id into v_scheduled;
 insert into public.lessons(family_id,student_id,package_id,subject,teacher_name,teacher_id,
  starts_at,duration_minutes,status,occurrence,is_demo)
 values(v_family,v_student,v_package,'Física','[TESTE — FICTÍCIO] Professor Exemplo',v_teacher,
 now()+interval '3 days',50,'cancelled','Exemplo de cancelamento que não consome saldo.',true)
 returning id into v_cancelled;
 insert into public.educational_reports(lesson_id,title,contents,activities,difficulties,
  strengths,progress,recommendations,next_steps,is_demo)
 values(v_completed,'[TESTE — FICTÍCIO] Relatório de exemplo',
  'Frações e equações de primeiro grau (conteúdo fictício).',
  'Resolução guiada de exercícios fictícios.', 'Dificuldade hipotética ao simplificar frações.',
  'Participação hipotética nas atividades.', 'Evolução fictícia ilustrativa.',
  'Revisar operações com frações.', 'Praticar lista de exercícios simulada.',true)
 returning id into v_report;
 update public.educational_reports set status='approved' where id=v_report;
 update public.educational_reports set status='published' where id=v_report;
 insert into public.lead_requests(guardian_name,email,phone,student_name,school_grade,
  subjects,goal,consent,is_demo,admin_notes)
 values('[TESTE — FICTÍCIO] Interessado Exemplo',
 'lead-'||replace(gen_random_uuid()::text,'-','')||'@example.invalid','00000000000',
 '[TESTE — FICTÍCIO] Estudante Potencial','9º ano','Química',
 'Demonstração do funil comercial. Não contatar.',true,true,
 'TESTE — contato gerado automaticamente, sem pessoa real.')
 returning id into v_lead;
 insert into public.demo_scenarios(scenario_key,family_id,guardian_id,student_id,teacher_id,
  package_id,completed_lesson_id,scheduled_lesson_id,cancelled_lesson_id,report_id,lead_id,created_by)
 values('operacao_basica',v_family,v_guardian,v_student,v_teacher,v_package,
  v_completed,v_scheduled,v_cancelled,v_report,v_lead,auth.uid())
 returning id into v_scenario;
 return v_scenario;
end $$;
revoke all on function public.aegis_create_demo_scenario() from public,anon;
grant execute on function public.aegis_create_demo_scenario() to authenticated;

-- Conversões oriundas de leads de teste também criam somente dados de teste.
create or replace function public.aegis_convert_lead(p_lead_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_lead public.lead_requests%rowtype; v_family_id uuid;
begin
 if not (select public.is_admin()) then
  raise exception 'Sem permissão administrativa' using errcode='42501';
 end if;
 select * into v_lead from public.lead_requests where id=p_lead_id for update;
 if not found then raise exception 'Interessado não encontrado' using errcode='P0002'; end if;
 if v_lead.converted_family_id is not null then return v_lead.converted_family_id; end if;
 insert into public.families(name,notes,is_demo)
 values(left('Família de '||btrim(v_lead.guardian_name),120),
  case when v_lead.is_demo then 'TESTE — FICTÍCIO. Sem cliente real.' else 'Convertida a partir de interessado do site' end,
  v_lead.is_demo)
 returning id into v_family_id;
 insert into public.guardians(family_id,full_name,email,phone,is_primary,is_demo)
 values(v_family_id,btrim(v_lead.guardian_name),lower(btrim(v_lead.email)),
  v_lead.phone,true,v_lead.is_demo);
 insert into public.students(family_id,full_name,school_grade,pedagogical_notes,is_demo)
 values(v_family_id,btrim(v_lead.student_name),btrim(v_lead.school_grade),
  left('Objetivo informado: '||v_lead.goal,3000),v_lead.is_demo);
 update public.lead_requests
 set status='converted',converted_family_id=v_family_id,follow_up_at=null where id=p_lead_id;
 return v_family_id;
end $$;
commit;