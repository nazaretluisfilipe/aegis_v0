-- Aégis: etapa 1. Executar UMA VEZ em projeto sem tabelas próprias.
-- Não apaga dados. Todos os novos perfis começam sem permissão administrativa.
begin;
create type public.user_role as enum ('admin', 'parent', 'student', 'teacher');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'parent',
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 30),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- Revogar inclusive grants herdados de PUBLIC e os padrões do Supabase.
revoke all on table public.profiles from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active = true
  );
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
create policy profiles_self_or_admin_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- Não há escrita via navegador nesta etapa. Promoção só no SQL Editor.

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
-- Abrange contas Auth eventualmente criadas antes desta instalação.
insert into public.profiles (id, full_name)
select id, left(coalesce(raw_user_meta_data->>'full_name', ''), 120)
from auth.users;
commit;

-- Resultado esperado: profiles_com_rls = true; funcao_admin = is_admin().
select c.relrowsecurity as profiles_com_rls,
       to_regprocedure('public.is_admin()')::text as funcao_admin
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles';
