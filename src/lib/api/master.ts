import { supabase } from '@/lib/supabaseClient'
import type {
  GuruRow,
  KategoriRow,
  JenamaRow,
  PeralatanRow,
  TujuanRow,
  PeralatanStatus,
} from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Kategori                                                            */
/* ------------------------------------------------------------------ */

export async function fetchAllKategori(): Promise<KategoriRow[]> {
  const { data, error } = await supabase
    .from('pinjam_kategori_peralatan')
    .select('*')
    .order('nama_kategori')
  if (error) throw error
  return data ?? []
}

export async function createKategori(nama: string): Promise<void> {
  const { error } = await supabase.from('pinjam_kategori_peralatan').insert({ nama_kategori: nama })
  if (error) throw error
}

export async function updateKategori(id: string, nama: string): Promise<void> {
  const { error } = await supabase
    .from('pinjam_kategori_peralatan')
    .update({ nama_kategori: nama })
    .eq('id', id)
  if (error) throw error
}

export async function deleteKategori(id: string): Promise<void> {
  const { error } = await supabase.from('pinjam_kategori_peralatan').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/* Jenama                                                              */
/* ------------------------------------------------------------------ */

export async function fetchAllJenama(): Promise<(JenamaRow & { kategori: { nama_kategori: string } })[]> {
  const { data, error } = await supabase
    .from('pinjam_jenama')
    .select('*, kategori:pinjam_kategori_peralatan(nama_kategori)')
    .order('nama_jenama')
  if (error) throw error
  return (data ?? []) as unknown as (JenamaRow & { kategori: { nama_kategori: string } })[]
}

export async function createJenama(kategori_id: string, nama: string): Promise<void> {
  const { error } = await supabase
    .from('pinjam_jenama')
    .insert({ kategori_id, nama_jenama: nama })
  if (error) throw error
}

export async function updateJenama(id: string, kategori_id: string, nama: string): Promise<void> {
  const { error } = await supabase
    .from('pinjam_jenama')
    .update({ kategori_id, nama_jenama: nama })
    .eq('id', id)
  if (error) throw error
}

export async function deleteJenama(id: string): Promise<void> {
  const { error } = await supabase.from('pinjam_jenama').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/* Peralatan                                                           */
/* ------------------------------------------------------------------ */

export async function fetchAllPeralatan(): Promise<
  (PeralatanRow & {
    kategori: { nama_kategori: string }
    jenama: { nama_jenama: string }
  })[]
> {
  const { data, error } = await supabase
    .from('pinjam_peralatan')
    .select(
      '*, kategori:pinjam_kategori_peralatan(nama_kategori), jenama:pinjam_jenama(nama_jenama)',
    )
    .order('nombor_siri')
  if (error) throw error
  return data as unknown as (PeralatanRow & {
    kategori: { nama_kategori: string }
    jenama: { nama_jenama: string }
  })[]
}

export async function createPeralatan(input: {
  kategori_id: string
  jenama_id: string
  nombor_siri: string
  nama_peralatan?: string | null
  status?: PeralatanStatus
}): Promise<void> {
  const { error } = await supabase.from('pinjam_peralatan').insert({
    kategori_id: input.kategori_id,
    jenama_id: input.jenama_id,
    nombor_siri: input.nombor_siri,
    nama_peralatan: input.nama_peralatan ?? null,
    status: input.status ?? 'tersedia',
  })
  if (error) throw error
}

export async function updatePeralatan(
  id: string,
  patch: Partial<{
    kategori_id: string
    jenama_id: string
    nombor_siri: string
    nama_peralatan: string | null
    status: PeralatanStatus
  }>,
): Promise<void> {
  const { error } = await supabase.from('pinjam_peralatan').update(patch).eq('id', id)
  if (error) throw error
}

export async function deletePeralatan(id: string): Promise<void> {
  const { error } = await supabase.from('pinjam_peralatan').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/* Guru                                                                */
/* ------------------------------------------------------------------ */

export async function fetchAllGuru(): Promise<GuruRow[]> {
  const { data, error } = await supabase
    .from('pinjam_guru')
    .select('*')
    .order('nama_guru')
  if (error) throw error
  return data ?? []
}

export async function createGuru(nama: string): Promise<void> {
  const { error } = await supabase.from('pinjam_guru').insert({ nama_guru: nama })
  if (error) throw error
}

export async function updateGuru(
  id: string,
  patch: Partial<{ nama_guru: string; is_active: boolean }>,
): Promise<void> {
  const { error } = await supabase
    .from('pinjam_guru')
    .update(patch)
    .eq('id', id)
  if (error) throw error
}

export async function deleteGuru(id: string): Promise<void> {
  const { error } = await supabase.from('pinjam_guru').delete().eq('id', id)
  if (error) throw error
}

/** Upsert a batch of guru names, ignoring ones already present by name. */
export async function upsertGuruNames(names: string[]): Promise<{
  added: number
  duplicates: number
}> {
  const { data: existing, error: listError } = await supabase
    .from('pinjam_guru')
    .select('nama_guru')
  if (listError) throw listError

  const existingNames = new Set((existing ?? []).map((g) => g.nama_guru.trim()))
  const uniqueNew = Array.from(new Set(names.map((n) => n.trim()))).filter(
    (n) => !existingNames.has(n),
  )

  if (uniqueNew.length === 0) {
    return { added: 0, duplicates: names.length }
  }

  const { error } = await supabase
    .from('pinjam_guru')
    .insert(uniqueNew.map((nama_guru) => ({ nama_guru })))
  if (error) throw error

  return { added: uniqueNew.length, duplicates: names.length - uniqueNew.length }
}

/* ------------------------------------------------------------------ */
/* Tujuan                                                              */
/* ------------------------------------------------------------------ */

export async function fetchAllTujuan(): Promise<TujuanRow[]> {
  const { data, error } = await supabase
    .from('pinjam_tujuan_pinjaman')
    .select('*')
    .order('tujuan')
  if (error) throw error
  return data ?? []
}

export async function createTujuan(tujuan: string): Promise<void> {
  const { error } = await supabase.from('pinjam_tujuan_pinjaman').insert({ tujuan })
  if (error) throw error
}

export async function deleteTujuan(id: string): Promise<void> {
  const { error } = await supabase.from('pinjam_tujuan_pinjaman').delete().eq('id', id)
  if (error) throw error
}
