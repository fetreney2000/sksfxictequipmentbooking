import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, PackageOpen, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useWizardStore, type WizardItem } from '@/store/wizard'
import {
  fetchKategori,
  fetchJenamaByKategori,
  fetchTersediaPeralatanByJenama,
} from '@/lib/api/permohonan'

export function Step2Peralatan() {
  const items = useWizardStore((s) => s.items)
  const addItem = useWizardStore((s) => s.addItem)
  const removeItem = useWizardStore((s) => s.removeItem)

  const [kategoriId, setKategoriId] = useState<string | null>(null)
  const [jenamaId, setJenamaId] = useState<string | null>(null)

  const { data: kategoriList, isLoading: loadingKategori } = useQuery({
    queryKey: ['pinjam_kategori_peralatan'],
    queryFn: fetchKategori,
  })

  const { data: jenamaList, isLoading: loadingJenama } = useQuery({
    queryKey: ['pinjam_jenama', kategoriId],
    queryFn: () => fetchJenamaByKategori(kategoriId as string),
    enabled: Boolean(kategoriId),
  })

  const { data: peralatanList, isLoading: loadingPeralatan } = useQuery({
    queryKey: ['pinjam_peralatan', jenamaId],
    queryFn: () => fetchTersediaPeralatanByJenama(jenamaId as string),
    enabled: Boolean(jenamaId),
  })

  const selectedIds = new Set(items.map((i) => i.peralatan_id))

  const toggleItem = (p: WizardItem) => {
    if (selectedIds.has(p.peralatan_id)) {
      removeItem(p.peralatan_id)
    } else {
      addItem(p)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Langkah 2: Pilih Peralatan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih kategori, kemudian jenama dan akhirnya unit peralatan yang tersedia.
          Anda boleh memilih lebih daripada satu peralatan.
        </p>
      </div>

      {/* Category grid */}
      {!kategoriId && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Pilih Kategori</h3>
          {loadingKategori ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : kategoriList && kategoriList.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {kategoriList.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKategoriId(k.id)}
                  className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <p className="font-semibold">{k.nama_kategori}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Klik untuk pilih jenama</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Tiada kategori peralatan pada masa ini.
            </p>
          )}
        </div>
      )}

      {/* Brand list */}
      {kategoriId && !jenamaId && (
        <div>
          <button
            type="button"
            onClick={() => setKategoriId(null)}
            className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:min-h-0"
          >
            <ArrowLeft className="size-4" /> Kembali ke Kategori
          </button>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Pilih Jenama
            {kategoriList?.find((k) => k.id === kategoriId) && (
              <span className="font-semibold text-foreground">
                {' '}
                — {kategoriList.find((k) => k.id === kategoriId)?.nama_kategori}
              </span>
            )}
          </h3>
          {loadingJenama ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : jenamaList && jenamaList.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {jenamaList.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => setJenamaId(j.id)}
                  className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <p className="font-semibold">{j.nama_jenama}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Klik untuk lihat peralatan</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Tiada jenama dalam kategori ini buat masa ini.
            </p>
          )}
        </div>
      )}

      {/* Equipment units */}
      {jenamaId && (
        <div>
          <button
            type="button"
            onClick={() => setJenamaId(null)}
            className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:min-h-0"
          >
            <ArrowLeft className="size-4" /> Kembali ke Jenama
          </button>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Pilih Peralatan
            <span className="font-semibold text-foreground">
              {' '}
              — {jenamaList?.find((j) => j.id === jenamaId)?.nama_jenama}
            </span>
          </h3>
          {loadingPeralatan ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : peralatanList && peralatanList.length > 0 ? (
            <div className="space-y-2">
              {peralatanList.map((p) => {
                const checked = selectedIds.has(p.id)
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors',
                      checked ? 'border-primary/60 bg-accent' : 'hover:bg-muted/40',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        toggleItem({
                          peralatan_id: p.id,
                          nombor_siri: p.nombor_siri,
                          nama_peralatan: p.nama_peralatan,
                          jenama_id: p.jenama_id,
                          nama_jenama: jenamaList?.find((j) => j.id === p.jenama_id)?.nama_jenama ?? '',
                          kategori_id: p.kategori_id,
                          nama_kategori:
                            kategoriList?.find((k) => k.id === p.kategori_id)?.nama_kategori ?? '',
                        })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.nama_peralatan ?? p.nombor_siri}
                      </p>
                      <p className="text-xs text-muted-foreground">Nombor Siri: {p.nombor_siri}</p>
                    </div>
                    {checked && (
                      <Badge variant="secondary">
                        <Check className="size-3" /> Dipilih
                      </Badge>
                    )}
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-8 text-center">
              <PackageOpen className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tiada peralatan tersedia dalam kategori ini buat masa ini.
              </p>
              <button
                type="button"
                onClick={() => setJenamaId(null)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Pilih jenama lain
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected equipment panel */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Peralatan Dipilih ({items.length})</h3>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => items.forEach((i) => removeItem(i.peralatan_id))}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Kosongkan
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada peralatan dipilih. Sila pilih sekurang-kurangnya satu peralatan.
          </p>
        ) : (
          <ScrollArea className="max-h-56">
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.peralatan_id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.nama_kategori} — {item.nama_jenama}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.nama_peralatan ?? ''} {item.nama_peralatan ? '· ' : ''}
                      Nombor Siri: {item.nombor_siri}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.peralatan_id)}
                     className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:size-6"
                    aria-label={`Buang ${item.nombor_siri}`}
                  >
                    <span className="text-sm font-bold">X</span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
