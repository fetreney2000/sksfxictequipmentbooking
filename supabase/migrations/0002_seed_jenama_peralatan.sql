-- Sample jenama + peralatan for testing (Phase 1 seed).
-- Safe to re-run; uses on conflict do nothing.

insert into public.pinjam_jenama (kategori_id, nama_jenama)
select k.id, j.nama_jenama
from public.pinjam_kategori_peralatan k
cross join (
  values ('Laptop', 'Dell'), ('Laptop', 'Lenovo'),
         ('Projektor', 'Epson'), ('Projektor', 'BenQ'),
         ('Kamera', 'Canon'), ('Kamera', 'Sony'),
         ('Pencetak', 'HP'), ('Pencetak', 'Canon'),
         ('Tablet', 'Samsung'), ('Tablet', 'Lenovo')
) as j(nama_kategori, nama_jenama)
where k.nama_kategori = j.nama_kategori
on conflict (kategori_id, nama_jenama) do nothing;

insert into public.pinjam_peralatan (kategori_id, jenama_id, nombor_siri, nama_peralatan)
select k.id, j.id, p.nombor_siri, p.nama_peralatan
from (values
  ('Laptop', 'Dell', 'LAP-DEL-001', 'Dell Latitude 3420'),
  ('Laptop', 'Dell', 'LAP-DEL-002', 'Dell Latitude 3420'),
  ('Laptop', 'Lenovo', 'LAP-LEN-001', 'Lenovo ThinkPad E14'),
  ('Laptop', 'Lenovo', 'LAP-LEN-002', 'Lenovo ThinkPad E14'),
  ('Projektor', 'Epson', 'PRJ-EPS-001', 'Epson EB-X06'),
  ('Projektor', 'BenQ', 'PRJ-BEN-001', 'BenQ MS560'),
  ('Kamera', 'Canon', 'CAM-CAN-001', 'Canon EOS 200D'),
  ('Kamera', 'Sony', 'CAM-SON-001', 'Sony Alpha ZV-E10'),
  ('Pencetak', 'HP', 'PRT-HP-001', 'HP LaserJet M111'),
  ('Pencetak', 'Canon', 'PRT-CAN-001', 'Canon PIXMA E477'),
  ('Tablet', 'Samsung', 'TAB-SAM-001', 'Samsung Galaxy Tab A8'),
  ('Tablet', 'Lenovo', 'TAB-LEN-001', 'Lenovo Tab M10')
) as p(nama_kategori, nama_jenama, nombor_siri, nama_peralatan)
join public.pinjam_kategori_peralatan k on k.nama_kategori = p.nama_kategori
join public.pinjam_jenama j on j.kategori_id = k.id and j.nama_jenama = p.nama_jenama
where not exists (
  select 1 from public.pinjam_peralatan x where x.nombor_siri = p.nombor_siri
);
