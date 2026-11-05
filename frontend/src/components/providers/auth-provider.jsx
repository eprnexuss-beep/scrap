import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [justLoggedOut, setJustLoggedOut] = useState(false) // so the login page after logout has no ?next=

  const refresh = useCallback(async () => {
    try {
      const data = await api('/api/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (payload) => {
    const data = await api('/api/auth/login', { method: 'POST', json: payload })
    setJustLoggedOut(false)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {}
    setJustLoggedOut(true)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, justLoggedOut, refresh, login, logout }),
    [user, loading, justLoggedOut, refresh, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
