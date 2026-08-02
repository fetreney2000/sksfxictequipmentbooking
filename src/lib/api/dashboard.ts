import { supabase } from '@/lib/supabaseClient'
import type { DashboardStats, PermohonanJoined } from '@/lib/types'
import { addDaysToDateStringKL } from '@/lib/datetime'

export async function fetchDashboardStats(todayKL: string): Promise<DashboardStats> {
  const [menunggu, dipinjam, tersedia, tertunggak] = await Promise.all([
    supabase
      .from('pinjam_permohonan')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'menunggu_kelulusan'),
    supabase
      .from('pinjam_peralatan')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dipinjam'),
    supabase
      .from('pinjam_peralatan')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'tersedia'),
    supabase
      .from('pinjam_permohonan')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'diluluskan')
      .lt('tarikh_pemulangan_dijangka', todayKL),
  ])

  return {
    menunggu: menunggu.count ?? 0,
    dipinjam: dipinjam.count ?? 0,
    tersedia: tersedia.count ?? 0,
    tertunggak: tertunggak.count ?? 0,
  }
}

export async function fetchDueSoon(todayKL: string): Promise<PermohonanJoined[]> {
  const end = addDaysToDateStringKL(todayKL, 3)
  const { data, error } = await supabase
    .from('pinjam_permohonan')
    .select(
      '*, guru:pinjam_guru(id, nama_guru), tujuan:pinjam_tujuan_pinjaman(id, tujuan), items:pinjam_permohonan_item(id)',
    )
    .eq('status', 'diluluskan')
    .gte('tarikh_pemulangan_dijangka', todayKL)
    .lte('tarikh_pemulangan_dijangka', end)
    .order('tarikh_pemulangan_dijangka')
  if (error) throw error
  const raw = data as unknown as Array<Record<string, unknown> & { items?: unknown[] }>
  return raw.map((row) => ({
    ...row,
    item_count: Array.isArray(row.items) ? row.items.length : 0,
  })) as unknown as PermohonanJoined[]
}

export async function fetchRecentPending(): Promise<PermohonanJoined[]> {
  const { data, error } = await supabase
    .from('pinjam_permohonan')
    .select(
      '*, guru:pinjam_guru(id, nama_guru), tujuan:pinjam_tujuan_pinjaman(id, tujuan), items:pinjam_permohonan_item(id)',
    )
    .eq('status', 'menunggu_kelulusan')
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) throw error
  const raw = data as unknown as Array<Record<string, unknown> & { items?: unknown[] }>
  return raw.map((row) => ({
    ...row,
    item_count: Array.isArray(row.items) ? row.items.length : 0,
  })) as unknown as PermohonanJoined[]
}

/** Loans still on loan (diluluskan) whose expected return date has already passed. */
export async function fetchDefaulters(todayKL: string): Promise<PermohonanJoined[]> {
  const { data, error } = await supabase
    .from('pinjam_permohonan')
    .select(
      '*, guru:pinjam_guru(id, nama_guru), tujuan:pinjam_tujuan_pinjaman(id, tujuan), items:pinjam_permohonan_item(id)',
    )
    .eq('status', 'diluluskan')
    .lt('tarikh_pemulangan_dijangka', todayKL)
    .order('tarikh_pemulangan_dijangka')
  if (error) throw error
  const raw = data as unknown as Array<Record<string, unknown> & { items?: unknown[] }>
  return raw.map((row) => ({
    ...row,
    item_count: Array.isArray(row.items) ? row.items.length : 0,
  })) as unknown as PermohonanJoined[]
}

