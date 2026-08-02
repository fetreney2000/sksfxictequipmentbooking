import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, FileSpreadsheet, Pencil, Trash2, UploadCloud, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  fetchAllGuru,
  createGuru,
  updateGuru,
  deleteGuru,
  upsertGuruNames,
} from '@/lib/api/master'
import {
  parseGuruWorkbook,
  SHEET_NAMA_GURU,
  GURU_IMPORT_COLUMN,
  type GuruImportResult,
} from '@/lib/import-guru'

export function GuruPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')

  const [editTarget, setEditTarget] = useState<{ id: string; nama_guru: string } | null>(null)
  const [editName, setEditName] = useState('')

  const [importStep, setImportStep] = useState<'info' | 'result' | null>(null)
  const [importResult, setImportResult] = useState<GuruImportResult | null>(null)
  const [importing, setImporting] = useState(false)

  const { data: rows, isLoading } = useQuery({
    queryKey: ['pinjam_guru'],
    queryFn: fetchAllGuru,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pinjam_guru'] })
    queryClient.invalidateQueries({ queryKey: ['pinjam_guru', 'active'] })
  }

  const addMutation = useMutation({
    mutationFn: () => createGuru(addName.trim()),
    onSuccess: () => {
      toast.success('Guru baru telah ditambah.')
      setAddOpen(false)
      setAddName('')
      invalidate()
    },
    onError: (err) =>
      toast.error(err instanceof Error && err.message.includes('duplicate')
        ? 'Nama guru tersebut sudah wujud.'
        : 'Gagal menambah guru.'),
  })

  const editMutation = useMutation({
    mutationFn: () => updateGuru(editTarget?.id ?? '', { nama_guru: editName.trim() }),
    onSuccess: () => {
      toast.success('Maklumat guru telah dikemas kini.')
      setEditTarget(null)
      invalidate()
    },
    onError: () => toast.error('Gagal mengemas kini guru.'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateGuru(id, { is_active }),
    onSuccess: () => {
      toast.success('Status guru telah dikemas kini.')
      invalidate()
    },
    onError: () => toast.error('Gagal mengemas kini status.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGuru(id),
    onSuccess: () => {
      toast.success('Guru telah dipadam.')
      invalidate()
    },
    onError: () => toast.error('Gagal memadam guru. Mungkin nama guru telah digunakan dalam permohonan.'),
  })

  const filtered = useMemo(() => {
    if (!rows) return []
    if (!search.trim()) return rows
    return rows.filter((g) => g.nama_guru.toLowerCase().includes(search.trim().toLowerCase()))
  }, [rows, search])

  const handleFileSelect = async (file: File | null) => {
    if (!file) return
    setImporting(true)
    try {
      const parsed = await parseGuruWorkbook(file)
      if (!parsed.sheetFound) {
        setImportResult({
          sheetFound: false,
          totalNames: 0,
          uniqueNames: 0,
          added: 0,
          duplicates: 0,
          errors: parsed.errors,
        })
        setImportStep('result')
        return
      }
      const result = await upsertGuruNames(parsed.names)
      setImportResult({
        sheetFound: true,
        totalNames: parsed.names.length,
        uniqueNames: parsed.names.length,
        added: result.added,
        duplicates: result.duplicates,
        errors: [],
      })
      setImportStep('result')
      invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membaca fail.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Pengurusan Nama Guru</h1>
          <p className="text-sm text-muted-foreground">
            Senarai nama guru yang boleh memilih nama dalam borang permohonan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportStep('info')}>
            <FileSpreadsheet className="size-4" />
            Import Senarai Guru
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Tambah Guru
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:max-w-60">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8"
        />
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Tiada guru ditemui.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Guru</TableHead>
                <TableHead>Status Aktif</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guru) => (
                <TableRow key={guru.id}>
                  <TableCell className="font-medium">{guru.nama_guru}</TableCell>
                  <TableCell>
                    <Badge variant={guru.is_active ? 'default' : 'outline'}>
                      {guru.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditTarget({ id: guru.id, nama_guru: guru.nama_guru })
                          setEditName(guru.nama_guru)
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Sunting
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: guru.id, is_active: !guru.is_active })
                        }
                      >
                        {guru.is_active ? 'Nyahaktifkan' : 'Aktifkan'}
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
                            <AlertDialogTitle>Padam Guru?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Nama "{guru.nama_guru}" akan dipadam secara kekal. Tindakan ini tidak
                              boleh dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(guru.id)}
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

      {/* Add guru dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Guru</DialogTitle>
            <DialogDescription>
              Masukkan nama penuh guru seperti yang dikehendaki pada borang permohonan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nama-guru">Nama Guru</Label>
            <Input
              id="nama-guru"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!addName.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit guru dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sunting Guru</DialogTitle>
            <DialogDescription>Kemaskini nama guru.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-nama-guru">Nama Guru</Label>
            <Input
              id="edit-nama-guru"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Batal
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={!editName.trim() || editMutation.isPending}
            >
              {editMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import info dialog */}
      <Dialog open={importStep === 'info'} onOpenChange={(o) => !o && setImportStep(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Senarai Guru</DialogTitle>
            <DialogDescription>
              Fahami keperluan fail sebelum memuat naik.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Proses ini akan menambah nama guru daripada fail Excel ke dalam sistem.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>
                Fail mestilah format Excel (<span className="font-mono">.xlsx</span>).
              </li>
              <li>
                Fail mesti mengandungi helaian (sheet) bernama{' '}
                <span className="font-mono font-semibold text-foreground">"{SHEET_NAMA_GURU}"</span>{' '}
                (huruf besar/kecil tidak penting).
              </li>
              <li>
                Nama guru mesti disenaraikan dalam kolum{' '}
                <span className="font-mono font-semibold text-foreground">B</span> ({GURU_IMPORT_COLUMN}),
                satu nama setiap baris. Jika kolum B kosong, sistem akan cuba membaca
                kolum A.
              </li>
              <li>
                Baris pertama akan diabaikan hanya jika ia adalah tajuk (cth. "Nama"
                atau "Nama Guru"). Jika tiada baris tajuk, semua nama akan dibaca.
              </li>
              <li>
                Nama yang sudah wujud dalam sistem akan disenaraikan sebagai "duplikat"
                dan diabaikan.
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportStep(null)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setImportStep(null)
                fileInputRef.current?.click()
              }}
              disabled={importing}
            >
              <UploadCloud className="size-4" />
              Faham, Pilih Fail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import result dialog */}
      <Dialog open={importStep === 'result'} onOpenChange={(o) => !o && setImportStep(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hasil Import</DialogTitle>
          </DialogHeader>
          {importResult && !importResult.sheetFound && (
            <div className="space-y-2">
              {importResult.errors.map((e, i) => (
                <p key={i} className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {e}
                </p>
              ))}
            </div>
          )}
          {importResult && importResult.sheetFound && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Nama Dibaca</p>
                  <p className="text-xl font-bold">{importResult.uniqueNames}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Duplikat Diabaikan</p>
                  <p className="text-xl font-bold">{importResult.duplicates}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Guru Baru Ditambah</p>
                  <p className="text-2xl font-bold text-primary">{importResult.added}</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive">
                      {e}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setImportStep(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />
    </div>
  )
}

