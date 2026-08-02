-- =============================================================
-- Sistem Pinjaman Peralatan ICT — SK SFX Keningau
-- Initial schema: all tables prefixed `pinjam_`
-- =============================================================

create extension if not exists pgcrypto;

-- Trigger to auto-update updated_at
create or replace function pinjam_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- pinjam_users
-- -------------------------------------------------------------
create table public.pinjam_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'supervisor')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pinjam_users_set_updated_at
  before update on public.pinjam_users
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_guru
-- -------------------------------------------------------------
create table public.pinjam_guru (
  id uuid primary key default gen_random_uuid(),
  nama_guru text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pinjam_guru_set_updated_at
  before update on public.pinjam_guru
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_kategori_peralatan
-- -------------------------------------------------------------
create table public.pinjam_kategori_peralatan (
  id uuid primary key default gen_random_uuid(),
  nama_kategori text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pinjam_kategori_peralatan_set_updated_at
  before update on public.pinjam_kategori_peralatan
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_jenama
-- -------------------------------------------------------------
create table public.pinjam_jenama (
  id uuid primary key default gen_random_uuid(),
  kategori_id uuid not null references public.pinjam_kategori_peralatan(id) on delete restrict,
  nama_jenama text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kategori_id, nama_jenama)
);

create trigger pinjam_jenama_set_updated_at
  before update on public.pinjam_jenama
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_peralatan
-- -------------------------------------------------------------
create table public.pinjam_peralatan (
  id uuid primary key default gen_random_uuid(),
  kategori_id uuid not null references public.pinjam_kategori_peralatan(id) on delete restrict,
  jenama_id uuid not null references public.pinjam_jenama(id) on delete restrict,
  nombor_siri text not null unique,
  nama_peralatan text,
  status text not null default 'tersedia'
    check (status in ('tersedia', 'dipinjam', 'diselenggara', 'tidak_aktif')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pinjam_peralatan_jenama_status_idx
  on public.pinjam_peralatan (jenama_id, status);

create trigger pinjam_peralatan_set_updated_at
  before update on public.pinjam_peralatan
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_tujuan_pinjaman
-- -------------------------------------------------------------
create table public.pinjam_tujuan_pinjaman (
  id uuid primary key default gen_random_uuid(),
  tujuan text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pinjam_tujuan_pinjaman_set_updated_at
  before update on public.pinjam_tujuan_pinjaman
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_permohonan
-- -------------------------------------------------------------
create table public.pinjam_permohonan (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null references public.pinjam_guru(id) on delete restrict,
  tarikh_pinjaman date not null,
  tarikh_pemulangan_dijangka date not null,
  tarikh_pemulangan_sebenar date,
  tujuan_id uuid not null references public.pinjam_tujuan_pinjaman(id) on delete restrict,
  tujuan_lain_teks text,
  status text not null default 'menunggu_kelulusan'
    check (status in ('menunggu_kelulusan', 'diluluskan', 'ditolak', 'selesai', 'dibatalkan')),
  catatan_admin text,
  diluluskan_oleh uuid references public.pinjam_users(id) on delete set null,
  diluluskan_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tarikh_pemulangan_dijangka >= tarikh_pinjaman)
);

create index pinjam_permohonan_status_idx on public.pinjam_permohonan (status);
create index pinjam_permohonan_tarikh_idx on public.pinjam_permohonan (tarikh_pinjaman, tarikh_pemulangan_dijangka);

create trigger pinjam_permohonan_set_updated_at
  before update on public.pinjam_permohonan
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- pinjam_permohonan_item
-- -------------------------------------------------------------
create table public.pinjam_permohonan_item (
  id uuid primary key default gen_random_uuid(),
  permohonan_id uuid not null references public.pinjam_permohonan(id) on delete cascade,
  peralatan_id uuid not null references public.pinjam_peralatan(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (permohonan_id, peralatan_id)
);

create index pinjam_permohonan_item_peralatan_idx
  on public.pinjam_permohonan_item (peralatan_id);

create trigger pinjam_permohonan_item_set_updated_at
  before update on public.pinjam_permohonan_item
  for each row execute function pinjam_set_updated_at();

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
-- NOTE (documented tradeoff, see NOTES.md): this app does NOT use Supabase Auth.
-- Admin vs public access is enforced at the application layer (Zustand login +
-- role gating). RLS policies below therefore grant the anon key broad access
-- to admin tables; password_hash is never selected by client code except the
-- login check itself. This is acceptable for an internal Hobby-tier school tool
-- but is NOT bank-grade security.

alter table public.pinjam_users enable row level security;
alter table public.pinjam_guru enable row level security;
alter table public.pinjam_kategori_peralatan enable row level security;
alter table public.pinjam_jenama enable row level security;
alter table public.pinjam_peralatan enable row level security;
alter table public.pinjam_tujuan_pinjaman enable row level security;
alter table public.pinjam_permohonan enable row level security;
alter table public.pinjam_permohonan_item enable row level security;

-- Public flow: read-only lookups + insert of requests.
create policy "pinjam_guru_public_read" on public.pinjam_guru
  for select to anon using (true);

create policy "pinjam_kategori_public_read" on public.pinjam_kategori_peralatan
  for select to anon using (true);

create policy "pinjam_jenama_public_read" on public.pinjam_jenama
  for select to anon using (true);

create policy "pinjam_peralatan_public_read" on public.pinjam_peralatan
  for select to anon using (true);

create policy "pinjam_tujuan_public_read" on public.pinjam_tujuan_pinjaman
  for select to anon using (true);

create policy "pinjam_permohonan_public_insert" on public.pinjam_permohonan
  for insert to anon with check (true);

create policy "pinjam_permohonan_item_public_insert" on public.pinjam_permohonan_item
  for insert to anon with check (true);

-- Admin layer: full CRUD via the same anon key (UI-gated, see NOTES.md).
create policy "pinjam_guru_admin_all" on public.pinjam_guru
  for all to anon using (true) with check (true);

create policy "pinjam_kategori_admin_all" on public.pinjam_kategori_peralatan
  for all to anon using (true) with check (true);

create policy "pinjam_jenama_admin_all" on public.pinjam_jenama
  for all to anon using (true) with check (true);

create policy "pinjam_peralatan_admin_all" on public.pinjam_peralatan
  for all to anon using (true) with check (true);

create policy "pinjam_tujuan_admin_all" on public.pinjam_tujuan_pinjaman
  for all to anon using (true) with check (true);

create policy "pinjam_users_admin_all" on public.pinjam_users
  for all to anon using (true) with check (true);

create policy "pinjam_permohonan_admin_all" on public.pinjam_permohonan
  for all to anon using (true) with check (true);

create policy "pinjam_permohonan_item_admin_all" on public.pinjam_permohonan_item
  for all to anon using (true) with check (true);

-- -------------------------------------------------------------
-- Grants
-- -------------------------------------------------------------
grant usage on schema public to anon;

grant select, insert, update, delete on all tables in schema public to anon;
grant usage on all sequences in schema public to anon;

-- -------------------------------------------------------------
-- Seed data
-- -------------------------------------------------------------
insert into public.pinjam_tujuan_pinjaman (tujuan) values
  ('Pengajaran & Pembelajaran (PdP)'),
  ('Mesyuarat'),
  ('Program/Aktiviti Sekolah'),
  ('Kerja Pentadbiran'),
  ('Lain-lain')
on conflict (tujuan) do nothing;

insert into public.pinjam_kategori_peralatan (nama_kategori) values
  ('Laptop'),
  ('Projektor'),
  ('Kamera'),
  ('Pencetak'),
  ('Tablet')
on conflict (nama_kategori) do nothing;

insert into public.pinjam_guru (nama_guru) values
  ('Cikgu Ahmad bin Hassan'),
  ('Cikgu Siti binti Rahman'),
  ('Cikgu Mohd Faizal bin Omar'),
  ('Cikgu Nurul Aini binti Yusof')
on conflict (nama_guru) do nothing;
