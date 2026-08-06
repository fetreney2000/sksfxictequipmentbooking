import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  CheckCircle2,
  RefreshCcw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from '@/components/ui/alert-dialog'
import { fetchAllPeralatan } from '@/lib/api/master'
import { cn } from '@/lib/utils'
import type { PermohonanItemJoined, PeralatanRow } from '@/lib/types'

interface ApproveRow {
  item: PermohonanItemJoined
  approved: boolean
  replacement: PeralatanRow | null
}

function ReplacementPicker({
  open,
  onOpenChange,
  options,
  onSelect,
  takenIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PeralatanRow[]
  onSelect: (peralatan: PeralatanRow) => void
  takenIds: Set<string>
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = options.filter((p) => !takenIds.has(p.id))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.nombor_siri.toLowerCase().includes(q) ||
          (p.nama_peralatan ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [options, takenIds, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ganti Peralatan</DialogTitle>
          <DialogDescription>
            Pilih peralatan lain yang tersedia dalam kategori yang sama untuk
            menggantikan item ini.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-64">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Tiada peralatan tersedia dalam kategori ini untuk diganti.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p)
                      onOpenChange(false)
                      setSearch('')
                    }}
                    className="w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                  >
                    <p className="text-sm font-medium">
                      {p.nama_peralatan ?? p.nombor_siri}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nombor Siri: {p.nombor_siri}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function ApprovePermohonanDialog({
  open,
  onOpenChange,
  items,
  onApprove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: PermohonanItemJoined[]
  onApprove: (finalPeralatanIds: string[]) => Promise<void>
}) {
  const [rows, setRows] = useState<ApproveRow[]>(
    () => items.map((item) => ({ item, approved: true, replacement: null })),
  )
  const [pickerFor, setPickerFor] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: allPeralatan, isLoading: loadingPeralatan } = useQuery({
    queryKey: ['pinjam_peralatan', 'all'],
    queryFn: fetchAllPeralatan,
  })

  const tersedia = useMemo(
    () => (allPeralatan ?? []).filter((p) => p.status === 'tersedia'),
    [allPeralatan],
  )

  const pickerCategoryId =
    pickerFor !== null && rows[pickerFor]
      ? rows[pickerFor].item.peralatan.kategori_id
      : null

  /** Only available equipment of the same category as the item being replaced. */
  const pickerOptions = useMemo(
    () =>
      pickerCategoryId
        ? tersedia.filter((p) => p.kategori_id === pickerCategoryId)
        : [],
    [tersedia, pickerCategoryId],
  )

  const updateRow = (index: number, patch: Partial<ApproveRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const finalIds = useMemo(
    () =>
      rows
        .filter((r) => r.approved)
        .map((r) => r.replacement?.id ?? r.item.peralatan_id),
    [rows],
  )

  const approvedCount = rows.filter((r) => r.approved).length
  const canProceed = approvedCount > 0 && !saving

  const takenIds = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (r.approved) set.add(r.replacement?.id ?? r.item.peralatan_id)
    }
    return set
  }, [rows])

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onApprove(finalIds)
      setConfirming(false)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Luluskan Permohonan</DialogTitle>
            <DialogDescription>
              Pilih peralatan yang ingin diluluskan. Nyahtanda untuk mengecualikan
              item, atau gunakan "Ganti" untuk menukar kepada peralatan lain yang
              tersedia dalam kategori yang sama.
            </DialogDescription>
          </DialogHeader>

          {loadingPeralatan ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {rows.map((row, index) => {
                return (
                  <li
                    key={row.item.id}
                    className={cn(
                      'rounded-lg border bg-card px-3 py-2.5 transition-colors',
                      row.approved ? '' : 'opacity-60',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={row.approved}
                        onCheckedChange={(checked) =>
                          updateRow(index, { approved: checked === true })
                        }
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        {row.replacement ? (
                          <>
                            <p className="text-sm font-medium">
                              {row.replacement.nama_peralatan ?? row.replacement.nombor_siri}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Nombor Siri: {row.replacement.nombor_siri}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Original: {row.item.peralatan.kategori.nama_kategori} ·{' '}
                              {row.item.peralatan.jenama.nama_jenama} ·{' '}
                              {row.item.peralatan.nombor_siri}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">
                              {row.item.peralatan.nama_peralatan ??
                                row.item.peralatan.nombor_siri}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.item.peralatan.kategori.nama_kategori} ·{' '}
                              {row.item.peralatan.jenama.nama_jenama} · Nombor Siri:{' '}
                              {row.item.peralatan.nombor_siri}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {row.replacement && (
                          <Badge variant="secondary">Diganti</Badge>
                        )}
                        {row.approved && (
                          <div className="flex gap-1">
                             <Button
                               variant="outline"
                               size="sm"
                               className="min-h-11 sm:min-h-7"
                               onClick={() => setPickerFor(index)}
                            >
                              <ArrowLeftRight className="size-3.5" />
                              Ganti
                            </Button>
                            {row.replacement && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="min-h-11 sm:min-h-7"
                                 onClick={() => updateRow(index, { replacement: null })}
                              >
                                <RefreshCcw className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {approvedCount === 0
              ? 'Pilih sekurang-kurangnya satu peralatan untuk diluluskan.'
              : `Bilangan peralatan yang akan diluluskan: ${approvedCount}.`}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={!canProceed}>
              <CheckCircle2 className="size-4" />
              Luluskan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pickerFor !== null && rows[pickerFor] && (
        <ReplacementPicker
          open
          onOpenChange={(o) => !o && setPickerFor(null)}
          options={pickerOptions}
          takenIds={takenIds}
          onSelect={(peralatan) => {
            updateRow(pickerFor, { replacement: peralatan })
            setPickerFor(null)
          }}
        />
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Luluskan Permohonan Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {approvedCount} peralatan akan ditandakan sebagai dipinjam dan
              permohonan akan bertukar status kepada "Diluluskan".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={saving}>
              {saving ? 'Meluluskan...' : 'Ya, Luluskan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

