import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyPasswordForUser, updateProfile } from '@/lib/api/users'
import { useAuth } from '@/hooks/useAuth'

export function ProfilPage() {
  const { user, updateUser } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sesi telah tamat.')
      const verified = await verifyPasswordForUser(user.id, currentPassword)
      if (!verified) throw new Error('Kata laluan semasa tidak sah.')
      await updateProfile(user.id, {
        username: username.trim() || undefined,
        full_name: fullName.trim() || undefined,
        newPassword: newPassword || undefined,
      })
      updateUser({
        username: username.trim(),
        full_name: fullName.trim(),
      })
    },
    onSuccess: () => {
      toast.success('Profil telah dikemas kini.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal mengemas kini profil.'),
  })

  const passwordMismatch = newPassword !== confirmPassword
  const canSubmit =
    Boolean(currentPassword) &&
    !passwordMismatch &&
    (username.trim() !== user?.username ||
      fullName.trim() !== user?.full_name ||
      Boolean(newPassword))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || profileMutation.isPending) return
    profileMutation.mutate()
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-5">
        <h1 className="text-xl font-bold">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Kemaskini maklumat akaun dan kata laluan anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maklumat Akaun</CardTitle>
          <CardDescription>
            Kata laluan semasa diperlukan untuk menyimpan sebarang perubahan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profil-username">Username</Label>
              <Input
                id="profil-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profil-fullname">Nama Penuh</Label>
              <Input
                id="profil-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="border-t pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="profil-current">Kata Laluan Semasa</Label>
                <Input
                  id="profil-current"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profil-new">Kata Laluan Baharu (Pilihan)</Label>
              <Input
                id="profil-new"
                type="password"
                autoComplete="new-password"
                
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-destructive">
                  Kata laluan mestilah sekurang-kurangnya 6 aksara.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profil-confirm">Sahkan Kata Laluan Baharu</Label>
              <Input
                id="profil-confirm"
                type="password"
                autoComplete="new-password"
                
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {passwordMismatch && (
                <p className="text-xs text-destructive">Kata laluan baharu tidak sepadan.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || profileMutation.isPending}
            >
              {profileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


