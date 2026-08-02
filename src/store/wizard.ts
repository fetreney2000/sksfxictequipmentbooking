import { create } from 'zustand'
import type { GuruRow, TujuanRow } from '@/lib/types'

export interface WizardItem {
  peralatan_id: string
  nombor_siri: string
  nama_peralatan: string | null
  jenama_id: string
  nama_jenama: string
  kategori_id: string
  nama_kategori: string
}

export interface WizardState {
  step: number
  tarikh_pinjaman: string | null
  tarikh_pemulangan_dijangka: string | null
  items: WizardItem[]
  guru: GuruRow | null
  tujuan: TujuanRow | null
  tujuan_lain_teks: string
  submittedRef: string | null
  setStep: (step: number) => void
  setTarikhPinjaman: (date: string | null) => void
  setTarikhPemulanganDijangka: (date: string | null) => void
  addItem: (item: WizardItem) => void
  removeItem: (peralatan_id: string) => void
  clearItems: () => void
  setGuru: (guru: GuruRow | null) => void
  setTujuan: (tujuan: TujuanRow | null) => void
  setTujuanLainTeks: (text: string) => void
  setSubmittedRef: (ref: string | null) => void
  reset: () => void
}

const initialState = {
  step: 1,
  tarikh_pinjaman: null,
  tarikh_pemulangan_dijangka: null,
  items: [],
  guru: null,
  tujuan: null,
  tujuan_lain_teks: '',
  submittedRef: null,
}

export const useWizardStore = create<WizardState>()((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setTarikhPinjaman: (date) => set({ tarikh_pinjaman: date }),
  setTarikhPemulanganDijangka: (date) =>
    set({ tarikh_pemulangan_dijangka: date }),
  addItem: (item) =>
    set((state) => {
      if (state.items.some((i) => i.peralatan_id === item.peralatan_id)) {
        return state
      }
      return { items: [...state.items, item] }
    }),
  removeItem: (peralatan_id) =>
    set((state) => ({
      items: state.items.filter((i) => i.peralatan_id !== peralatan_id),
    })),
  clearItems: () => set({ items: [] }),
  setGuru: (guru) => set({ guru }),
  setTujuan: (tujuan) => set({ tujuan }),
  setTujuanLainTeks: (text) => set({ tujuan_lain_teks: text }),
  setSubmittedRef: (ref) => set({ submittedRef: ref }),
  reset: () => set({ ...initialState }),
}))
