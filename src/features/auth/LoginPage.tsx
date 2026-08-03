import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SEKOLAH_NAMA, SEKOLAH_SUBTITLE } from '@/lib/constants'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={from ?? '/admin'} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate(from ?? '/admin', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Nama pengguna atau kata laluan tidak sah.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_48%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Lock className="size-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{SEKOLAH_NAMA}</h1>
          <p className="text-sm text-muted-foreground">{SEKOLAH_SUBTITLE}</p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            Supabase belum dikonfigurasikan. Sila tetapkan VITE_SUPABASE_URL dan
            VITE_SUPABASE_ANON_KEY dalam fail .env.
          </div>
        )}

         <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Log Masuk Pentadbir</CardTitle>
            <CardDescription>Masukkan nama pengguna dan kata laluan anda.</CardDescription>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username">Nama Pengguna</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    autoComplete="username"
                    className="pl-8"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Laluan</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="pl-8"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !isSupabaseConfigured()}>
                {loading ? 'Sedang disahkan...' : 'Log Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <a href="/pinjam" className="font-medium text-primary hover:underline">
            Kembali ke borang permohonan pinjaman
          </a>
        </p>
      </div>
    </div>
  )
}
