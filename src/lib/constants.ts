import type { PermohonanStatus, PeralatanStatus, UserRole } from '@/lib/types'

export const STATUS_PERMOHONAN_LABEL: Record<PermohonanStatus, string> = {
  menunggu_kelulusan: 'Menunggu Kelulusan',
  diluluskan: 'Diluluskan',
  ditolak: 'Ditolak',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}

export const STATUS_PERMOHONAN_VARIANT: Record<
  PermohonanStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  menunggu_kelulusan: 'secondary',
  diluluskan: 'default',
  ditolak: 'destructive',
  selesai: 'outline',
  dibatalkan: 'outline',
}

export const STATUS_PERALATAN_LABEL: Record<PeralatanStatus, string> = {
  tersedia: 'Tersedia',
  dipinjam: 'Dipinjam',
  diselenggara: 'Diselenggara',
  tidak_aktif: 'Tidak Aktif',
}

export const STATUS_PERALATAN_VARIANT: Record<
  PeralatanStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  tersedia: 'default',
  dipinjam: 'secondary',
  diselenggara: 'destructive',
  tidak_aktif: 'outline',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  supervisor: 'Penyelia',
}

export const TUJUAN_LAIN_LAIN = 'Lain-lain'

export const SEKOLAH_NAMA = 'Sistem Pinjaman Peralatan ICT'
export const SEKOLAH_SUBTITLE = 'SK ST Francis Xavier Keningau'
