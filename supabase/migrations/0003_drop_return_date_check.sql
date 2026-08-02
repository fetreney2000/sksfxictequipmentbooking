-- Remove the constraint requiring the expected return date to be on or after
-- the borrow date. The school allows same-day and even earlier returns, so the
-- UI no longer enforces a minimum return date.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.pinjam_permohonan'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tarikh_pemulangan_dijangka%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.pinjam_permohonan drop constraint %I', constraint_name);
  end if;
end $$;
