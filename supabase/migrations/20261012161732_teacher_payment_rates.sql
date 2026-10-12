-- Remuneração administrativa por aula, em centavos de real.
-- Nullable: sem valor definido não equivale a remuneração zero.
alter table public.teachers add column rate_cents integer
 constraint teachers_rate_cents_valid check (rate_cents is null or (rate_cents>=0 and rate_cents<=1000000));
