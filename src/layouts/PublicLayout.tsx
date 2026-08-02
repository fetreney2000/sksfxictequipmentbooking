import { Link, Outlet } from 'react-router-dom'
import { MonitorSmartphone } from 'lucide-react'
import { SEKOLAH_NAMA, SEKOLAH_SUBTITLE } from '@/lib/constants'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/30">
              <MonitorSmartphone className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight sm:text-base">{SEKOLAH_NAMA}</p>
              <p className="text-xs text-primary-foreground/80">{SEKOLAH_SUBTITLE}</p>
            </div>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-muted/40 py-4">
        <div className="mx-auto w-full max-w-5xl px-4 text-center text-xs text-muted-foreground">
          {SEKOLAH_NAMA} &middot; {SEKOLAH_SUBTITLE}
        </div>
      </footer>
    </div>
  )
}

