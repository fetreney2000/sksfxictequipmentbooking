import { useQuery } from '@tanstack/react-query'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import { Combobox } from '@/components/combobox'
import { AlertCircle } from 'lucide-react'
import { useWizardStore } from '@/store/wizard'
import { fetchActiveGuru, fetchTujuanList } from '@/lib/api/permohonan'
import {
  todayDateStringKL,
  isOnOrAfterDateStringKL,
  isWeekendDateStringKL,
  calendarDateToStorageKL,
  storageToCalendarDateKL,
} from '@/lib/datetime'
import { TUJUAN_LAIN_LAIN } from '@/lib/constants'

export function Step3Butiran() {
  const guru = useWizardStore((s) => s.guru)
  const setGuru = useWizardStore((s) => s.setGuru)
  const tujuan = useWizardStore((s) => s.tujuan)
  const setTujuan = useWizardStore((s) => s.setTujuan)
  const tujuanLainTeks = useWizardStore((s) => s.tujuan_lain_teks)
  const setTujuanLainTeks = useWizardStore((s) => s.setTujuanLainTeks)
  const tarikhPinjaman = useWizardStore((s) => s.tarikh_pinjaman)
  const tarikhPulangan = useWizardStore((s) => s.tarikh_pemulangan_dijangka)
  const setTarikhPulangan = useWizardStore((s) => s.setTarikhPemulanganDijangka)

  const { data: guruList } = useQuery({
    queryKey: ['pinjam_guru', 'active'],
    queryFn: fetchActiveGuru,
  })

  const { data: tujuanList } = useQuery({
    queryKey: ['pinjam_tujuan_pinjaman'],
    queryFn: fetchTujuanList,
  })

  const todayStr = todayDateStringKL()
  const returnDateInvalid =
    Boolean(tarikhPinjaman) &&
    Boolean(tarikhPulangan) &&
    !isOnOrAfterDateStringKL(tarikhPulangan as string, tarikhPinjaman as string)

  const isReturnDayDisabled = (date: Date) => {
    const dayStr = calendarDateToStorageKL(date)
    return isWeekendDateStringKL(dayStr)
  }

  const showLainLain = tujuan?.tujuan === TUJUAN_LAIN_LAIN

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Langkah 3: Butiran Peminjam</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Isikan butiran peminjam dan tujuan pinjaman.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guru">Nama Guru</Label>
        <Combobox
          options={(guruList ?? []).map((g) => ({ value: g.id, label: g.nama_guru }))}
          value={guru?.id ?? null}
          onChange={(v) => setGuru(guruList?.find((g) => g.id === v) ?? null)}
          placeholder="Pilih nama guru"
          searchPlaceholder="Cari nama guru..."
          emptyText="Tiada guru ditemui."
        />
        <p className="text-xs text-muted-foreground">
          Nama anda tidak dalam senarai? Sila hubungi pentadbir sistem.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tujuan">Tujuan Pinjaman</Label>
        <Combobox
          options={(tujuanList ?? []).map((t) => ({ value: t.id, label: t.tujuan }))}
          value={tujuan?.id ?? null}
          onChange={(v) => setTujuan(tujuanList?.find((t) => t.id === v) ?? null)}
          placeholder="Pilih tujuan pinjaman"
          searchPlaceholder="Cari tujuan..."
          emptyText="Tiada tujuan ditemui."
        />
      </div>

      {showLainLain && (
        <div className="space-y-2">
          <Label htmlFor="tujuan-lain">Nyatakan Tujuan Lain</Label>
          <Textarea
            id="tujuan-lain"
            placeholder="Sila nyatakan tujuan anda..."
            value={tujuanLainTeks}
            onChange={(e) => setTujuanLainTeks(e.target.value)}
            maxLength={300}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="pulangan">Tarikh Pemulangan (Dijangka)</Label>
        <DatePicker
          value={tarikhPulangan}
          onChange={setTarikhPulangan}
          placeholder="Pilih tarikh pemulangan"
          minDate={
            tarikhPinjaman
              ? storageToCalendarDateKL(tarikhPinjaman)
              : storageToCalendarDateKL(todayStr)
          }
          disabledDays={isReturnDayDisabled}
        />
        {returnDateInvalid && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="size-3.5" />
            Tarikh pemulangan mestilah sama atau selepas tarikh pinjaman.
          </p>
        )}
      </div>
    </div>
  )
}
