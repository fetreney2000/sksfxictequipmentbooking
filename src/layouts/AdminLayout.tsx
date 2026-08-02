import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { SEKOLAH_NAMA, SEKOLAH_SUBTITLE, ROLE_LABEL } from '@/lib/constants'

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
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card md:flex">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MonitorSmartphone className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{SEKOLAH_NAMA}</p>
          <p className="text-xs text-muted-foreground">{SEKOLAH_SUBTITLE}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
          <div className="flex h-14 items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-2">
              {isMobile && (
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {isMobile && <MobileBottomNav items={visibleItems} />}
    </div>
  )
}

