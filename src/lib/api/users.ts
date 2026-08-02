import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabaseClient'
import type { UserRow, UserRole, Database } from '@/lib/types'
import { nowTimestampKL } from '@/lib/datetime'

type UserUpdate = Database['public']['Tables']['pinjam_users']['Update']

const BCRYPT_ROUNDS = 10

/** Public-facing user shape (never includes password_hash). */
export type SafeUser = Omit<UserRow, 'password_hash'>

function toSafeUser(row: UserRow): SafeUser {
  const { password_hash: _ignored, ...safe } = row
  return safe
}

/** Verify a username/password pair. Returns safe user or throws a generic error. */
export async function verifyLogin(
  username: string,
  password: string,
): Promise<SafeUser> {
  const { data, error } = await supabase
    .from('pinjam_users')
    .select('*')
    .eq('username', username.trim())
    .maybeSingle()
  if (error) throw error

  const row = data as UserRow | null
  if (!row || !row.is_active) {
    throw new Error('Nama pengguna atau kata laluan tidak sah.')
  }

  const matches = await bcrypt.compare(password, row.password_hash)
  if (!matches) {
    throw new Error('Nama pengguna atau kata laluan tidak sah.')
  }

  await supabase
    .from('pinjam_users')
    .update({ last_login_at: nowTimestampKL() })
    .eq('id', row.id)

  return toSafeUser(row)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPasswordForUser(
  userId: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('pinjam_users')
    .select('password_hash')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return false
  return bcrypt.compare(password, (data as UserRow).password_hash)
}

export async function fetchAllUsers(): Promise<SafeUser[]> {
  const { data, error } = await supabase
    .from('pinjam_users')
    .select('id, username, full_name, role, is_active, last_login_at, created_at, updated_at')
    .order('full_name')
  if (error) throw error
  return (data ?? []) as SafeUser[]
}

export async function createUser(input: {
  username: string
  full_name: string
  password: string
  role: UserRole
}): Promise<void> {
  const password_hash = await hashPassword(input.password)
  const { error } = await supabase.from('pinjam_users').insert({
    username: input.username.trim(),
    full_name: input.full_name.trim(),
    password_hash,
    role: input.role,
  })
  if (error) throw error
}

export async function updateUser(
  id: string,
  patch: {
    username?: string
    full_name?: string
    role?: UserRole
    is_active?: boolean
    password?: string
  },
): Promise<void> {
  const dbPatch: UserUpdate = {}
  if (patch.username !== undefined) dbPatch.username = patch.username.trim()
  if (patch.full_name !== undefined) dbPatch.full_name = patch.full_name.trim()
  if (patch.role !== undefined) dbPatch.role = patch.role
  if (patch.is_active !== undefined) dbPatch.is_active = patch.is_active
  if (patch.password && patch.password.length > 0) {
    dbPatch.password_hash = await hashPassword(patch.password)
  }
  if (Object.keys(dbPatch).length === 0) return
  const { error } = await supabase.from('pinjam_users').update(dbPatch).eq('id', id)
  if (error) throw error
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('pinjam_users').delete().eq('id', id)
  if (error) throw error
}

export async function updateProfile(
  userId: string,
  patch: {
    username?: string
    full_name?: string
    newPassword?: string
  },
): Promise<void> {
  const dbPatch: UserUpdate = {}
  if (patch.username !== undefined) dbPatch.username = patch.username.trim()
  if (patch.full_name !== undefined) dbPatch.full_name = patch.full_name.trim()
  if (patch.newPassword && patch.newPassword.length > 0) {
    dbPatch.password_hash = await hashPassword(patch.newPassword)
  }
  if (Object.keys(dbPatch).length === 0) return
  const { error } = await supabase.from('pinjam_users').update(dbPatch).eq('id', userId)
  if (error) throw error
}

/** Update username/full_name only when a username change is needed (keeps sessions in sync). */
export async function updateUserMetadata(
  userId: string,
  patch: { username?: string; full_name?: string },
): Promise<void> {
  const dbPatch: UserUpdate = {}
  if (patch.username !== undefined) dbPatch.username = patch.username.trim()
  if (patch.full_name !== undefined) dbPatch.full_name = patch.full_name.trim()
  if (Object.keys(dbPatch).length === 0) return
  const { error } = await supabase.from('pinjam_users').update(dbPatch).eq('id', userId)
  if (error) throw error
}
