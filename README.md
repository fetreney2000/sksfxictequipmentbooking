# Sistem Pinjaman Peralatan ICT — SK SFX Keningau

Progressive Web App (PWA) untuk menguruskan pinjaman peralatan ICT oleh guru di
SK ST Francis Xavier (SFX) Keningau, Sabah.

## Teknologi

- Vite + React + TypeScript
- React Router v6, TanStack Query v5, TanStack Table v8, Zustand
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + storage sahaja, bukan Supabase Auth)
- PDF: `jspdf` + `jspdf-autotable` · Word: `docx` · Excel: `xlsx` (semua client-side)
- PWA: `vite-plugin-pwa`

## Persediaan

1. `npm install`
2. Salin `.env.example` ke `.env` dan isi `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Jalankan SQL dalam `supabase/migrations/` pada Supabase SQL editor.
4. Cipta akaun admin pertama:
   `node scripts/create-admin.mjs --username admin --password <kata-laluan-min-8> --name "Pentadbir Sistem"`

## Skrip

- `npm run dev` — pelayan pembangunan
- `npm run build` — binaan produksi (tiada ralat dibenarkan)
- `npm run preview` — pratonton binaan
- `npm run lint` — oxlint
- `node scripts/generate-icons.mjs` — jana ikon PWA

## Nota

Sila baca `NOTES.md` untuk andaian, keputusan reka bentuk, dan trade-off
keselamatan yang didokumenkan (termasuk ketiadaan Supabase Auth dan dasar RLS
yang pragmatik).
