begin;
drop policy if exists leads_insert on public.lead_requests;
create policy leads_public_insert on public.lead_requests
for insert to anon with check (consent and status='new' and not is_demo and admin_notes='');
create policy leads_authenticated_insert on public.lead_requests
for insert to authenticated with check
 (consent and status='new' and ((not is_demo and admin_notes='') or (select public.is_admin())));
commit;