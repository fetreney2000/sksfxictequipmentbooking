export type Database = {
  public: {
    Tables: {
      pinjam_users: {
        Row: {
          id: string
          username: string
          password_hash: string
          full_name: string
          role: 'admin' | 'supervisor'
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          full_name: string
          role: 'admin' | 'supervisor'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          password_hash?: string
          full_name?: string
          role?: 'admin' | 'supervisor'
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_guru: {
        Row: {
          id: string
          nama_guru: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nama_guru: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          nama_guru?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_kategori_peralatan: {
        Row: {
          id: string
          nama_kategori: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nama_kategori: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          nama_kategori?: string
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_jenama: {
        Row: {
          id: string
          kategori_id: string
          nama_jenama: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kategori_id: string
          nama_jenama: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          kategori_id?: string
          nama_jenama?: string
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_peralatan: {
        Row: {
          id: string
          kategori_id: string
          jenama_id: string
          nombor_siri: string
          nama_peralatan: string | null
          status: 'tersedia' | 'dipinjam' | 'diselenggara' | 'tidak_aktif'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kategori_id: string
          jenama_id: string
          nombor_siri: string
          nama_peralatan?: string | null
          status?: 'tersedia' | 'dipinjam' | 'diselenggara' | 'tidak_aktif'
          created_at?: string
          updated_at?: string
        }
        Update: {
          kategori_id?: string
          jenama_id?: string
          nombor_siri?: string
          nama_peralatan?: string | null
          status?: 'tersedia' | 'dipinjam' | 'diselenggara' | 'tidak_aktif'
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_tujuan_pinjaman: {
        Row: {
          id: string
          tujuan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tujuan: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          tujuan?: string
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_permohonan: {
        Row: {
          id: string
          guru_id: string
          tarikh_pinjaman: string
          tarikh_pemulangan_dijangka: string
          tarikh_pemulangan_sebenar: string | null
          tujuan_id: string
          tujuan_lain_teks: string | null
          status:
            | 'menunggu_kelulusan'
            | 'diluluskan'
            | 'ditolak'
            | 'selesai'
            | 'dibatalkan'
          catatan_admin: string | null
          diluluskan_oleh: string | null
          diluluskan_pada: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guru_id: string
          tarikh_pinjaman: string
          tarikh_pemulangan_dijangka: string
          tarikh_pemulangan_sebenar?: string | null
          tujuan_id: string
          tujuan_lain_teks?: string | null
          status?:
            | 'menunggu_kelulusan'
            | 'diluluskan'
            | 'ditolak'
            | 'selesai'
            | 'dibatalkan'
          catatan_admin?: string | null
          diluluskan_oleh?: string | null
          diluluskan_pada?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          guru_id?: string
          tarikh_pinjaman?: string
          tarikh_pemulangan_dijangka?: string
          tarikh_pemulangan_sebenar?: string | null
          tujuan_id?: string
          tujuan_lain_teks?: string | null
          status?:
            | 'menunggu_kelulusan'
            | 'diluluskan'
            | 'ditolak'
            | 'selesai'
            | 'dibatalkan'
          catatan_admin?: string | null
          diluluskan_oleh?: string | null
          diluluskan_pada?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pinjam_permohonan_item: {
        Row: {
          id: string
          permohonan_id: string
          peralatan_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          permohonan_id: string
          peralatan_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          permohonan_id?: string
          peralatan_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type UserRow = Database['public']['Tables']['pinjam_users']['Row']
export type GuruRow = Database['public']['Tables']['pinjam_guru']['Row']
export type KategoriRow =
  Database['public']['Tables']['pinjam_kategori_peralatan']['Row']
export type JenamaRow = Database['public']['Tables']['pinjam_jenama']['Row']
export type PeralatanRow =
  Database['public']['Tables']['pinjam_peralatan']['Row']
export type TujuanRow =
  Database['public']['Tables']['pinjam_tujuan_pinjaman']['Row']
export type PermohonanRow =
  Database['public']['Tables']['pinjam_permohonan']['Row']
export type PermohonanItemRow =
  Database['public']['Tables']['pinjam_permohonan_item']['Row']

export type PermohonanStatus =
  | 'menunggu_kelulusan'
  | 'diluluskan'
  | 'ditolak'
  | 'selesai'
  | 'dibatalkan'

export type PeralatanStatus =
  | 'tersedia'
  | 'dipinjam'
  | 'diselenggara'
  | 'tidak_aktif'

export type UserRole = 'admin' | 'supervisor'

export interface PermohonanJoined extends PermohonanRow {
  guru: { nama_guru: string }
  tujuan: { tujuan: string }
  items: PermohonanItemJoined[]
  item_count?: number
}

export interface PermohonanItemJoined extends PermohonanItemRow {
  peralatan: {
    nombor_siri: string
    nama_peralatan: string | null
    status: PeralatanStatus
    jenama: { nama_jenama: string }
    kategori: { nama_kategori: string }
  }
}

export interface DashboardStats {
  menunggu: number
  dipinjam: number
  tersedia: number
  tertunggak: number
}
