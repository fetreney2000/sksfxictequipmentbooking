# NOTES — Sistem Pinjaman Peralatan ICT (SK SFX Keningau)

This file records every assumption, interpretation, and known tradeoff made while
building the app where the build prompt was ambiguous. Review before production use.

## Assumptions

1. **Non-borrowing days (Step 1).** Saturday and Sunday are treated as
   non-borrowing days for a school and are disabled in the "Pilih Tarikh Pinjaman"
   calendar. The "Tarikh Pemulangan (Dijangka)" picker also disables weekends.
   Public holidays are NOT handled (no holiday calendar source was specified).

2. **Excel guru import convention.** The workbook must contain a sheet named
   exactly **"Nama Guru"**, names must be in **column B**, one name per row,
   and **row 1 is treated as a header and skipped** (names are read starting at
   row 2). Duplicate names (within the file or already in the system) are
   ignored and counted as duplicates.

3. **Reference number.** The human-readable "Rujukan" shown on the success page
   and in the admin panel is the **first 8 characters (uppercased) of the
   request UUID**.

4. **Session persistence is not bank-grade.** Because the app deliberately does
   not use Supabase Auth, a successful username/password login stores
   `{ id, username, full_name, role }` in the Zustand store and `localStorage`.
   Presence of that stored user is treated as "logged in". Anyone with access to
   the browser's localStorage can impersonate a session. Acceptable for an
   internal Hobby-tier school tool; document if stricter security is required.

5. **RLS is pragmatic, not per-role.** Without Supabase Auth there is no
   `auth.uid()` to key policies on. RLS is enabled on all tables but the anon
   key is granted broad `SELECT/INSERT/UPDATE/DELETE` on all tables (public +
   admin). Role-based restrictions (admin vs penyelia) are enforced **in the
   application layer** via route guards, hidden actions, and a friendly
   "Anda tidak mempunyai kebenaran..." message. `password_hash` is never
   selected by client code except inside the login check itself.

6. **"Active only" filters are query-layer, not RLS.** The prompt asks RLS to
   allow the public flow to see only `is_active = true` gurus and
   `status = 'tersedia'` equipment. Because the same anon key serves the admin
   panel (which needs to see inactive gurus and all equipment), the public
   wizard enforces these filters in its own Supabase queries.

7. **Equipment status transitions.** Approving a request sets the equipment to
   `dipinjam`; marking the request `selesai` (returned), `ditolak`, or
   `dibatalkan` reverts equipment to `tersedia`. These are implemented as
   **sequential updates with error handling** in the client (no RPC), per the
   prompt's allowance. Deleting a request also reverts any `dipinjam` equipment.

8. **Equipment status for a rejected request.** Rejected requests never changed
   equipment status (equipment is only marked `dipinjam` on approval), so
   rejecting requires no equipment update.

9. **Deleting a guru/user with existing references.** Postgres foreign keys use
   `ON DELETE RESTRICT` for `pinjam_guru`, `pinjam_jenama`, `pinjam_kategori`,
   `pinjam_peralatan`, and `pinjam_tujuan`. Deleting a referenced row fails with
   a Bahasa Melayu error toast; the record must first be deactivated instead.

10. **Permission matrix** (implemented exactly as Section 7.2): penyelia can view
    dashboard, laporan (view + export), and permohonan (view only), plus their
    own profil. Approve/reject/return/delete/edit, guru management, and user
    management are admin-only. `/admin/guru` and `/admin/pengguna` are guarded by
    a `RequireRole` wrapper.

11. **Kemaskini (edit) scope.** The "Kemaskini" action on a permohonan only
    edits `tarikh_pemulangan_dijangka`, `tujuan_id`, and `tujuan_lain_teks`.

12. **Clicks on rows.** In the permohonan list, clicking anywhere on a row opens
    the detail page; the "Lihat" button does the same.

## Known dependency advisories

- **`react-router-dom@6`** (required by the prompt): npm audit reports the
  react-router open-redirect advisory (CVE-2025-68470) and the
  `deserializeErrors` SSR advisory (GHSA-337j-9hxr-rhxg). The only npm fix is a
  **breaking** upgrade to v7, which the prompt forbids. The app runs client-side
  only (no SSR) and is a closed internal tool, so exposure is limited.

- **`xlsx` (SheetJS 0.18.5)**: npm audit reports prototype-pollution
  (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9) with **no npm fix**.
  SheetJS ships patched builds only via its own CDN. The parser is used
  exclusively for admin-uploaded `.xlsx` guru imports, and `xlsx` is loaded
  dynamically only when an import happens.

- **`lucide-react`** resolves to a recent release; if the school pins an older
  version, the icon import names used in this codebase may differ.

## Supabase setup (once per environment)

1. Run the SQL files in `supabase/migrations/` (0001, then 0002) in the
   Supabase SQL editor.
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`.
3. Create the first admin user:
   `node scripts/create-admin.mjs --username admin --password <min-8-chars> --name "Pentadbir Sistem"`

## Build / run

- `npm install`
- `npm run dev` — local dev server
- `npm run build` — production build (must pass with zero errors)
- `npm run preview` — preview the production build

## Timezone note

Every displayed date, stored-as-display date, and "overdue/due" comparison uses
**Asia/Kuala_Lumpur (UTC+8)** through `src/lib/datetime.ts`. No component calls
`new Date()` directly for display or comparison logic. All date columns are
Postgres `date` type; `created_at`/`updated_at` are `timestamptz`.
