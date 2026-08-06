import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  UserCog,
  UserCircle,
  LogOut,
  MonitorSmartphone,
  Package,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { SEKOLAH_NAMA, SEKOLAH_SUBTITLE, ROLE_LABEL } from '@/lib/constants'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Papan Pemuka', icon: <LayoutDashboard className="size-5" /> },
  { to: '/admin/permohonan', label: 'Permohonan', icon: <ClipboardList className="size-5" /> },
  { to: '/admin/peralatan', label: 'Peralatan', icon: <Package className="size-5" />, adminOnly: true },
  { to: '/admin/laporan', label: 'Laporan', icon: <BarChart3 className="size-5" /> },
  { to: '/admin/guru', label: 'Guru', icon: <Users className="size-5" />, adminOnly: true },
  { to: '/admin/pengguna', label: 'Pengguna', icon: <UserCog className="size-5" />, adminOnly: true },
  { to: '/admin/profil', label: 'Profil', icon: <UserCircle className="size-5" /> },
]

function MobileBottomNav({ items }: { items: NavItem[] }) {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const primaryPaths = new Set(['/admin', '/admin/permohonan', '/admin/laporan', '/admin/profil'])
  const primaryItems = items.filter((item) => primaryPaths.has(item.to))
  const moreItems = items.filter((item) => !primaryPaths.has(item.to))

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 shadow-[0_-8px_24px_rgb(16_24_40_/_0.06)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        {moreItems.length > 0 && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Buka menu pentadbiran lain"
                aria-expanded={moreOpen}
                className={cn(
                  'flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors',
                  moreItems.some((item) => location.pathname.startsWith(item.to))
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <MoreHorizontal className="size-5" />
                <span>Lain-lain</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <SheetHeader>
                <SheetTitle>Menu Pentadbiran</SheetTitle>
                <SheetDescription>Akses halaman pengurusan tambahan.</SheetDescription>
              </SheetHeader>
              <nav className="grid gap-2 px-4 pb-2">
                {moreItems.map((item) => (
                  <SheetClose key={item.to} asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  )
}

function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar md:flex">
      <div className="flex items-center gap-3 border-b px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <MonitorSmartphone className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{SEKOLAH_NAMA}</p>
          <p className="text-xs text-muted-foreground">{SEKOLAH_SUBTITLE}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export function AdminLayout() {
  const isMobile = useIsMobile()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && <Sidebar items={visibleItems} />}

      <div className={cn('flex min-h-screen flex-col', !isMobile && 'md:pl-60')}>
        <header className="no-print sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-2">
              {isMobile && (
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <MonitorSmartphone className="size-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{SEKOLAH_NAMA}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.full_name} &middot; {user ? ROLE_LABEL[user.role] : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/pinjam"
                title="Permohonan Pinjaman Peralatan ICT"
                aria-label="Buka borang permohonan pinjaman"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:min-h-9"
              >
                <ExternalLink className="size-4" />
                <span className="hidden sm:inline">Permohonan Pinjaman</span>
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                aria-label="Log keluar"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:min-h-9"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Log Keluar</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-7 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:py-9 md:pb-9">
          <Outlet />
        </main>
      </div>

      {isMobile && <MobileBottomNav items={visibleItems} />}
    </div>
  )
}

