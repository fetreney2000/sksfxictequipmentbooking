import { useAuthStore } from '@/store/auth'
import type { AuthUser } from '@/store/auth'
import { verifyLogin } from '@/lib/api/users'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const updateUser = useAuthStore((s) => s.updateUser)

  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login: async (username: string, password: string) => {
      const safe = await verifyLogin(username, password)
      const authUser: AuthUser = {
        id: safe.id,
        username: safe.username,
        full_name: safe.full_name,
        role: safe.role,
      }
      login(authUser)
      return authUser
    },
    logout,
    updateUser,
  }
}
