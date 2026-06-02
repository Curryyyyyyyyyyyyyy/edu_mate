import { createContext, useState, useCallback, type ReactNode } from 'react'
import type { UserInfo } from '../types/api'
import { getMe } from '../api/auth'

interface AuthState {
  user: UserInfo | null
  token: string | null
  loading: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => void
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
})

export { AuthCtx }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)

  const login = useCallback((t: string, u: UserInfo) => {
    setToken(t)
    setUser(u)
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await getMe()
      if (res.success) {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      }
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  )
}
