-- Aegis Educational | Fase 1: familias, responsaveis e alunos
-- Dependencia: supabase/migrations/0001_admin.sql ja aplicada.
-- Executar somente apos inspecionar o banco real e fazer backup.
begin;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 120),
  notes text not null default '' check (char_length(notes) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 3 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 13),
  is_primary boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uma familia pode ter muitos responsaveis; e-mail nao pode se repetir
-- em familias distintas sem revisao administrativa.
create unique index guardians_email_unique on public.guardians (lower(btrim(email)));
create unique index guardians_one_primary_per_family on public.guardians (family_id) where is_primary = true and active = true;
create index guardians_family_idx on public.guardians(family_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  school_grade text not null check (char_length(btrim(school_grade)) between 1 and 70),
  pedagogical_notes text not null default '' check (char_length(pedagogical_notes) <= 3000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_family_idx on public.students(family_id);
create unique index students_family_name_grade_unique
on public.students(family_id, lower(btrim(full_name)), lower(btrim(school_grade)))
where active = true;

create function public.aegis_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end
$$;
create trigger families_timestamp before update on public.families
for each row execute function public.aegis_touch_updated_at();
create trigger guardians_timestamp before update on public.guardians
for each row execute function public.aegis_touch_updated_at();
create trigger students_timestamp before update on public.students
for each row execute function public.aegis_touch_updated_at();

-- Nenhuma politica para anon. Apenas admin ativo pode ler, inserir e editar.
-- DELETE nao concedido: desativacao logica e tratamento de retencao posterior.
alter table public.families enable row level security;
alter table public.guardians enable row level security;
alter table public.students enable row level security;
revoke all on public.families, public.guardians, public.students from public, anon, authenticated;
grant select, insert, update on public.families, public.guardians, public.students to authenticated;

create policy families_admin_select on public.families for select to authenticated using ((select public.is_admin()));
create policy families_admin_insert on public.families for insert to authenticated with check ((select public.is_admin()));
create policy families_admin_update on public.families for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy guardians_admin_select on public.guardians for select to authenticated using ((select public.is_admin()));
create policy guardians_admin_insert on public.guardians for insert to authenticated with check ((select public.is_admin()));
create policy guardians_admin_update on public.guardians for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy students_admin_select on public.students for select to authenticated using ((select public.is_admin()));
create policy students_admin_insert on public.students for insert to authenticated with check ((select public.is_admin()));
create policy students_admin_update on public.students for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Transacao unica: nao deixa familia orfa quando o responsavel falha.
create function public.aegis_create_family(
  p_name text, p_notes text, p_guardian_name text, p_guardian_email text, p_guardian_phone text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  if not (select public.is_admin()) then raise exception 'Sem permissao administrativa' using errcode='42501'; end if;
  insert into public.families(name, notes)
  values (btrim(p_name), coalesce(btrim(p_notes), '')) returning id into v_id;
  insert into public.guardians(family_id, full_name, email, phone, is_primary)
  values (v_id, btrim(p_guardian_name), lower(btrim(p_guardian_email)), btrim(p_guardian_phone), true);
  return v_id;
end;
$$;
revoke all on function public.aegis_create_family(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.aegis_create_family(text,text,text,text,text) to authenticated;

commit;
