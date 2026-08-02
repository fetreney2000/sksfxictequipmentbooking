import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/lib/types'

export interface AuthUser {
  id: string
  username: string
  full_name: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (patch: Partial<AuthUser>) => void
}

const STORAGE_KEY = 'pinjam-ict-auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
