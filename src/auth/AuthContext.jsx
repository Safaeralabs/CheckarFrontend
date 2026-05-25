import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('checkar_token'))
  const [user,  setUser]  = useState(null)
  const [ready, setReady] = useState(false)

  const loadUser = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      localStorage.removeItem('checkar_token')
      setToken(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (token) loadUser()
    else setReady(true)
  }, [token, loadUser])

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('checkar_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await authApi.register(formData)
    localStorage.setItem('checkar_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem('checkar_token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser) => setUser(updatedUser)

  const rotateToken = (newToken) => {
    localStorage.setItem('checkar_token', newToken)
    setToken(newToken)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, updateUser, rotateToken, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
