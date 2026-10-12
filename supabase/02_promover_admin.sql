-- USAR DEPOIS de criar/confirmar a conta em Authentication > Users.
-- Substitua apenas SEU_EMAIL_AQUI; não coloque senha neste arquivo.
-- Este bloco falha explicitamente se a conta ou o perfil não existir.
do $$
declare
  admin_email text := 'SEU_EMAIL_AQUI';
  admin_id uuid;
begin
  if admin_email = 'SEU_EMAIL_AQUI' then
    raise exception 'Substitua SEU_EMAIL_AQUI pelo e-mail da sua conta.';
  end if;
  select id into strict admin_id from auth.users
    where lower(email) = lower(trim(admin_email)) and email_confirmed_at is not null;
  update public.profiles set role = 'admin', active = true where id = admin_id;
  if not found then raise exception 'Perfil não encontrado: execute primeiro 0001_admin.sql.'; end if;
end;
$$;
select u.email, p.role, p.active from public.profiles p
join auth.users u on u.id = p.id where p.role = 'admin';
