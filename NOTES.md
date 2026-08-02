# NOTES — Sistem Pinjaman Peralatan ICT (SK SFX Keningau)

This file records every assumption, interpretation, and known tradeoff made while
building the app where the build prompt was ambiguous. Review before production use.

## Assumptions

1. **Non-borrowing days (Step 1).** Saturday and Sunday are treated as
   non-borrowing days for a school and are disabled in the "Pilih Tarikh Pinjaman"
   calendar. The "Tarikh Pemulangan (Dijangka)" picker also disables weekends.
   Public holidays are NOT handled (no holiday calendar source was specified).

2. **Excel guru import convention.** The workbook must contain a sheet named
   **"Nama Guru"** (case-insensitive; a sheet named "nama guru" is accepted).
   Names are read from **column B**, one name per row, with a fallback to
   **column A** when column B has no names. The **first row is skipped only if it
   is a header** (e.g. "Nama", "Nama Guru", "No", or a bare column letter);
   files without a header row import every name. Duplicate names (within the
   file or already in the system) are ignored and counted as duplicates.

3. **Return date minimum = borrow date.** The expected return date
   ("Tarikh Pemulangan Dijangka") cannot be earlier than the borrow date, but it
   may be the same day. The picker disables every date before the borrow date,
   and the wizard re-validates on step 3. (The Postgres CHECK constraint
   `tarikh_pemulangan_dijangka >= tarikh_pinjaman` was dropped in migration
   `0003_drop_return_date_check.sql`; the rule is now enforced at the UI layer.)
   Weekends remain blocked for the borrow date and for the return date picker.

4. **Password minimum is 6 characters.** Per school request, user passwords
   (create/edit in Pengurusan Pengguna, change in Profil, and
   `scripts/create-admin.mjs`) require at least 6 characters.

5. **Reference number.** The human-readable "Rujukan" shown on the success page
   and in the admin panel is the **first 8 characters (uppercased) of the
   request UUID**.

6. **Session persistence is not bank-grade.** Because the app deliberately does
   not use Supabase Auth, a successful username/password login stores
   `{ id, username, full_name, role }` in the Zustand store and `localStorage`.
   Presence of that stored user is treated as "logged in". Anyone with access to
   the browser's localStorage can impersonate a session. Acceptable for an
   internal Hobby-tier school tool; document if stricter security is required.

7. **RLS is pragmatic, not per-role.** Without Supabase Auth there is no
   `auth.uid()` to key policies on. RLS is enabled on all tables but the anon
   key is granted broad `SELECT/INSERT/UPDATE/DELETE` on all tables (public +
   admin). Role-based restrictions (admin vs penyelia) are enforced **in the
   application layer** via route guards, hidden actions, and a friendly
   "Anda tidak mempunyai kebenaran..." message. `password_hash` is never
   selected by client code except inside the login check itself.

8. **"Active only" filters are query-layer, not RLS.** The prompt asks RLS to
   allow the public flow to see only `is_active = true` gurus and
   `status = 'tersedia'` equipment. Because the same anon key serves the admin
   panel (which needs to see inactive gurus and all equipment), the public
   wizard enforces these filters in its own Supabase queries.

9. **Equipment status transitions.** Approving a request sets the equipment to
   `dipinjam`; marking the request `selesai` (returned), `ditolak`, or
   `dibatalkan` reverts equipment to `tersedia`. These are implemented as
   **sequential updates with error handling** in the client (no RPC), per the
   prompt's allowance. Deleting a request also reverts any `dipinjam` equipment.
   The approval flow supports **partial approval and replacement**: the admin
   can deselect requested items or substitute alternative equipment (another
   brand/serial number); deselected items are removed from the request,
   replacements are added, and only the final set is marked `dipinjam`.
   "Tandai Belum Selesai" reverses an erroneous `selesai` back to `diluluskan`
   (clearing the actual return date and reverting its equipment to `dipinjam`,
   skipping equipment that has since been loaned out again).

10. **Equipment status for a rejected request.** Rejected requests never changed
    equipment status (equipment is only marked `dipinjam` on approval), so
    rejecting requires no equipment update.

11. **Deleting a guru/user with existing references.** Postgres foreign keys use
    `ON DELETE RESTRICT` for `pinjam_guru`, `pinjam_jenama`, `pinjam_kategori`,
    `pinjam_peralatan`, and `pinjam_tujuan`. Deleting a referenced row fails with
    a Bahasa Melayu error toast; the record must first be deactivated instead.

12. **Permission matrix** (implemented exactly as Section 7.2): penyelia can view
    dashboard, laporan (view + export), and permohonan (view only), plus their
    own profil. Approve/reject/return/delete/edit, guru management, user
    management, and the **Peralatan ICT inventory page** (`/admin/peralatan`)
    are admin-only. `/admin/guru`, `/admin/pengguna`, and `/admin/peralatan` are
    guarded by a `RequireRole` wrapper. The Peralatan page covers kategori,
    jenama, nombor siri, pendaftaran baharu, and pelupusan; the `dipinjam`
    status cannot be set manually (it is driven by approvals/returns), and
    disposal is disabled while an item is borrowed.

13. **Kemaskini (edit) scope.** The "Kemaskini" action on a permohonan only
    edits `tarikh_pemulangan_dijangka`, `tujuan_id`, and `tujuan_lain_teks`.

14. **Clicks on rows.** In the permohonan list, clicking anywhere on a row opens
    the detail page; the "Lihat" button does the same.

15. **Defaulter (peminjam lewat) definition.** A borrower is flagged as a
    defaulter when their permohonan is still `diluluskan` (on loan) and its
    expected return date (`tarikh_pemulangan_dijangka`) is earlier than today
    (Kuala Lumpur). The Dashboard shows all defaulters; the Laporan page shows
    defaulters whose expected return date falls within the selected report
    range. "Lewat N hari" is calendar days overdue (`daysBetweenKL`).

16. **Branding.** The app title is "Sistem Pinjaman Peralatan ICT" and the
    subtitle is "SK ST Francis Xavier Keningau" (as requested; "Sabah" was
    dropped from the subtitle). `SEKOLAH_NAMA`/`SEKOLAH_SUBTITLE` hold the
    title/subtitle and are reused across the public header, admin sidebar,
    login page, print slip, and PDF/DOCX exports.

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

1. Run the SQL files in `supabase/migrations/` (0001, 0002, and 0003) in the
   Supabase SQL editor.
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`.
3. Create the first admin user:
   `node scripts/create-admin.mjs --username admin --password <min-6-chars> --name "Pentadbir Sistem"`

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
