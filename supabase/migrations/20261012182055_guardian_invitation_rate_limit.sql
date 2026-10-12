begin;
create table public.guardian_invitation_log(
 id uuid primary key default gen_random_uuid(),
 guardian_id uuid not null references public.guardians(id) on delete restrict,
 requested_by uuid not null references auth.users(id) on delete restrict,
 sent_at timestamptz not null default now()
);
create index guardian_invitation_recent_idx on public.guardian_invitation_log(guardian_id,sent_at desc);
alter table public.guardian_invitation_log enable row level security;
revoke all on public.guardian_invitation_log from public,anon,authenticated;
grant select on public.guardian_invitation_log to authenticated;
create policy guardian_invitation_log_admin_read on public.guardian_invitation_log
 for select to authenticated using((select public.is_admin()));
commit;