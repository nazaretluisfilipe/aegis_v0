begin;
grant insert(admin_notes) on public.lead_requests to authenticated;
alter policy leads_insert on public.lead_requests with check (
 consent and status='new' and (
  (not is_demo and admin_notes='') or
  (select public.is_admin())
 )
);
commit;