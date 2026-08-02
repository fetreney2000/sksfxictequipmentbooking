import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Printer,
  FileDown,
  FileText,
  Pencil,
  Trash2,
  Ban,
  Undo2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DatePicker } from '@/components/date-picker'
import { Combobox } from '@/components/combobox'
import { StatusPermohonanBadge } from '@/components/StatusBadge'
import { PermohonanPrintView } from '@/features/admin-permohonan/PermohonanPrintView'
import { ApprovePermohonanDialog } from '@/features/admin-permohonan/ApprovePermohonanDialog'
import {
  fetchPermohonanDetail,
  fetchPermohonanItems,
  approvePermohonanSelection,
  rejectPermohonan,
  markPermohonanSelesai,
  undoSelesaiPermohonan,
  cancelPermohonan,
  deletePermohonan,
  updatePermohonan,
  fetchTujuanList,
} from '@/lib/api/permohonan'
import { useAuth } from '@/hooks/useAuth'
import {
  formatDateStringLongKL,
  toDateDisplayKL,
  toDateTimeDisplayKL,
  shortReference,
  todayDateStringKL,
  isOnOrAfterDateStringKL,
  storageToCalendarDateKL,
} from '@/lib/datetime'
import {
  exportPermohonanPdf,
  permohonanFilename,
} from '@/lib/export-pdf'
import { exportPermohonanDocx } from '@/lib/export-docx'
import { TUJUAN_LAIN_LAIN } from '@/lib/constants'

function TolakDialog({
  onReject,
}: {
  onReject: (reason: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await onReject(reason.trim())
      setOpen(false)
      setReason('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <XCircle className="size-4" />
          Tolak
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak Permohonan</DialogTitle>
          <DialogDescription>
            Sila nyatakan sebab penolakan. Sebab ini akan dipaparkan kepada pihak berkaitan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="tolak-reason">Sebab Penolakan</Label>
          <Textarea
            id="tolak-reason"
            
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!reason.trim() || loading}
          >
            {loading ? 'Menghantar...' : 'Sahkan Tolak'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function KemaskiniDialog({
  tarikhPinjaman,
  initialReturnDate,
  initialTujuanId,
  initialTujuanLain,
  onUpdate,
}: {
  tarikhPinjaman: string
  initialReturnDate: string
  initialTujuanId: string
  initialTujuanLain: string | null
  onUpdate: (patch: {
    tarikh_pemulangan_dijangka?: string
    tujuan_id?: string
    tujuan_lain_teks?: string | null
  }) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [returnDate, setReturnDate] = useState(initialReturnDate)
  const [tujuanId, setTujuanId] = useState(initialTujuanId)
  const [tujuanLain, setTujuanLain] = useState(initialTujuanLain ?? '')
  const [loading, setLoading] = useState(false)

  const returnDateInvalid = !isOnOrAfterDateStringKL(returnDate, tarikhPinjaman)

  const { data: tujuanList } = useQuery({
    queryKey: ['pinjam_tujuan_pinjaman'],
    queryFn: fetchTujuanList,
  })

  const selectedTujuan = tujuanList?.find((t) => t.id === tujuanId)
  const showLainLain = selectedTujuan?.tujuan === TUJUAN_LAIN_LAIN

  const submit = async () => {
    setLoading(true)
    try {
      await onUpdate({
        tarikh_pemulangan_dijangka: returnDate,
        tujuan_id: tujuanId,
        tujuan_lain_teks: showLainLain ? tujuanLain.trim() : null,
      })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="size-4" />
          Kemaskini
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kemaskini Permohonan</DialogTitle>
          <DialogDescription>
            Kemaskini tarikh pemulangan dijangka atau tujuan pinjaman.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tarikh Pemulangan (Dijangka)</Label>
            <DatePicker
              value={returnDate}
              onChange={(d) => d && setReturnDate(d)}
              minDate={storageToCalendarDateKL(tarikhPinjaman)}
            />
            {returnDateInvalid && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="size-3.5" />
                Tarikh pemulangan mestilah sama atau selepas tarikh pinjaman.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tujuan Pinjaman</Label>
            <Combobox
              options={(tujuanList ?? []).map((t) => ({ value: t.id, label: t.tujuan }))}
              value={tujuanId}
              onChange={setTujuanId}
              
            />
          </div>
          {showLainLain && (
            <div className="space-y-2">
              <Label>Nyatakan Tujuan Lain</Label>
              <Textarea
                value={tujuanLain}
                onChange={(e) => setTujuanLain(e.target.value)}
                
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={loading || returnDateInvalid}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PermohonanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAdmin } = useAuth()

  const [approveOpen, setApproveOpen] = useState(false)

  const { data: permohonan, isLoading } = useQuery({
    queryKey: ['pinjam_permohonan', id],
    queryFn: () => fetchPermohonanDetail(id as string),
    enabled: Boolean(id),
  })

  const { data: items } = useQuery({
    queryKey: ['pinjam_permohonan_item', id],
    queryFn: () => fetchPermohonanItems(id as string),
    enabled: Boolean(id),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pinjam_permohonan'] })
    queryClient.invalidateQueries({ queryKey: ['pinjam_peralatan'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const approveMutation = useMutation({
    mutationFn: (finalPeralatanIds: string[]) =>
      approvePermohonanSelection(id as string, user?.id ?? '', finalPeralatanIds),
    onSuccess: () => {
      toast.success('Permohonan telah diluluskan.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal meluluskan.'),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectPermohonan(id as string, reason),
    onSuccess: () => {
      toast.success('Permohonan telah ditolak.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal menolak.'),
  })

  const selesaiMutation = useMutation({
    mutationFn: () => markPermohonanSelesai(id as string, todayDateStringKL()),
    onSuccess: () => {
      toast.success('Permohonan ditandakan sebagai selesai.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal mengemas kini.'),
  })

  const undoSelesaiMutation = useMutation({
    mutationFn: () => undoSelesaiPermohonan(id as string),
    onSuccess: () => {
      toast.success('Permohonan dikembalikan kepada status diluluskan.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal mengemas kini.'),
  })

  const batalMutation = useMutation({
    mutationFn: () => cancelPermohonan(id as string),
    onSuccess: () => {
      toast.success('Permohonan telah dibatalkan.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal membatalkan.'),
  })

  const padamMutation = useMutation({
    mutationFn: () => deletePermohonan(id as string),
    onSuccess: () => {
      toast.success('Permohonan telah dipadam.')
      navigate('/admin/permohonan')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal memadam.'),
  })

  const kemaskiniMutation = useMutation({
    mutationFn: (patch: {
      tarikh_pemulangan_dijangka?: string
      tujuan_id?: string
      tujuan_lain_teks?: string | null
    }) => updatePermohonan(id as string, patch),
    onSuccess: () => {
      toast.success('Permohonan telah dikemas kini.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal mengemas kini.'),
  })

  if (isLoading || !permohonan) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  const tujuanResolved =
    permohonan.tujuan?.tujuan === TUJUAN_LAIN_LAIN
      ? permohonan.tujuan_lain_teks || TUJUAN_LAIN_LAIN
      : permohonan.tujuan?.tujuan ?? '-'

  const handleDownloadPdf = async () => {
    try {
      await exportPermohonanPdf(permohonan, items ?? [], permohonanFilename(permohonan, 'pdf'))
    } catch {
      toast.error('Gagal menjana PDF.')
    }
  }

  const handleDownloadDocx = async () => {
    try {
      await exportPermohonanDocx(permohonan, items ?? [], permohonanFilename(permohonan, 'docx'))
    } catch {
      toast.error('Gagal menjana fail Word.')
    }
  }

  const showActions =
    isAdmin && permohonan.status === 'menunggu_kelulusan'
  const showReturn = isAdmin && permohonan.status === 'diluluskan'
  const showUndoSelesai = isAdmin && permohonan.status === 'selesai'
  const showDelete = isAdmin

  return (
    <div className="space-y-5">
      <div className="no-print print:hidden">
        <button
          onClick={() => navigate('/admin/permohonan')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Kembali ke Senarai
        </button>
      </div>

      <div className="no-print print:hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Permohonan{' '}
            <span className="font-mono text-primary">{shortReference(permohonan.id)}</span>
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusPermohonanBadge status={permohonan.status} />
            <span className="text-xs text-muted-foreground">
              Dihantar pada {toDateTimeDisplayKL(permohonan.created_at)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showActions && (
            <>
              <Button onClick={() => setApproveOpen(true)}>
                <CheckCircle2 className="size-4" />
                Luluskan
              </Button>
              <TolakDialog onReject={(r) => rejectMutation.mutateAsync(r)} />
            </>
          )}
          {showReturn && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={selesaiMutation.isPending}>
                  <CheckCircle2 className="size-4" />
                  {selesaiMutation.isPending ? 'Menyimpan...' : 'Tandai Selesai/Dipulangkan'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tandai Sebagai Selesai?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Permohonan akan ditandakan sebagai selesai, tarikh pemulangan sebenar
                    akan direkodkan sebagai hari ini, dan semua peralatan akan dikembalikan
                    kepada status "Tersedia".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => selesaiMutation.mutate()}>
                    Ya, Tandai Selesai
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showUndoSelesai && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={undoSelesaiMutation.isPending}>
                  <Undo2 className="size-4" />
                  {undoSelesaiMutation.isPending ? 'Menyimpan...' : 'Tandai Belum Selesai'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tandai Sebagai Belum Selesai?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Permohonan akan dikembalikan kepada status "Diluluskan", tarikh pemulangan
                    sebenar akan dikosongkan, dan peralatannya akan ditandakan semula sebagai
                    "Dipinjam". Gunakan jika permohonan ini tersilap ditandakan sebagai selesai.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => undoSelesaiMutation.mutate()}>
                    Ya, Tandai Belum Selesai
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showActions && (
            <KemaskiniDialog
              tarikhPinjaman={permohonan.tarikh_pinjaman}
              initialReturnDate={permohonan.tarikh_pemulangan_dijangka}
              initialTujuanId={permohonan.tujuan_id}
              initialTujuanLain={permohonan.tujuan_lain_teks}
              onUpdate={(patch) => kemaskiniMutation.mutateAsync(patch)}
            />
          )}
          {isAdmin && permohonan.status === 'menunggu_kelulusan' && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => batalMutation.mutate()}
              disabled={batalMutation.isPending}
            >
              <Ban className="size-4" />
              Batal
            </Button>
          )}
          {showDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                  <Trash2 className="size-4" />
                  Padam
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Padam Permohonan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak boleh dibatalkan. Semua rekod permohonan dan item berkaitan
                    akan dipadam secara kekal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => padamMutation.mutate()}
                  >
                    Ya, Padam
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="no-print print:hidden flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Cetak
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf}>
          <FileDown className="size-4" />
          Muat Turun PDF
        </Button>
        <Button variant="outline" onClick={handleDownloadDocx}>
          <FileText className="size-4" />
          Muat Turun Word
        </Button>
      </div>

      <div className="no-print print:hidden grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Butiran Permohonan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b py-1.5">
              <span className="text-muted-foreground">Nama Guru</span>
              <span className="font-medium">{permohonan.guru?.nama_guru ?? '-'}</span>
            </div>
            <div className="flex justify-between gap-4 border-b py-1.5">
              <span className="text-muted-foreground">Tarikh Pinjaman</span>
              <span className="font-medium">{formatDateStringLongKL(permohonan.tarikh_pinjaman)}</span>
            </div>
            <div className="flex justify-between gap-4 border-b py-1.5">
              <span className="text-muted-foreground">Tarikh Pemulangan (Dijangka)</span>
              <span className="font-medium">
                {formatDateStringLongKL(permohonan.tarikh_pemulangan_dijangka)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b py-1.5">
              <span className="text-muted-foreground">Tarikh Pemulangan (Sebenar)</span>
              <span className="font-medium">
                {permohonan.tarikh_pemulangan_sebenar
                  ? formatDateStringLongKL(permohonan.tarikh_pemulangan_sebenar)
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b py-1.5">
              <span className="text-muted-foreground">Tujuan Pinjaman</span>
              <span className="font-medium">{tujuanResolved}</span>
            </div>
            <div className="flex justify-between gap-4 border-b py-1.5">
              <span className="text-muted-foreground">Status</span>
              <StatusPermohonanBadge status={permohonan.status} />
            </div>
            {permohonan.catatan_admin && (
              <div className="flex justify-between gap-4 border-b py-1.5">
                <span className="text-muted-foreground">Catatan Pentadbir</span>
                <span className="font-medium">{permohonan.catatan_admin}</span>
              </div>
            )}
            {permohonan.diluluskan_pada && (
              <div className="flex justify-between gap-4 py-1.5">
                <span className="text-muted-foreground">Diluluskan Pada</span>
                <span className="font-medium">{toDateDisplayKL(permohonan.diluluskan_pada)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Senarai Peralatan ({items?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items && items.length > 0 ? (
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.peralatan.nama_peralatan ?? item.peralatan.nombor_siri}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.peralatan.kategori.nama_kategori} · {item.peralatan.jenama.nama_jenama} ·{' '}
                        {item.peralatan.nombor_siri}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.peralatan.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Tiada item.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden print:block">
        <PermohonanPrintView permohonan={permohonan} items={items ?? []} />
      </div>

      {items && (
        <ApprovePermohonanDialog
          open={approveOpen}
          onOpenChange={setApproveOpen}
          items={items}
          onApprove={(ids) => approveMutation.mutateAsync(ids)}
        />
      )}
    </div>
  )
}

