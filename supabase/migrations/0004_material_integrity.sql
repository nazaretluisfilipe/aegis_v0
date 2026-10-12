-- Proteção adicional: material deve estar na pasta da própria aula.
-- Migration aditiva; não exclui nem altera registros existentes.
begin;
create function public.aegis_check_material_path() returns trigger
language plpgsql set search_path = '' as $aegis$
begin
 if split_part(new.storage_path,'/',1) <> new.lesson_id::text then
  raise exception 'O material deve pertencer a pasta da aula'
    using errcode = '23514';
 end if;
 return new;
end;
$aegis$;
create trigger material_path_guard before insert or update of lesson_id, storage_path
on public.lesson_materials for each row execute function public.aegis_check_material_path();

-- Só administradores podem excluir o arquivo no Storage para limpeza
-- de uploads que falhem antes do cadastro do material.
create policy aegis_material_admin_delete on storage.objects
for delete to authenticated
using(bucket_id='aegis-lesson-materials' and (select public.is_admin()));
commit;
