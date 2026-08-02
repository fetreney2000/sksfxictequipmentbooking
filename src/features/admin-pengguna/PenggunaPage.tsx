import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { fetchAllUsers, createUser, updateUser, deleteUser, type SafeUser } from '@/lib/api/users'
import { useAuthStore } from '@/store/auth'
import { ROLE_LABEL } from '@/lib/constants'
import type { UserRole } from '@/lib/types'

export function PenggunaPage() {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const { data: rows, isLoading } = useQuery({
    queryKey: ['pinjam_users'],
    queryFn: fetchAllUsers,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['pinjam_users'] })

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'admin' as UserRole,
  })

  const [editTarget, setEditTarget] = useState<{ id: string } | null>(null)
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    role: 'admin' as UserRole,
    is_active: true,
    password: '',
  })

  const addMutation = useMutation({
    mutationFn: () =>
      createUser({
        username: addForm.username,
        full_name: addForm.full_name,
        password: addForm.password,
        role: addForm.role,
      }),
    onSuccess: () => {
      toast.success('Pengguna baru telah ditambah.')
      setAddOpen(false)
      setAddForm({ username: '', full_name: '', password: '', role: 'admin' })
      invalidate()
    },
    onError: (err) =>
      toast.error(
        err instanceof Error && err.message.includes('duplicate')
          ? 'Nama pengguna tersebut sudah wujud.'
          : 'Gagal menambah pengguna.',
      ),
  })

  const editMutation = useMutation({
    mutationFn: () =>
      updateUser(editTarget?.id ?? '', {
        username: editForm.username,
        full_name: editForm.full_name,
        role: editForm.role,
        is_active: editForm.is_active,
        password: editForm.password || undefined,
      }),
    onSuccess: () => {
      toast.success('Maklumat pengguna telah dikemas kini.')
      setEditTarget(null)
      invalidate()
    },
    onError: (err) =>
      toast.error(
        err instanceof Error && err.message.includes('duplicate')
          ? 'Nama pengguna tersebut sudah wujud.'
          : 'Gagal mengemas kini pengguna.',
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Pengguna telah dipadam.')
      invalidate()
    },
    onError: () => toast.error('Gagal memadam pengguna.'),
  })

  const isSelf = (id: string) => id === currentUserId

  const passwordValid = addForm.password.length >= 6

  const handleEdit = (user: SafeUser) => {
    setEditTarget({ id: user.id })
    setEditForm({
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      password: '',
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Pengurusan Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Pengurusan akaun pentadbir dan penyelia sistem.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Tambah Pengguna
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Tiada pengguna ditemui.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Penuh</TableHead>
                <TableHead>Peranan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {user.username}
                    {isSelf(user.id) && (
                      <Badge variant="secondary" className="ml-2">
                        Anda
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'outline'}>
                      {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        <Pencil className="size-3.5" />
                        Sunting
                      </Button>
                      {isSelf(user.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Anda tidak boleh memadam akaun sendiri"
                        >
                          <Trash2 className="size-3.5" />
                          Padam
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="size-3.5" />
                              Padam
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Padam Pengguna?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Akaun "{user.username}" akan dipadam secara kekal. Tindakan ini
                                tidak boleh dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(user.id)}
                              >
                                Ya, Padam
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna</DialogTitle>
            <DialogDescription>
              Pengguna boleh log masuk ke panel pentadbiran.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-fullname">Nama Penuh</Label>
              <Input
                id="add-fullname"
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Kata Laluan</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                autoComplete="new-password"
                required
              />
              {!passwordValid && (
                <p className="text-xs text-destructive">Kata laluan mestilah sekurang-kurangnya 6 aksara.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Peranan</Label>
              <Select
                value={addForm.role}
                onValueChange={(v) => setAddForm({ ...addForm, role: v as UserRole })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih peranan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Penyelia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={
                !addForm.username.trim() ||
                !addForm.full_name.trim() ||
                !passwordValid ||
                addMutation.isPending
              }
            >
              {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sunting Pengguna</DialogTitle>
            <DialogDescription>
              Kemaskini maklumat pengguna. Biarkan kata laluan kosong jika tidak mahu menukarnya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Nama Penuh</Label>
              <Input
                id="edit-fullname"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Kata Laluan Baharu (Pilihan)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                autoComplete="new-password"
                placeholder="Kosongkan jika tidak mahu menukar"
              />
              {editForm.password && editForm.password.length < 6 && (
                <p className="text-xs text-destructive">Kata laluan mestilah sekurang-kurangnya 6 aksara.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Peranan</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRole })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Penyelia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Akaun Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Batal
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={
                !editForm.username.trim() ||
                !editForm.full_name.trim() ||
                (editForm.password.length > 0 && editForm.password.length < 6) ||
                editMutation.isPending
              }
            >
              {editMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

