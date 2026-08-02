import { supabase } from '@/lib/supabaseClient'
import type {
  GuruRow,
  KategoriRow,
  JenamaRow,
  PeralatanRow,
  TujuanRow,
  PermohonanRow,
  PermohonanJoined,
  PermohonanItemJoined,
} from '@/lib/types'
import { nowTimestampKL } from '@/lib/datetime'

/* ------------------------------------------------------------------ */
/* Public flow (wizard)                                                */
/* ------------------------------------------------------------------ */

export async function fetchActiveGuru(): Promise<GuruRow[]> {
  const { data, error } = await supabase
    .from('pinjam_guru')
    .select('id, nama_guru, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('nama_guru')
  if (error) throw error
  return data ?? []
}

export async function fetchKategori(): Promise<KategoriRow[]> {
  const { data, error } = await supabase
    .from('pinjam_kategori_peralatan')
    .select('*')
    .order('nama_kategori')
  if (error) throw error
  return data ?? []
}

export async function fetchJenamaByKategori(kategoriId: string): Promise<JenamaRow[]> {
  const { data, error } = await supabase
    .from('pinjam_jenama')
    .select('*')
    .eq('kategori_id', kategoriId)
    .order('nama_jenama')
  if (error) throw error
  return data ?? []
}

export async function fetchTersediaPeralatanByJenama(
  jenamaId: string,
): Promise<PeralatanRow[]> {
  const { data, error } = await supabase
    .from('pinjam_peralatan')
    .select('*')
    .eq('jenama_id', jenamaId)
    .eq('status', 'tersedia')
    .order('nombor_siri')
  if (error) throw error
  return data ?? []
}

export async function fetchTujuanList(): Promise<TujuanRow[]> {
  const { data, error } = await supabase
    .from('pinjam_tujuan_pinjaman')
    .select('*')
    .order('tujuan')
  if (error) throw error
  return data ?? []
}

export interface NewPermohonanInput {
  guru_id: string
  tarikh_pinjaman: string
  tarikh_pemulangan_dijangka: string
  tujuan_id: string
  tujuan_lain_teks: string | null
  peralatan_ids: string[]
}

/**
 * Insert a permohonan header then its items. If the item insert fails, delete
 * the header again to avoid orphaned requests (compensating transaction).
 */
export async function insertPermohonan(
  input: NewPermohonanInput,
): Promise<PermohonanRow> {
  const { data: header, error: headerError } = await supabase
    .from('pinjam_permohonan')
    .insert({
      guru_id: input.guru_id,
      tarikh_pinjaman: input.tarikh_pinjaman,
      tarikh_pemulangan_dijangka: input.tarikh_pemulangan_dijangka,
      tujuan_id: input.tujuan_id,
      tujuan_lain_teks: input.tujuan_lain_teks,
    })
    .select()
    .single()

  if (headerError || !header) throw headerError ?? new Error('Gagal mencipta permohonan.')

  const items = input.peralatan_ids.map((peralatan_id) => ({
    permohonan_id: header.id,
    peralatan_id,
  }))

  const { error: itemsError } = await supabase
    .from('pinjam_permohonan_item')
    .insert(items)

  if (itemsError) {
    await supabase.from('pinjam_permohonan').delete().eq('id', header.id)
    throw itemsError
  }

  return header
}

/* ------------------------------------------------------------------ */
/* Admin: permohonan                                                   */
/* ------------------------------------------------------------------ */

export async function fetchPermohonanList(): Promise<PermohonanJoined[]> {
  const { data, error } = await supabase
    .from('pinjam_permohonan')
    .select(
      '*, guru:pinjam_guru(id, nama_guru), tujuan:pinjam_tujuan_pinjaman(id, tujuan), items:pinjam_permohonan_item(id)',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  const raw = data as unknown as Array<Record<string, unknown> & { items?: unknown[] }>
  return raw.map((row) => ({
    ...row,
    item_count: Array.isArray(row.items) ? row.items.length : 0,
  })) as unknown as PermohonanJoined[]
}

export async function fetchPermohonanItems(
  permohonanId: string,
): Promise<PermohonanItemJoined[]> {
  const { data, error } = await supabase
    .from('pinjam_permohonan_item')
    .select(
      '*, peralatan:pinjam_peralatan(*, jenama:pinjam_jenama(nama_jenama), kategori:pinjam_kategori_peralatan(nama_kategori))',
    )
    .eq('permohonan_id', permohonanId)
  if (error) throw error
  return (data ?? []) as unknown as PermohonanItemJoined[]
}

export async function fetchPermohonanDetail(
  permohonanId: string,
): Promise<PermohonanJoined | null> {
  const { data, error } = await supabase
    .from('pinjam_permohonan')
    .select(
      '*, guru:pinjam_guru(id, nama_guru), tujuan:pinjam_tujuan_pinjaman(id, tujuan), items:pinjam_permohonan_item(id)',
    )
    .eq('id', permohonanId)
    .single()
  if (error) throw error
  if (!data) return null
  const row = data as unknown as Record<string, unknown> & { items?: unknown[] }
  return {
    ...row,
    item_count: Array.isArray(row.items) ? row.items.length : 0,
  } as unknown as PermohonanJoined
}

/** Approve: set status + approvals, mark equipment as dipinjam. */
export async function approvePermohonan(
  permohonanId: string,
  adminUserId: string,
): Promise<void> {
  const { data: header, error: headerError } = await supabase
    .from('pinjam_permohonan')
    .update({
      status: 'diluluskan',
      diluluskan_oleh: adminUserId,
      diluluskan_pada: nowTimestampKL(),
    })
    .eq('id', permohonanId)
    .select('id')
    .single()
  if (headerError || !header) throw headerError ?? new Error('Gagal mengemas kini permohonan.')

  const { data: items, error: itemsError } = await supabase
    .from('pinjam_permohonan_item')
    .select('peralatan_id')
    .eq('permohonan_id', permohonanId)
  if (itemsError) throw itemsError

  try {
    for (const item of items ?? []) {
      const { error: peralatanError } = await supabase
        .from('pinjam_peralatan')
        .update({ status: 'dipinjam' })
        .eq('id', item.peralatan_id)
        .eq('status', 'tersedia')
      if (peralatanError) throw peralatanError
    }
  } catch (err) {
    await supabase
      .from('pinjam_permohonan')
      .update({ status: 'menunggu_kelulusan', diluluskan_oleh: null, diluluskan_pada: null })
      .eq('id', permohonanId)
    throw err
  }
}

/** Reject: set status + admin note. Equipment stays tersedia (never changed). */
export async function rejectPermohonan(
  permohonanId: string,
  catatan: string,
): Promise<void> {
  const { error } = await supabase
    .from('pinjam_permohonan')
    .update({ status: 'ditolak', catatan_admin: catatan })
    .eq('id', permohonanId)
  if (error) throw error
}

/** Mark as returned: set status selesai, actual return date, revert equipment. */
export async function markPermohonanSelesai(
  permohonanId: string,
  todayKL: string,
): Promise<void> {
  const { data: header, error: headerError } = await supabase
    .from('pinjam_permohonan')
    .update({
      status: 'selesai',
      tarikh_pemulangan_sebenar: todayKL,
    })
    .eq('id', permohonanId)
    .select('id')
    .single()
  if (headerError || !header) throw headerError ?? new Error('Gagal mengemas kini permohonan.')

  const { data: items, error: itemsError } = await supabase
    .from('pinjam_permohonan_item')
    .select('peralatan_id')
    .eq('permohonan_id', permohonanId)
  if (itemsError) throw itemsError

  for (const item of items ?? []) {
    const { error: peralatanError } = await supabase
      .from('pinjam_peralatan')
      .update({ status: 'tersedia' })
      .eq('id', item.peralatan_id)
      .eq('status', 'dipinjam')
    if (peralatanError) throw peralatanError
  }
}

/** Cancel: set status dibatalkan and revert equipment to tersedia. */
export async function cancelPermohonan(permohonanId: string): Promise<void> {
  const { data: header, error: headerError } = await supabase
    .from('pinjam_permohonan')
    .update({ status: 'dibatalkan' })
    .eq('id', permohonanId)
    .select('id')
    .single()
  if (headerError || !header) throw headerError ?? new Error('Gagal mengemas kini permohonan.')

  const { data: items, error: itemsError } = await supabase
    .from('pinjam_permohonan_item')
    .select('peralatan_id')
    .eq('permohonan_id', permohonanId)
  if (itemsError) throw itemsError

  for (const item of items ?? []) {
    const { error: peralatanError } = await supabase
      .from('pinjam_peralatan')
      .update({ status: 'tersedia' })
      .eq('id', item.peralatan_id)
      .eq('status', 'dipinjam')
    if (peralatanError) throw peralatanError
  }
}

export async function deletePermohonan(permohonanId: string): Promise<void> {
  const { data: items, error: itemsError } = await supabase
    .from('pinjam_permohonan_item')
    .select('peralatan_id')
    .eq('permohonan_id', permohonanId)
  if (itemsError) throw itemsError

  for (const item of items ?? []) {
    await supabase
      .from('pinjam_peralatan')
      .update({ status: 'tersedia' })
      .eq('id', item.peralatan_id)
      .eq('status', 'dipinjam')
  }

  const { error } = await supabase
    .from('pinjam_permohonan')
    .delete()
    .eq('id', permohonanId)
  if (error) throw error
}

export async function updatePermohonan(
  permohonanId: string,
  patch: {
    tarikh_pemulangan_dijangka?: string
    tujuan_id?: string
    tujuan_lain_teks?: string | null
    catatan_admin?: string | null
  },
): Promise<void> {
  const { error } = await supabase
    .from('pinjam_permohonan')
    .update(patch)
    .eq('id', permohonanId)
  if (error) throw error
}
