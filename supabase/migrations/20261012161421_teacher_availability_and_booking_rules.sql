-- Agenda docente estruturada. Horários da agenda em America/Sao_Paulo.
-- Migration aditiva: não modifica nem remove aulas ou professores existentes.
begin;
create table public.teacher_availability (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references public.teachers(id) on delete restrict,
 weekday smallint not null check (weekday between 0 and 6),
 start_time time without time zone not null,
 end_time time without time zone not null,
 created_at timestamptz not null default now(),
 constraint teacher_availability_time_valid check (start_time < end_time),
 constraint teacher_availability_unique unique(teacher_id,weekday,start_time,end_time)
);
create index teacher_availability_teacher_day on public.teacher_availability(teacher_id,weekday,start_time);
alter table public.teacher_availability enable row level security;
revoke all on public.teacher_availability from public, anon, authenticated;
grant select, insert, update, delete on public.teacher_availability to authenticated;
create policy teacher_availability_admin on public.teacher_availability
 for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Evita dois intervalos de disponibilidade simultâneos para o mesmo professor.
create function public.aegis_validate_teacher_availability()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.teachers where id=new.teacher_id for update;
 if exists (
  select 1 from public.teacher_availability a
  where a.teacher_id=new.teacher_id and a.weekday=new.weekday
   and a.id<>new.id and a.start_time<new.end_time and a.end_time>new.start_time
 ) then
  raise exception 'Disponibilidade sobreposta para este professor'
   using errcode='23514';
 end if;
 return new;
end $$;
create trigger teacher_availability_validate before insert or update of teacher_id,weekday,start_time,end_time
on public.teacher_availability for each row execute function public.aegis_validate_teacher_availability();

-- O professor vinculado não pode ter duas aulas sobrepostas. Se há agenda
-- estruturada, novas aulas agendadas devem respeitar a janela do professor.
-- Sem janelas cadastradas, o calendário legado continua utilizável.
create function public.aegis_validate_teacher_booking()
returns trigger language plpgsql security invoker set search_path='' as $$
declare
 v_active boolean;
 v_start timestamp;
 v_end timestamp;
begin
 if new.teacher_id is null or new.status<>'scheduled' then return new; end if;
 select active into v_active from public.teachers where id=new.teacher_id for update;
 if v_active is distinct from true then
  raise exception 'Professor inativo ou inexistente' using errcode='23514';
 end if;
 if exists (
  select 1 from public.lessons l
  where l.teacher_id=new.teacher_id and l.id<>new.id
   and l.status in ('scheduled','completed')
   and tstzrange(l.starts_at,l.starts_at+l.duration_minutes*interval '1 minute','[)')
       && tstzrange(new.starts_at,new.starts_at+new.duration_minutes*interval '1 minute','[)')
 ) then
  raise exception 'Professor já possui aula neste horário' using errcode='23514';
 end if;
 if exists (select 1 from public.teacher_availability a where a.teacher_id=new.teacher_id) then
  v_start := new.starts_at at time zone 'America/Sao_Paulo';
  v_end := (new.starts_at+new.duration_minutes*interval '1 minute') at time zone 'America/Sao_Paulo';
  if v_start::date<>v_end::date or not exists (
    select 1 from public.teacher_availability a
    where a.teacher_id=new.teacher_id and a.weekday=extract(dow from v_start)::smallint
      and a.start_time<=v_start::time and a.end_time>=v_end::time
  ) then
   raise exception 'Horário fora da disponibilidade do professor (Brasília)'
    using errcode='23514';
  end if;
 end if;
 return new;
end $$;
create trigger teacher_booking_validate
before insert or update of teacher_id,starts_at,duration_minutes,status
on public.lessons for each row execute function public.aegis_validate_teacher_booking();

-- Histórico mínimo de mudanças, sem copiar dados pessoais para auditoria.
create function aegis_private.log_teacher_availability()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null or not public.is_admin() then
  raise exception 'Sem permissão' using errcode='42501';
 end if;
 v_id:=case when tg_op='DELETE' then old.id else new.id end;
 insert into public.admin_events(actor,entity,entity_id,action)
 values (auth.uid(),'teacher_availability',v_id,tg_op);
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function aegis_private.log_teacher_availability() from public,anon,authenticated;
create trigger teacher_availability_audit after insert or update or delete on public.teacher_availability
for each row execute function aegis_private.log_teacher_availability();
commit;
