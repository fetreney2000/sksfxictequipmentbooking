import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  PackagePlus,
  Power,
  PackageX,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  fetchAllKategori,
  createKategori,
  updateKategori,
  deleteKategori,
  fetchAllJenama,
  createJenama,
  updateJenama,
  deleteJenama,
  fetchAllPeralatan,
  createPeralatan,
  updatePeralatan,
  deletePeralatan,
} from '@/lib/api/master'
import { StatusPeralatanBadge } from '@/components/StatusBadge'
import { STATUS_PERALATAN_LABEL } from '@/lib/constants'
import type { PeralatanStatus } from '@/lib/types'

/** Statuses an admin may set manually (dipinjam is driven by approvals only). */
const STATUS_SELECTABLE = (Object.entries(
  STATUS_PERALATAN_LABEL,
) as [PeralatanStatus, string][]).filter(([value]) => value !== 'dipinjam')

/* ------------------------------------------------------------------ */
/* Peralatan form dialog                                               */
/* ------------------------------------------------------------------ */

interface PeralatanFormState {
  kategori_id: string
  jenama_id: string
  nombor_siri: string
  nama_peralatan: string
  status: PeralatanStatus
}

const emptyPeralatanForm: PeralatanFormState = {
  kategori_id: '',
  jenama_id: '',
  nombor_siri: '',
  nama_peralatan: '',
  status: 'tersedia',
}

function PeralatanFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  kategoriList,
  jenamaList,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: PeralatanFormState | null
  onSave: (form: PeralatanFormState) => Promise<void>
  kategoriList: Awaited<ReturnType<typeof fetchAllKategori>>
  jenamaList: Awaited<ReturnType<typeof fetchAllJenama>>
  saving: boolean
}) {
  const [form, setForm] = useState<PeralatanFormState>(
    initial ?? emptyPeralatanForm,
  )

  const jenamaByKategori = useMemo(
    () => jenamaList.filter((j) => j.kategori_id === form.kategori_id),
    [jenamaList, form.kategori_id],
  )

  const setFormPartial = (patch: Partial<PeralatanFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (patch.kategori_id && patch.kategori_id !== prev.kategori_id) {
        next.jenama_id = ''
      }
      return next
    })
  }

  const canSave =
    form.kategori_id && form.jenama_id && form.nombor_siri.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return
    await onSave({
      ...form,
      nombor_siri: form.nombor_siri.trim(),
      nama_peralatan: form.nama_peralatan.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Sunting Peralatan' : 'Pendaftaran Peralatan Baharu'}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? 'Kemaskini maklumat peralatan ICT.'
              : 'Daftarkan peralatan ICT baharu ke dalam inventori.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={form.kategori_id}
              onValueChange={(v) => setFormPartial({ kategori_id: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                {kategoriList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama_kategori}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenama</Label>
            <Select
              value={form.jenama_id}
              onValueChange={(v) => setFormPartial({ jenama_id: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                {jenamaByKategori.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    Tiada jenama dalam kategori ini
                  </SelectItem>
                ) : (
                  jenamaByKategori.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nama_jenama}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombor-siri">Nombor Siri</Label>
            <Input
              id="nombor-siri"
              value={form.nombor_siri}
              onChange={(e) => setFormPartial({ nombor_siri: e.target.value })}
              
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama-peralatan">Nama Peralatan (Pilihan)</Label>
            <Input
              id="nama-peralatan"
              value={form.nama_peralatan}
              onChange={(e) => setFormPartial({ nama_peralatan: e.target.value })}
              
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setFormPartial({ status: v as PeralatanStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_SELECTABLE.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export function PeralatanPage() {
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'peralatan' | 'kategori' | 'jenama'>('peralatan')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'semua' | PeralatanStatus>('semua')

  const { data: kategoriList, isLoading: loadingKategori } = useQuery({
    queryKey: ['pinjam_kategori_peralatan'],
    queryFn: fetchAllKategori,
  })
  const { data: jenamaList, isLoading: loadingJenama } = useQuery({
    queryKey: ['pinjam_jenama'],
    queryFn: fetchAllJenama,
  })
  const { data: peralatanList, isLoading: loadingPeralatan } = useQuery({
    queryKey: ['pinjam_peralatan', 'all'],
    queryFn: fetchAllPeralatan,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pinjam_peralatan'] })
    queryClient.invalidateQueries({ queryKey: ['pinjam_jenama'] })
    queryClient.invalidateQueries({ queryKey: ['pinjam_kategori_peralatan'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  /* ---- Peralatan dialogs ---- */
  const [peralatanDialog, setPeralatanDialog] = useState<{
    open: boolean
    editId: string | null
    initial: PeralatanFormState | null
  }>({ open: false, editId: null, initial: null })

  const peralatanSaveMutation = useMutation({
    mutationFn: async (form: PeralatanFormState) => {
      const nama_peralatan = form.nama_peralatan.trim() || null
      if (peralatanDialog.editId) {
        await updatePeralatan(peralatanDialog.editId, {
          kategori_id: form.kategori_id,
          jenama_id: form.jenama_id,
          nombor_siri: form.nombor_siri,
          nama_peralatan,
          status: form.status,
        })
      } else {
        await createPeralatan({ ...form, nama_peralatan })
      }
    },
    onSuccess: () => {
      toast.success(
        peralatanDialog.editId
          ? 'Peralatan telah dikemas kini.'
          : 'Peralatan baharu telah didaftarkan.',
      )
      setPeralatanDialog({ open: false, editId: null, initial: null })
      invalidate()
    },
    onError: (err) => {
      toast.error(
        err instanceof Error && err.message.includes('duplicate')
          ? 'Nombor siri tersebut sudah wujud.'
          : 'Gagal menyimpan peralatan.',
      )
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PeralatanStatus }) =>
      updatePeralatan(id, { status }),
    onSuccess: () => {
      toast.success('Status peralatan telah dikemas kini.')
      invalidate()
    },
    onError: () => toast.error('Gagal mengemas kini status.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePeralatan(id),
    onSuccess: () => {
      toast.success('Peralatan telah dipadam.')
      invalidate()
    },
    onError: () =>
      toast.error(
        'Gagal memadam peralatan. Mungkin peralatan telah digunakan dalam permohonan.',
      ),
  })

  /* ---- Kategori dialogs ---- */
  const [kategoriOpen, setKategoriOpen] = useState(false)
  const [kategoriName, setKategoriName] = useState('')
  const [kategoriEdit, setKategoriEdit] = useState<{ id: string } | null>(null)

  const kategoriSaveMutation = useMutation({
    mutationFn: async () => {
      if (kategoriEdit) {
        await updateKategori(kategoriEdit.id, kategoriName.trim())
      } else {
        await createKategori(kategoriName.trim())
      }
    },
    onSuccess: () => {
      toast.success(kategoriEdit ? 'Kategori telah dikemas kini.' : 'Kategori baharu telah ditambah.')
      setKategoriOpen(false)
      setKategoriName('')
      setKategoriEdit(null)
      invalidate()
    },
    onError: () => toast.error('Gagal menyimpan kategori. Nama kategori mungkin sudah wujud.'),
  })

  const kategoriDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteKategori(id),
    onSuccess: () => {
      toast.success('Kategori telah dipadam.')
      invalidate()
    },
    onError: () =>
      toast.error('Gagal memadam kategori. Kategori mungkin masih digunakan.'),
  })

  /* ---- Jenama dialogs ---- */
  const [jenamaOpen, setJenamaOpen] = useState(false)
  const [jenamaForm, setJenamaForm] = useState({ kategori_id: '', nama_jenama: '' })
  const [jenamaEdit, setJenamaEdit] = useState<{ id: string } | null>(null)

  const jenamaSaveMutation = useMutation({
    mutationFn: async () => {
      if (jenamaEdit) {
        await updateJenama(jenamaEdit.id, jenamaForm.kategori_id, jenamaForm.nama_jenama.trim())
      } else {
        await createJenama(jenamaForm.kategori_id, jenamaForm.nama_jenama.trim())
      }
    },
    onSuccess: () => {
      toast.success(jenamaEdit ? 'Jenama telah dikemas kini.' : 'Jenama baharu telah ditambah.')
      setJenamaOpen(false)
      setJenamaForm({ kategori_id: '', nama_jenama: '' })
      setJenamaEdit(null)
      invalidate()
    },
    onError: () => toast.error('Gagal menyimpan jenama. Jenama mungkin sudah wujud dalam kategori ini.'),
  })

  const jenamaDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteJenama(id),
    onSuccess: () => {
      toast.success('Jenama telah dipadam.')
      invalidate()
    },
    onError: () => toast.error('Gagal memadam jenama. Jenama mungkin masih digunakan.'),
  })

  const filteredPeralatan = useMemo(() => {
    if (!peralatanList) return []
    let result = peralatanList
    if (statusFilter !== 'semua') {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.nombor_siri.toLowerCase().includes(q) ||
          (p.nama_peralatan ?? '').toLowerCase().includes(q) ||
          p.kategori?.nama_kategori.toLowerCase().includes(q) ||
          p.jenama?.nama_jenama.toLowerCase().includes(q),
      )
    }
    return result
  }, [peralatanList, statusFilter, search])

  const isLoading = loadingKategori || loadingJenama || loadingPeralatan

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Pengurusan Peralatan ICT</h1>
          <p className="text-sm text-muted-foreground">
            Inventori peralatan ICT sekolah â€” pendaftaran, kategori, jenama dan pelupusan.
          </p>
        </div>
        {tab === 'peralatan' && (
          <Button
            onClick={() => setPeralatanDialog({ open: true, editId: null, initial: null })}
          >
            <PackagePlus className="size-4" />
            Pendaftaran Baharu
          </Button>
        )}
        {tab === 'kategori' && (
          <Button
            onClick={() => {
              setKategoriEdit(null)
              setKategoriName('')
              setKategoriOpen(true)
            }}
          >
            <Plus className="size-4" />
            Tambah Kategori
          </Button>
        )}
        {tab === 'jenama' && (
          <Button
            onClick={() => {
              setJenamaEdit(null)
              setJenamaForm({ kategori_id: '', nama_jenama: '' })
              setJenamaOpen(true)
            }}
          >
            <Plus className="size-4" />
            Tambah Jenama
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="peralatan">Peralatan</TabsTrigger>
          <TabsTrigger value="kategori">Kategori</TabsTrigger>
          <TabsTrigger value="jenama">Jenama</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ---------------- Peralatan tab ---------------- */}
      {tab === 'peralatan' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                {Object.entries(STATUS_PERALATAN_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-card">
            {isLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : filteredPeralatan.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Tiada peralatan ditemui.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombor Siri</TableHead>
                    <TableHead>Nama Peralatan</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jenama</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeralatan.map((peralatan) => {
                    const isBorrowed = peralatan.status === 'dipinjam'
                    const isRetired = peralatan.status === 'tidak_aktif'
                    return (
                      <TableRow key={peralatan.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {peralatan.nombor_siri}
                        </TableCell>
                        <TableCell>{peralatan.nama_peralatan ?? '-'}</TableCell>
                        <TableCell>{peralatan.kategori?.nama_kategori ?? '-'}</TableCell>
                        <TableCell>{peralatan.jenama?.nama_jenama ?? '-'}</TableCell>
                        <TableCell>
                          <StatusPeralatanBadge status={peralatan.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPeralatanDialog({
                                  open: true,
                                  editId: peralatan.id,
                                  initial: {
                                    kategori_id: peralatan.kategori_id,
                                    jenama_id: peralatan.jenama_id,
                                    nombor_siri: peralatan.nombor_siri,
                                    nama_peralatan: peralatan.nama_peralatan ?? '',
                                    status: peralatan.status,
                                  },
                                })
                              }
                            >
                              <Pencil className="size-3.5" />
                              Sunting
                            </Button>
                            {isRetired ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  statusMutation.mutate({ id: peralatan.id, status: 'tersedia' })
                                }
                              >
                                <Power className="size-3.5" />
                                Aktifkan
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isBorrowed}
                                    className={isBorrowed ? '' : 'text-destructive'}
                                    title={
                                      isBorrowed
                                        ? 'Peralatan sedang dipinjam'
                                        : 'Lupus peralatan'
                                    }
                                  >
                                    <PackageX className="size-3.5" />
                                    Lupus
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Lupus Peralatan?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Peralatan "{peralatan.nama_peralatan ?? peralatan.nombor_siri}"
                                      ({peralatan.nombor_siri}) akan ditandakan sebagai{" "}
                                      {STATUS_PERALATAN_LABEL.tidak_aktif} dan tidak akan dipaparkan
                                      kepada guru untuk pinjaman. Anda boleh mengaktifkannya semula pada
                                      bila-bila masa.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                      onClick={() =>
                                        statusMutation.mutate({ id: peralatan.id, status: 'tidak_aktif' })
                                      }
                                    >
                                      Ya, Lupus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  <Trash2 className="size-3.5" />
                                  Padam
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Padam Peralatan?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Rekod peralatan "{peralatan.nama_peralatan ?? peralatan.nombor_siri}"
                                    akan dipadam secara kekal. Tindakan ini tidak boleh dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                    onClick={() => deleteMutation.mutate(peralatan.id)}
                                  >
                                    Ya, Padam
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {/* ---------------- Kategori tab ---------------- */}
      {tab === 'kategori' && (
        <div className="rounded-lg border bg-card">
          {loadingKategori ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : !kategoriList || kategoriList.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Tiada kategori. Sila tambah kategori baharu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kategoriList.map((kategori) => (
                  <TableRow key={kategori.id}>
                    <TableCell className="font-medium">{kategori.nama_kategori}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setKategoriEdit({ id: kategori.id })
                            setKategoriName(kategori.nama_kategori)
                            setKategoriOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Sunting
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="size-3.5" />
                              Padam
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Padam Kategori?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Kategori "{kategori.nama_kategori}" akan dipadam. Kategori yang masih
                                digunakan tidak boleh dipadam.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => kategoriDeleteMutation.mutate(kategori.id)}
                              >
                                Ya, Padam
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ---------------- Jenama tab ---------------- */}
      {tab === 'jenama' && (
        <div className="rounded-lg border bg-card">
          {loadingJenama ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : !jenamaList || jenamaList.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Tiada jenama. Sila tambah jenama baharu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Jenama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jenamaList.map((jenama) => (
                  <TableRow key={jenama.id}>
                    <TableCell className="font-medium">{jenama.nama_jenama}</TableCell>
                    <TableCell>{jenama.kategori?.nama_kategori ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setJenamaEdit({ id: jenama.id })
                            setJenamaForm({
                              kategori_id: jenama.kategori_id,
                              nama_jenama: jenama.nama_jenama,
                            })
                            setJenamaOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Sunting
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="size-3.5" />
                              Padam
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Padam Jenama?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Jenama "{jenama.nama_jenama}" akan dipadam. Jenama yang masih
                                digunakan tidak boleh dipadam.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => jenamaDeleteMutation.mutate(jenama.id)}
                              >
                                Ya, Padam
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Peralatan form dialog */}
      {peralatanDialog.open && (
        <PeralatanFormDialog
          open={peralatanDialog.open}
          onOpenChange={(o) => !o && setPeralatanDialog({ open: false, editId: null, initial: null })}
          initial={peralatanDialog.initial}
          onSave={(form) => peralatanSaveMutation.mutateAsync(form)}
          kategoriList={kategoriList ?? []}
          jenamaList={jenamaList ?? []}
          saving={peralatanSaveMutation.isPending}
        />
      )}

      {/* Kategori form dialog */}
      <Dialog open={kategoriOpen} onOpenChange={setKategoriOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{kategoriEdit ? 'Sunting Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>
              {kategoriEdit
                ? 'Kemaskini nama kategori peralatan.'
                : 'Tambahkan kategori peralatan baharu (cth. Laptop, Projektor).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nama-kategori">Nama Kategori</Label>
            <Input
              id="nama-kategori"
              value={kategoriName}
              onChange={(e) => setKategoriName(e.target.value)}
              
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKategoriOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => kategoriSaveMutation.mutate()}
              disabled={!kategoriName.trim() || kategoriSaveMutation.isPending}
            >
              {kategoriSaveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jenama form dialog */}
      <Dialog open={jenamaOpen} onOpenChange={setJenamaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{jenamaEdit ? 'Sunting Jenama' : 'Tambah Jenama'}</DialogTitle>
            <DialogDescription>
              {jenamaEdit
                ? 'Kemaskini nama jenama dan kategorinya.'
                : 'Tambahkan jenama peralatan (cth. Dell, Epson).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={jenamaForm.kategori_id}
                onValueChange={(v) => setJenamaForm({ ...jenamaForm, kategori_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue  />
                </SelectTrigger>
                <SelectContent>
                  {(kategoriList ?? []).map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama_kategori}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama-jenama">Nama Jenama</Label>
              <Input
                id="nama-jenama"
                value={jenamaForm.nama_jenama}
                onChange={(e) => setJenamaForm({ ...jenamaForm, nama_jenama: e.target.value })}
                
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJenamaOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => jenamaSaveMutation.mutate()}
              disabled={!jenamaForm.kategori_id || !jenamaForm.nama_jenama.trim() || jenamaSaveMutation.isPending}
            >
              {jenamaSaveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

