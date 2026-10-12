begin;
alter table public.lead_requests
 add column admin_notes text not null default '' check(length(admin_notes)<=3000),
 add column follow_up_at timestamptz,
 add column converted_family_id uuid references public.families(id) on delete restrict;
alter table public.lead_requests drop constraint lead_requests_status_check;
alter table public.lead_requests add constraint lead_requests_status_check
 check(status in ('new','contacted','qualified','proposal','converted','closed'));
create index lead_requests_follow_up_at on public.lead_requests(follow_up_at)
 where follow_up_at is not null and status<>'converted';
create unique index lead_requests_converted_family_unique
 on public.lead_requests(converted_family_id) where converted_family_id is not null;

create function public.aegis_convert_lead(p_lead_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_lead public.lead_requests%rowtype; v_family_id uuid;
begin
 if not (select public.is_admin()) then raise exception 'Sem permissão administrativa' using errcode='42501'; end if;
 select * into v_lead from public.lead_requests where id=p_lead_id for update;
 if not found then raise exception 'Interessado não encontrado' using errcode='P0002'; end if;
 if v_lead.converted_family_id is not null then return v_lead.converted_family_id; end if;
 insert into public.families(name,notes)
 values(left('Família de '||btrim(v_lead.guardian_name),120),'Convertida a partir de interessado do site')
 returning id into v_family_id;
 insert into public.guardians(family_id,full_name,email,phone,is_primary)
 values(v_family_id,btrim(v_lead.guardian_name),lower(btrim(v_lead.email)),v_lead.phone,true);
 insert into public.students(family_id,full_name,school_grade,pedagogical_notes)
 values(v_family_id,btrim(v_lead.student_name),btrim(v_lead.school_grade),left('Objetivo informado: '||v_lead.goal,3000));
 update public.lead_requests set status='converted',converted_family_id=v_family_id,follow_up_at=null where id=p_lead_id;
 return v_family_id;
end $$;
revoke all on function public.aegis_convert_lead(uuid) from public,anon;
grant execute on function public.aegis_convert_lead(uuid) to authenticated;

create function public.aegis_validate_lead_update()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.converted_family_id is not null
  and (new.converted_family_id is distinct from old.converted_family_id or new.status<>'converted')
 then raise exception 'Interessado convertido não pode ser revertido' using errcode='23514'; end if;
 if new.status='converted' and new.converted_family_id is null
 then raise exception 'Use o fluxo de conversão para criar a família' using errcode='23514'; end if;
 return new;
end $$;
create trigger lead_conversion_integrity before update on public.lead_requests
for each row execute function public.aegis_validate_lead_update();

create function aegis_private.audit_lead_update()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Sem permissão administrativa' using errcode='42501'; end if;
 insert into public.admin_events(actor,entity,entity_id,action) values(auth.uid(),'lead_requests',new.id,'UPDATE');
 return new;
end $$;
revoke all on function aegis_private.audit_lead_update() from public,anon,authenticated;
create trigger lead_admin_audit after update on public.lead_requests for each row execute function aegis_private.audit_lead_update();
commit;
