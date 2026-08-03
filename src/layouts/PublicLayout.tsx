import { Link, Outlet } from 'react-router-dom'
import { MonitorSmartphone } from 'lucide-react'
import { SEKOLAH_NAMA, SEKOLAH_SUBTITLE } from '@/lib/constants'

export function PublicLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_60%)]" />
      <header className="relative border-b bg-card/85 text-foreground shadow-xs backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MonitorSmartphone className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight sm:text-base">{SEKOLAH_NAMA}</p>
              <p className="text-xs text-muted-foreground">{SEKOLAH_SUBTITLE}</p>
            </div>
          </Link>
        </div>
      </header>
       <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t bg-card/60 py-5">
        <div className="mx-auto w-full max-w-5xl px-4 text-center text-xs text-muted-foreground">
          {SEKOLAH_NAMA} &middot; {SEKOLAH_SUBTITLE}
        </div>
      </footer>
    </div>
  )
}

