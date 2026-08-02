import { CalendarDays, User, Target, Package } from 'lucide-react'
import { useWizardStore } from '@/store/wizard'
import { formatDateStringLongKL } from '@/lib/datetime'

export function Step4Semakan() {
  const tarikhPinjaman = useWizardStore((s) => s.tarikh_pinjaman)
  const tarikhPulangan = useWizardStore((s) => s.tarikh_pemulangan_dijangka)
  const items = useWizardStore((s) => s.items)
  const guru = useWizardStore((s) => s.guru)
  const tujuan = useWizardStore((s) => s.tujuan)
  const tujuanLainTeks = useWizardStore((s) => s.tujuan_lain_teks)

  const tujuanResolved = tujuan?.tujuan === 'Lain-lain' ? tujuanLainTeks.trim() : tujuan?.tujuan

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Langkah 4: Semakan & Hantar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sila semak maklumat permohonan anda sebelum menghantar.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tarikh Pinjaman</p>
            <p className="text-sm font-medium">{formatDateStringLongKL(tarikhPinjaman)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tarikh Pemulangan (Dijangka)</p>
            <p className="text-sm font-medium">{formatDateStringLongKL(tarikhPulangan)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <User className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Nama Guru</p>
            <p className="text-sm font-medium">{guru?.nama_guru}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tujuan Pinjaman</p>
            <p className="text-sm font-medium">{tujuanResolved}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                Peralatan Dipilih ({items.length})
              </p>
              <ul className="mt-2 space-y-2">
                {items.map((item) => (
                  <li key={item.peralatan_id} className="text-sm">
                    <p className="font-medium">
                      {item.nama_kategori} — {item.nama_jenama}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.nama_peralatan ? `${item.nama_peralatan} · ` : ''}
                      Nombor Siri: {item.nombor_siri}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-primary">
        Dengan menghantar permohonan ini, anda bersetuju memulangkan semua peralatan pada
        tarikh yang dinyatakan. Permohonan akan disemak oleh pihak pentadbir sekolah.
      </p>
    </div>
  )
}
