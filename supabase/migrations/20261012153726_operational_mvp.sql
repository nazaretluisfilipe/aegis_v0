begin;
-- All extensions are additive. Existing families and lessons are preserved.
create table public.teachers (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(btrim(full_name)) between 2 and 120),
 contact text not null default '' check(length(contact)<=254),
 subjects text not null default '' check(length(subjects)<=500),
 availability text not null default '' check(length(availability)<=2000),
 notes text not null default '' check(length(notes)<=3000),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.teachers enable row level security;
revoke all on public.teachers from public,anon,authenticated;
grant select,insert,update on public.teachers to authenticated;
create policy teachers_admin on public.teachers for all to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
alter table public.lessons add column teacher_id uuid references public.teachers(id) on delete restrict;
create index lessons_teacher_idx on public.lessons(teacher_id);
alter table public.lessons add column occurrence text not null default '' check(length(occurrence)<=2000);
alter table public.lessons drop constraint lessons_subject_check;
alter table public.lessons add constraint lessons_subject_check check(length(btrim(subject)) between 2 and 80);
alter table public.lessons drop constraint lessons_status_check;
alter table public.lessons add constraint lessons_status_check check(status in ('scheduled','completed','cancelled','absent'));
alter table public.lesson_packages add column price_cents integer check(price_cents>=0);
alter table public.lesson_packages add column terms text not null default '' check(length(terms)<=3000);

-- Completed rows are the ledger: repeating an update never charges twice.
-- Lock the package before counting, serializing competing completions.
create function public.aegis_check_package_balance() returns trigger language plpgsql security invoker set search_path='' as $$
declare capacity integer; consumed integer;
begin
 if new.package_id is not null and new.status='completed' then
  select included_lessons into capacity from public.lesson_packages where id=new.package_id for update;
  select count(*) into consumed from public.lessons where package_id=new.package_id and status='completed' and id<>new.id;
  if consumed>=capacity then raise exception 'Pacote sem saldo disponível' using errcode='23514'; end if;
 end if;
 return new;
end $$;
create trigger lessons_balance before insert or update on public.lessons for each row execute function public.aegis_check_package_balance();
create function public.aegis_check_package_capacity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.included_lessons < (select count(*) from public.lessons where package_id=new.id and status='completed') then
 raise exception 'Quantidade inferior às aulas realizadas' using errcode='23514'; end if;
 return new;
end $$;
create trigger packages_capacity before update on public.lesson_packages for each row execute function public.aegis_check_package_capacity();

create table public.educational_reports (
 id uuid primary key default gen_random_uuid(),
 lesson_id uuid not null references public.lessons(id) on delete restrict,
 title text not null check(length(btrim(title)) between 3 and 160),
 contents text not null default '' check(length(contents)<=10000),
 activities text not null default '' check(length(activities)<=10000),
 difficulties text not null default '' check(length(difficulties)<=10000),
 strengths text not null default '' check(length(strengths)<=10000),
 progress text not null default '' check(length(progress)<=10000),
 recommendations text not null default '' check(length(recommendations)<=10000),
 next_steps text not null default '' check(length(next_steps)<=10000),
 status text not null default 'draft' check(status in ('draft','approved','published')),
 published_at timestamptz,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index reports_lesson_idx on public.educational_reports(lesson_id);
alter table public.educational_reports enable row level security;
revoke all on public.educational_reports from public,anon,authenticated;
grant select,insert,update on public.educational_reports to authenticated;
create policy reports_read on public.educational_reports for select to authenticated using (
 (select public.is_admin()) or (status='published' and exists(select 1 from public.lessons l where l.id=lesson_id and public.aegis_is_guardian_of(l.family_id))));
create policy reports_insert on public.educational_reports for insert to authenticated with check((select public.is_admin()));
create policy reports_update on public.educational_reports for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create function public.aegis_report_workflow() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' and new.status<>'draft' then raise exception 'Salve um rascunho antes de aprovar' using errcode='23514'; end if;
 if tg_op='UPDATE' then
  if new.lesson_id<>old.lesson_id then raise exception 'Crie outro relatório para mudar a aula' using errcode='23514'; end if;
  if new.status='published' and old.status not in ('approved','published') then raise exception 'Aprove antes de publicar' using errcode='23514'; end if;
  if (to_jsonb(new)-array['status','published_at','updated_at']) is distinct from (to_jsonb(old)-array['status','published_at','updated_at']) and new.status<>'draft' then
   raise exception 'Edição exige retorno ao rascunho' using errcode='23514'; end if;
 end if;
 if new.status in ('approved','published') and length(btrim(new.contents))=0 then raise exception 'Informe os conteúdos trabalhados' using errcode='23514'; end if;
 new.published_at=case when new.status='published' then coalesce(new.published_at,now()) else null end;
 new.updated_at=now(); return new;
end $$;
create trigger reports_workflow before insert or update on public.educational_reports for each row execute function public.aegis_report_workflow();

-- Disable material access immediately without destroying the underlying file.
alter table public.lesson_materials add column active boolean not null default true;
grant update on public.lesson_materials to authenticated;
create policy materials_update on public.lesson_materials for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
alter policy lesson_materials_read on public.lesson_materials using((select public.is_admin()) or (active and exists(select 1 from public.lessons l where l.id=lesson_id and public.aegis_is_guardian_of(l.family_id))));
alter policy aegis_material_read on storage.objects using(bucket_id='aegis-lesson-materials' and ((select public.is_admin()) or exists(select 1 from public.lesson_materials m join public.lessons l on l.id=m.lesson_id where m.storage_path=name and m.active and public.aegis_is_guardian_of(l.family_id))));
-- Avoid deleting files still referenced by a material, including archived materials.
alter policy aegis_material_admin_delete on storage.objects using(bucket_id='aegis-lesson-materials' and (select public.is_admin()) and not exists(select 1 from public.lesson_materials m where m.storage_path=name));

-- Versioned institutional content. Only published versions are public.
create table public.site_versions (
 id uuid primary key default gen_random_uuid(),
 content jsonb not null check(jsonb_typeof(content)='object' and octet_length(content::text)<=50000),
 published boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.site_versions enable row level security;
revoke all on public.site_versions from public,anon,authenticated;
grant select on public.site_versions to anon;
grant select,insert,update on public.site_versions to authenticated;
create policy site_read on public.site_versions for select to anon,authenticated using(published);
create policy site_admin on public.site_versions for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create unique index site_one_published on public.site_versions(published) where published;
create function public.aegis_publish_site(p_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Sem permissão' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(671294);
 if not exists(select 1 from public.site_versions where id=p_id) then raise exception 'Versão inexistente'; end if;
 update public.site_versions set published=false where published;
 update public.site_versions set published=true where id=p_id;
end $$;
revoke all on function public.aegis_publish_site(uuid) from public,anon;
grant execute on function public.aegis_publish_site(uuid) to authenticated;

-- Append-only administrative audit. No student texts are copied into the log.
create schema if not exists aegis_private;
revoke all on schema aegis_private from public,anon,authenticated;
create table public.admin_events (
 id bigint generated always as identity primary key,
 actor uuid, entity text not null, entity_id uuid, action text not null,
 created_at timestamptz not null default now()
);
alter table public.admin_events enable row level security;
revoke all on public.admin_events from public,anon,authenticated;
grant select on public.admin_events to authenticated;
create policy events_read on public.admin_events for select to authenticated using((select public.is_admin()));
create function aegis_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Sem permissão' using errcode='42501'; end if;
 insert into public.admin_events(actor,entity,entity_id,action) values(auth.uid(),tg_table_name,new.id,tg_op);
 return new;
end $$;
revoke all on function aegis_private.audit_change() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['teachers','educational_reports','lesson_packages','lessons','lesson_materials','site_versions'] loop
 execute format('create trigger administrative_audit after insert or update on public.%I for each row execute function aegis_private.audit_change()',t);
 end loop;
end $$;
commit;
