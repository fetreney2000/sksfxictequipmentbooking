import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Eye,
  Search,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPermohonanBadge } from '@/components/StatusBadge'
import { fetchPermohonanList } from '@/lib/api/permohonan'
import { formatDateStringKL, shortReference } from '@/lib/datetime'
import type { PermohonanJoined, PermohonanStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const FILTER_TABS: { value: PermohonanStatus | 'semua'; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu_kelulusan', label: 'Menunggu Kelulusan' },
  { value: 'diluluskan', label: 'Diluluskan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

export function PermohonanPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<PermohonanStatus | 'semua'>('semua')
  const [search, setSearch] = useState('')

  const { data: rows, isLoading } = useQuery({
    queryKey: ['pinjam_permohonan'],
    queryFn: fetchPermohonanList,
  })

  const columns = useMemo<ColumnDef<PermohonanJoined>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Rujukan',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{shortReference(row.original.id)}</span>
        ),
      },
      {
        accessorKey: 'guru.nama_guru',
        header: 'Nama Guru',
        cell: ({ row }) => row.original.guru?.nama_guru ?? '-',
      },
      {
        accessorKey: 'tarikh_pinjaman',
        header: 'Tarikh Pinjaman',
        cell: ({ row }) => formatDateStringKL(row.original.tarikh_pinjaman),
      },
      {
        accessorKey: 'tarikh_pemulangan_dijangka',
        header: 'Tarikh Pemulangan (Dijangka)',
        cell: ({ row }) => formatDateStringKL(row.original.tarikh_pemulangan_dijangka),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusPermohonanBadge status={row.original.status} />,
      },
      {
        accessorKey: 'item_count',
        header: 'Bil. Peralatan',
        cell: ({ row }) => row.original.item_count ?? 0,
      },
      {
        id: 'tindakan',
        header: 'Tindakan',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/permohonan/${row.original.id}`)}
          >
            <Eye className="size-3.5" />
            Lihat
          </Button>
        ),
      },
    ],
    [navigate],
  )

  const filteredData = useMemo(() => {
    if (!rows) return []
    let result = rows
    if (statusFilter !== 'semua') {
      result = result.filter((r) => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((r) => r.guru?.nama_guru?.toLowerCase().includes(q))
    }
    return result
  }, [rows, statusFilter, search])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Pengurusan Permohonan</h1>
          <p className="text-sm text-muted-foreground">
            Kelulusan, pemulangan dan pengurusan permohonan pinjaman.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as PermohonanStatus | 'semua')}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 sm:flex sm:w-auto">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="min-h-10 sm:min-h-0">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama guru"
            className="w-full pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Tiada permohonan ditemui.
          </div>
        ) : (
          <>
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : (
                            <button
                              className={cn(
                                'inline-flex items-center gap-1 font-medium',
                                header.column.getCanSort() && 'cursor-pointer select-none',
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() &&
                                (header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp className="size-3.5" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                                ))}
                            </button>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/permohonan/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-3 sm:hidden">
              {table.getRowModel().rows.map((row) => {
                const request = row.original
                return (
                  <article
                    key={row.id}
                    className="rounded-xl border bg-background p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-primary">
                          {shortReference(request.id)}
                        </p>
                        <h2 className="mt-1 truncate text-sm font-semibold">
                          {request.guru?.nama_guru ?? '-'}
                        </h2>
                      </div>
                      <StatusPermohonanBadge status={request.status} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Tarikh pinjaman</dt>
                        <dd className="mt-0.5 font-medium">{formatDateStringKL(request.tarikh_pinjaman)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Tarikh pulangan</dt>
                        <dd className="mt-0.5 font-medium">
                          {formatDateStringKL(request.tarikh_pemulangan_dijangka)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Peralatan</dt>
                        <dd className="mt-0.5 font-medium">{request.item_count ?? 0} unit</dd>
                      </div>
                    </dl>
                    <Button
                      variant="outline"
                      className="mt-4 min-h-11 w-full"
                      onClick={() => navigate(`/admin/permohonan/${request.id}`)}
                    >
                      <Eye className="size-4" />
                      Lihat permohonan
                    </Button>
                  </article>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Muka {table.getState().pagination.pageIndex + 1} daripada{' '}
                {Math.max(1, table.getPageCount())}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 sm:min-h-7"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-4" />
                  Sebelum
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 sm:min-h-7"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Seterusnya
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

