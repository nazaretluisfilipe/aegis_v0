begin;
create table public.lead_requests (
 id uuid primary key default gen_random_uuid(),
 guardian_name text not null check(length(btrim(guardian_name)) between 3 and 120),
 email text not null check(length(email)<=254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 phone text not null check(phone ~ '^[0-9]{10,13}$'),
 student_name text not null check(length(btrim(student_name)) between 1 and 120),
 school_grade text not null check(length(school_grade) between 1 and 70),
 subjects text not null check(length(subjects) between 1 and 500),
 goal text not null check(length(goal) between 1 and 1000),
 consent boolean not null check(consent),
 status text not null default 'new' check(status in ('new','contacted','closed')),
 created_at timestamptz not null default now()
);
alter table public.lead_requests enable row level security;
revoke all on public.lead_requests from public,anon,authenticated;
grant insert(guardian_name,email,phone,student_name,school_grade,subjects,goal,consent) on public.lead_requests to anon,authenticated;
grant select,update on public.lead_requests to authenticated;
create policy leads_insert on public.lead_requests for insert to anon,authenticated with check(consent and status='new');
create policy leads_read on public.lead_requests for select to authenticated using((select public.is_admin()));
create policy leads_update on public.lead_requests for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));

alter table public.lesson_packages add column adjustment_reason text not null default '' check(length(adjustment_reason)<=1000);
create table public.package_adjustments (
 id uuid primary key default gen_random_uuid(),package_id uuid not null references public.lesson_packages(id),
 previous_quantity integer not null,new_quantity integer not null,reason text not null,
 created_at timestamptz not null default now(),actor uuid
);
alter table public.package_adjustments enable row level security;
revoke all on public.package_adjustments from public,anon,authenticated;
grant select on public.package_adjustments to authenticated;
create policy adjustments_read on public.package_adjustments for select to authenticated using((select public.is_admin()));
create function aegis_private.record_package_adjustment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Sem permissão' using errcode='42501'; end if;
 if new.included_lessons<>old.included_lessons then
  if length(btrim(new.adjustment_reason))<5 then raise exception 'Justifique o ajuste de saldo' using errcode='23514'; end if;
  insert into public.package_adjustments(package_id,previous_quantity,new_quantity,reason,actor) values(new.id,old.included_lessons,new.included_lessons,new.adjustment_reason,auth.uid());
 end if;
 new.adjustment_reason='';return new;
end $$;
revoke all on function aegis_private.record_package_adjustment() from public,anon,authenticated;
create trigger package_adjustment before update on public.lesson_packages for each row execute function aegis_private.record_package_adjustment();
-- Deactivation must revoke access at the database, regardless of cached JWT.
create or replace function public.aegis_is_guardian_of(p_family uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.guardians g
 join public.families f on f.id=g.family_id join public.profiles p on p.id=g.auth_user_id
 where g.family_id=p_family and g.auth_user_id=(select auth.uid()) and g.active and f.active and p.active);
$$;
commit;
