import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock3,
  Laptop,
  PackageCheck,
  AlertTriangle,
  ChevronRight,
  CalendarClock,
} from 'lucide-react'
import {
  fetchDashboardStats,
  fetchDueSoon,
  fetchRecentPending,
} from '@/lib/api/dashboard'
import {
  todayDateStringKL,
  formatDateStringKL,
  compareDateStringsKL,
} from '@/lib/datetime'
import { STATUS_PERMOHONAN_LABEL, STATUS_PERMOHONAN_VARIANT } from '@/lib/constants'

export function DashboardPage() {
  const today = todayDateStringKL()

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard', 'stats', today],
    queryFn: () => fetchDashboardStats(today),
  })

  const { data: dueSoon, isLoading: loadingDueSoon } = useQuery({
    queryKey: ['dashboard', 'due-soon', today],
    queryFn: () => fetchDueSoon(today),
  })

  const { data: recentPending, isLoading: loadingPending } = useQuery({
    queryKey: ['dashboard', 'recent-pending'],
    queryFn: fetchRecentPending,
  })

  const cards = [
    {
      title: 'Permohonan Menunggu Kelulusan',
      value: stats?.menunggu,
      icon: <Clock3 className="size-5" />,
      accent: 'bg-secondary text-secondary-foreground',
    },
    {
      title: 'Peralatan Sedang Dipinjam',
      value: stats?.dipinjam,
      icon: <Laptop className="size-5" />,
      accent: 'bg-primary text-primary-foreground',
    },
    {
      title: 'Peralatan Tersedia',
      value: stats?.tersedia,
      icon: <PackageCheck className="size-5" />,
      accent: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: 'Permohonan Lewat Dipulangkan',
      value: stats?.tertunggak,
      icon: <AlertTriangle className="size-5" />,
      accent: 'bg-destructive/10 text-destructive',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Papan Pemuka</h1>
        <p className="text-sm text-muted-foreground">Ringkasan pinjaman peralatan ICT hari ini.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className={`flex size-8 items-center justify-center rounded-lg ${card.accent}`}>
                  {card.icon}
                </span>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="size-4 text-primary" />
              Peralatan Perlu Dipulangkan Tidak Lama Lagi
            </CardTitle>
            <Link to="/admin/permohonan" className="text-xs font-medium text-primary hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            {loadingDueSoon ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : dueSoon && dueSoon.length > 0 ? (
              <ul className="divide-y">
                {dueSoon.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.guru?.nama_guru}</p>
                      <p className="text-xs text-muted-foreground">
                        Tarikh pemulangan: {formatDateStringKL(p.tarikh_pemulangan_dijangka)}
                        {compareDateStringsKL(p.tarikh_pemulangan_dijangka, today) === 0 && (
                          <span className="ml-1 font-semibold text-destructive">(Hari ini)</span>
                        )}
                      </p>
                    </div>
                    <Link
                      to={`/admin/permohonan/${p.id}`}
                      className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Buka <ChevronRight className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                Tiada peralatan perlu dipulangkan dalam tempoh 3 hari akan datang.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="size-4 text-primary" />
              Permohonan Terkini Menunggu Kelulusan
            </CardTitle>
            <Link to="/admin/permohonan" className="text-xs font-medium text-primary hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : recentPending && recentPending.length > 0 ? (
              <ul className="divide-y">
                {recentPending.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.guru?.nama_guru}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateStringKL(p.tarikh_pinjaman)} &middot; {p.item_count} peralatan
                      </p>
                    </div>
                    <Badge variant={STATUS_PERMOHONAN_VARIANT[p.status]}>
                      {STATUS_PERMOHONAN_LABEL[p.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                Tiada permohonan menunggu kelulusan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link to="/admin/laporan">Buka Laporan</Link>
        </Button>
      </div>
    </div>
  )
}

