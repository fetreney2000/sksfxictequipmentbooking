import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FileDown, FileText, Download, UserX, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/date-picker'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPermohonanBadge } from '@/components/StatusBadge'
import { fetchPermohonanList } from '@/lib/api/permohonan'
import { fetchAllPeralatan } from '@/lib/api/master'
import {
  todayDateStringKL,
  formatDateStringKL,
  isOnOrAfterDateStringKL,
  isOnOrBeforeDateStringKL,
  compareDateStringsKL,
  daysBetweenKL,
  storageToCalendarDateKL,
  shortReference,
} from '@/lib/datetime'
import { STATUS_PERMOHONAN_LABEL } from '@/lib/constants'
import type { PermohonanStatus } from '@/lib/types'
import { exportLaporanPdf } from '@/lib/export-pdf'
import { exportLaporanDocx } from '@/lib/export-docx'

function firstDayOfMonthKL(): string {
  return `${todayDateStringKL().slice(0, 8)}01`
}

export function LaporanPage() {
  const today = todayDateStringKL()
  const [dariTarikh, setDariTarikh] = useState<string | null>(firstDayOfMonthKL())
  const [hinggaTarikh, setHinggaTarikh] = useState<string | null>(today)

  const { data: allRows, isLoading } = useQuery({
    queryKey: ['pinjam_permohonan'],
    queryFn: fetchPermohonanList,
  })

  const { data: peralatanMap } = useQuery({
    queryKey: ['pinjam_peralatan', 'all'],
    queryFn: fetchAllPeralatan,
  })

  const peralatanName = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of peralatanMap ?? []) {
      map.set(
        p.id,
        p.nama_peralatan ||
          `${p.kategori?.nama_kategori ?? ''} ${p.jenama?.nama_jenama ?? ''}`.trim() ||
          p.nombor_siri,
      )
    }
    return map
  }, [peralatanMap])

  const filtered = useMemo(() => {
    if (!allRows || !dariTarikh || !hinggaTarikh) return []
    return allRows.filter(
      (p) =>
        isOnOrAfterDateStringKL(p.tarikh_pinjaman, dariTarikh) &&
        isOnOrBeforeDateStringKL(p.tarikh_pinjaman, hinggaTarikh),
    )
  }, [allRows, dariTarikh, hinggaTarikh])

  /** Loans due in the report period that are still not returned (overdue today). */
  const defaulters = useMemo(() => {
    if (!allRows || !dariTarikh || !hinggaTarikh) return []
    return allRows
      .filter(
        (p) =>
          p.status === 'diluluskan' &&
          isOnOrAfterDateStringKL(p.tarikh_pemulangan_dijangka, dariTarikh) &&
          isOnOrBeforeDateStringKL(p.tarikh_pemulangan_dijangka, hinggaTarikh) &&
          compareDateStringsKL(p.tarikh_pemulangan_dijangka, today) < 0,
      )
      .sort((a, b) => compareDateStringsKL(a.tarikh_pemulangan_dijangka, b.tarikh_pemulangan_dijangka))
  }, [allRows, dariTarikh, hinggaTarikh, today])

  const stats = useMemo(() => {
    const pecahan: Record<PermohonanStatus, number> = {
      menunggu_kelulusan: 0,
      diluluskan: 0,
      ditolak: 0,
      selesai: 0,
      dibatalkan: 0,
    }
    for (const p of filtered) pecahan[p.status] += 1

    const itemCounts = new Map<string, { nama: string; jumlah: number }>()
    for (const p of filtered) {
      for (const item of p.items ?? []) {
        const key = item.peralatan_id
        const nama = peralatanName.get(key) ?? 'Peralatan'
        const cur = itemCounts.get(key)
        if (cur) cur.jumlah += 1
        else itemCounts.set(key, { nama, jumlah: 1 })
      }
    }
    const peralatanTerkini = Array.from(itemCounts.values())
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10)

    return { jumlah: filtered.length, pecahan, peralatanTerkini }
  }, [filtered, peralatanName])

  const handlePdf = async () => {
    if (!dariTarikh || !hinggaTarikh) return
    try {
      await exportLaporanPdf({
        filename: `Laporan_Pinjaman_${dariTarikh}_hingga_${hinggaTarikh}.pdf`,
        dariTarikh,
        hinggaTarikh,
        jumlah: stats.jumlah,
        pecahanStatus: stats.pecahan,
        peralatanTerkini: stats.peralatanTerkini,
        rows: filtered.map((p) => ({
          rujukan: shortReference(p.id),
          namaGuru: p.guru?.nama_guru ?? '-',
          tarikhPinjaman: formatDateStringKL(p.tarikh_pinjaman),
          tarikhPulangan: formatDateStringKL(p.tarikh_pemulangan_dijangka),
          status: STATUS_PERMOHONAN_LABEL[p.status],
          bilPeralatan: p.item_count ?? 0,
        })),
      })
    } catch {
      toast.error('Gagal menjana PDF.')
    }
  }

  const handleDocx = async () => {
    if (!dariTarikh || !hinggaTarikh) return
    try {
      await exportLaporanDocx({
        filename: `Laporan_Pinjaman_${dariTarikh}_hingga_${hinggaTarikh}.docx`,
        dariTarikh,
        hinggaTarikh,
        jumlah: stats.jumlah,
        pecahanStatus: stats.pecahan,
        peralatanTerkini: stats.peralatanTerkini,
        rows: filtered.map((p) => ({
          rujukan: shortReference(p.id),
          namaGuru: p.guru?.nama_guru ?? '-',
          tarikhPinjaman: formatDateStringKL(p.tarikh_pinjaman),
          tarikhPulangan: formatDateStringKL(p.tarikh_pemulangan_dijangka),
          status: STATUS_PERMOHONAN_LABEL[p.status],
          bilPeralatan: p.item_count ?? 0,
        })),
      })
    } catch {
      toast.error('Gagal menjana fail Word.')
    }
  }

  const invalidRange =
    Boolean(dariTarikh) &&
    Boolean(hinggaTarikh) &&
    !isOnOrAfterDateStringKL(hinggaTarikh as string, dariTarikh as string)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground">
            Laporan pinjaman peralatan ICT mengikut tempoh tarikh.
          </p>
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handlePdf} disabled={!dariTarikh || !hinggaTarikh || invalidRange}>
            <FileDown className="size-4" />
            Muat Turun PDF
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleDocx} disabled={!dariTarikh || !hinggaTarikh || invalidRange}>
            <FileText className="size-4" />
            Muat Turun Word
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tempoh Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Dari Tarikh</Label>
              <DatePicker
                value={dariTarikh}
                onChange={setDariTarikh}
              />
            </div>
            <div className="space-y-2">
              <Label>Hingga Tarikh</Label>
              <DatePicker
                value={hinggaTarikh}
                onChange={setHinggaTarikh}
                minDate={dariTarikh ? storageToCalendarDateKL(dariTarikh) : undefined}
              />
            </div>
          </div>
          {invalidRange && (
            <p className="mt-2 text-xs font-medium text-destructive">
              Tarikh "Hingga" mestilah sama atau selepas tarikh "Dari".
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Jumlah Permohonan</p>
                <p className="text-2xl font-bold">{stats.jumlah}</p>
              </CardContent>
            </Card>
            {Object.entries(stats.pecahan).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    {STATUS_PERMOHONAN_LABEL[status as PermohonanStatus]}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats.peralatanTerkini.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Peralatan Paling Kerap Dipinjam
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stats.peralatanTerkini.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{p.nama}</span>
                      <BadgePeralatan jumlah={p.jumlah} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-destructive/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <UserX className="size-4 text-destructive" />
                Peminjam Lewat Memulangkan (Defaulter)
              </CardTitle>
              <Link to="/admin/permohonan" className="text-xs font-medium text-primary hover:underline">
                Lihat Semua
              </Link>
            </CardHeader>
            <CardContent>
              {defaulters.length === 0 ? (
                <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                  Tiada pinjaman lewat dipulangkan dalam tempoh yang dipilih.
                </p>
              ) : (
                <ul className="divide-y">
                  {defaulters.map((p) => {
                    const overdue = daysBetweenKL(p.tarikh_pemulangan_dijangka, today)
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.guru?.nama_guru}</p>
                          <p className="text-xs text-muted-foreground">
                            Rujukan: {shortReference(p.id)} &middot; Tarikh pemulangan:{' '}
                            {formatDateStringKL(p.tarikh_pemulangan_dijangka)}{' '}
                            <span className="font-semibold text-destructive">
                              &middot; Lewat {overdue} hari
                            </span>
                          </p>
                        </div>
                        <Link
                          to={`/admin/permohonan/${p.id}`}
                           className="flex min-h-11 shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline sm:min-h-0"
                        >
                          Buka <ChevronRight className="size-3.5" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Senarai Permohonan ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tiada permohonan dalam tempoh yang dipilih.
                </p>
              ) : (
                <>
                <table className="hidden w-full min-w-[720px] text-sm sm:table">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Rujukan</th>
                      <th className="px-3 py-2 font-medium">Nama Guru</th>
                      <th className="px-3 py-2 font-medium">Tarikh Pinjaman</th>
                      <th className="px-3 py-2 font-medium">Tarikh Pemulangan (Dijangka)</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 text-right font-medium">Bil. Peralatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/40">
                        <td className="px-3 py-2 font-mono text-xs font-semibold">
                          {shortReference(p.id)}
                        </td>
                        <td className="px-3 py-2">{p.guru?.nama_guru ?? '-'}</td>
                        <td className="px-3 py-2">{formatDateStringKL(p.tarikh_pinjaman)}</td>
                        <td className="px-3 py-2">
                          {formatDateStringKL(p.tarikh_pemulangan_dijangka)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusPermohonanBadge status={p.status} />
                        </td>
                        <td className="px-3 py-2 text-right">{p.item_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-3 sm:hidden">
                  {filtered.map((p) => (
                    <Link
                      key={p.id}
                      to={`/admin/permohonan/${p.id}`}
                      className="block rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-primary">
                            {shortReference(p.id)}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold">{p.guru?.nama_guru ?? '-'}</p>
                        </div>
                        <StatusPermohonanBadge status={p.status} />
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Tarikh pinjaman</dt>
                          <dd className="mt-0.5 font-medium">{formatDateStringKL(p.tarikh_pinjaman)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Tarikh pulangan</dt>
                          <dd className="mt-0.5 font-medium">
                            {formatDateStringKL(p.tarikh_pemulangan_dijangka)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Peralatan</dt>
                          <dd className="mt-0.5 font-medium">{p.item_count ?? 0} unit</dd>
                        </div>
                      </dl>
                    </Link>
                  ))}
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function BadgePeralatan({ jumlah }: { jumlah: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      <Download className="size-3" />
      {jumlah} kali
    </span>
  )
}

