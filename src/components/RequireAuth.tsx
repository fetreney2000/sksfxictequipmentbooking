import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/lib/types'

export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

export function RequireRole({
  role,
  children,
}: {
  role: UserRole
  children: ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  if (user?.role !== role) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-lg font-semibold text-foreground">
          Anda tidak mempunyai kebenaran untuk mengakses halaman ini.
        </h1>
        <p className="text-sm text-muted-foreground">
          Hubungi pentadbir sistem jika anda fikir ini adalah satu kesilapan.
        </p>
        <Link to="/admin" className="text-sm font-medium text-primary underline">
          Kembali ke Papan Pemuka
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
