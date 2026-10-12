-- Aegis | portal do responsavel e aulas - executar depois de revisar em staging.
-- Dependencias: 0001_admin.sql e 0002_families_students.sql
begin;
alter table public.guardians add column auth_user_id uuid unique references auth.users(id) on delete set null;
create index guardians_auth_user_idx on public.guardians(auth_user_id);

-- Uma pessoa responsavel tem acesso somente ao grupo ao qual esta vinculada.
create function public.aegis_is_guardian_of(p_family uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.guardians g
   where g.family_id=p_family and g.auth_user_id=(select auth.uid()) and g.active);
$$;
revoke all on function public.aegis_is_guardian_of(uuid) from public,anon,authenticated;
grant execute on function public.aegis_is_guardian_of(uuid) to authenticated;

create table public.lesson_packages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete restrict,
  title text not null check(char_length(btrim(title)) between 3 and 120),
  included_lessons integer not null check(included_lessons > 0 and included_lessons <= 500),
  starts_on date,
  ends_on date,
  status text not null default 'active' check(status in ('active','finished','cancelled')),
  created_at timestamptz not null default now(),
  constraint package_valid_dates check(ends_on is null or starts_on is null or ends_on >= starts_on),
  unique (id, family_id)
);
create table public.lessons (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete restrict,
 student_id uuid not null references public.students(id) on delete restrict,
 package_id uuid references public.lesson_packages(id) on delete restrict,
 subject text not null check (subject in ('Matemática','Física','Química','Biologia')),
 teacher_name text not null check(char_length(btrim(teacher_name)) between 2 and 120),
 starts_at timestamptz not null,
 duration_minutes integer not null default 50 check(duration_minutes between 20 and 180),
 status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
 meet_url text check(meet_url is null or (char_length(meet_url) <= 300 and meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}([?].*)?$')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint lesson_student_family_fk foreign key (student_id) references public.students(id),
 constraint lesson_package_family_fk foreign key (package_id, family_id) references public.lesson_packages(id, family_id)
);
-- Checagem forte do vinculo entre aluno e grupo ocorre em trigger.
create function public.aegis_check_lesson_family() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.students s where s.id=new.student_id and s.family_id=new.family_id)
 then raise exception 'Aluno nao pertence ao grupo do responsavel' using errcode='23514'; end if;
 return new;
end;
$$;
create trigger lesson_family_guard before insert or update of family_id,student_id on public.lessons
 for each row execute function public.aegis_check_lesson_family();
create trigger lessons_timestamp before update on public.lessons
 for each row execute function public.aegis_touch_updated_at();
create index lessons_family_time_idx on public.lessons(family_id,starts_at);
create index lessons_student_idx on public.lessons(student_id);
create unique index lessons_prevent_double_schedule on public.lessons(student_id,starts_at)
 where status <> 'cancelled';

create table public.lesson_materials (
 id uuid primary key default gen_random_uuid(),
 lesson_id uuid not null references public.lessons(id) on delete restrict,
 title text not null check(char_length(btrim(title)) between 2 and 120),
 storage_path text not null unique check(char_length(storage_path) <= 500),
 created_at timestamptz not null default now()
);
create index lesson_materials_lesson_idx on public.lesson_materials(lesson_id);

alter table public.lesson_packages enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_materials enable row level security;
revoke all on public.lesson_packages,public.lessons,public.lesson_materials from public,anon,authenticated;
grant select,insert,update on public.lesson_packages,public.lessons to authenticated;
grant select,insert on public.lesson_materials to authenticated;
grant select on public.guardians,public.students to authenticated;

-- Responsaveis leem somente a propria vinculação e seus alunos.
create policy guardian_self_read on public.guardians for select to authenticated
  using(auth_user_id=(select auth.uid()));
create policy student_guardian_read on public.students for select to authenticated
  using((select public.aegis_is_guardian_of(family_id)));

create policy packages_read on public.lesson_packages for select to authenticated
 using ((select public.is_admin()) or (select public.aegis_is_guardian_of(family_id)));
create policy packages_create on public.lesson_packages for insert to authenticated
 with check ((select public.is_admin()));
create policy packages_update on public.lesson_packages for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));

create policy lessons_read on public.lessons for select to authenticated
 using ((select public.is_admin()) or (select public.aegis_is_guardian_of(family_id)));
create policy lessons_create on public.lessons for insert to authenticated
 with check ((select public.is_admin()));
create policy lessons_update on public.lessons for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));

create policy lesson_materials_read on public.lesson_materials for select to authenticated
 using ((select public.is_admin()) or exists (
 select 1 from public.lessons l where l.id=lesson_id and (select public.aegis_is_guardian_of(l.family_id))
 ));
create policy lesson_materials_create on public.lesson_materials for insert to authenticated
 with check ((select public.is_admin()));

-- Storage fechado, acesso por URLs assinadas de curta duracao.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('aegis-lesson-materials','aegis-lesson-materials',false,10485760,
 array['application/pdf','image/png','image/jpeg'])
on conflict (id) do nothing;
create policy aegis_material_admin_insert on storage.objects for insert to authenticated
 with check(bucket_id='aegis-lesson-materials' and (select public.is_admin()));
create policy aegis_material_read on storage.objects for select to authenticated
 using (bucket_id='aegis-lesson-materials' and (
  (select public.is_admin()) or exists (
    select 1 from public.lesson_materials m
    join public.lessons l on l.id=m.lesson_id
    where m.storage_path=name and (select public.aegis_is_guardian_of(l.family_id))
  )
 ));
commit;
