import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { mockUsers } from '../data/mockData'
import { AuthContext } from './auth-context'

function routeByRole(role) {
  if (role === 'customer') return '/cliente'
  if (role === 'admin') return '/admin'
  return '/operacion'
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('checkar_token') || '')
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('checkar_user')
    return saved ? JSON.parse(saved) : null
  })
  const [ready, setReady] = useState(false)
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem('checkar_is_demo') === 'true')

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setReady(true)
        return
      }

      if (token.startsWith('demo-')) {
        setIsDemo(true)
        setReady(true)
        return
      }

      try {
        const payload = await apiRequest('/auth/session/', {}, token)
        setUser(payload.user)
        setIsDemo(false)
      } catch {
        setToken('')
        setUser(null)
        setIsDemo(false)
        localStorage.removeItem('checkar_token')
        localStorage.removeItem('checkar_user')
        localStorage.removeItem('checkar_is_demo')
      } finally {
        setReady(true)
      }
    }

    hydrate()
  }, [token])

  const persist = (nextToken, nextUser, demo = false) => {
    setToken(nextToken)
    setUser(nextUser)
    setIsDemo(demo)

    if (nextToken) localStorage.setItem('checkar_token', nextToken)
    else localStorage.removeItem('checkar_token')

    if (nextUser) localStorage.setItem('checkar_user', JSON.stringify(nextUser))
    else localStorage.removeItem('checkar_user')

    localStorage.setItem('checkar_is_demo', String(demo))
  }

  const login = async (credentials) => {
    const payload = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    persist(payload.token, payload.user, false)
    return routeByRole(payload.user.role)
  }

  const register = async (formData) => {
    const payload = await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ ...formData, role: 'customer' }),
    })
    persist(payload.token, payload.user, false)
    return '/cliente'
  }

  const enterDemo = (role) => {
    const demoUser = mockUsers[role]
    persist(`demo-${role}`, demoUser, true)
    return routeByRole(demoUser.role)
  }

  const logout = async () => {
    if (token && !isDemo) {
      try {
        await apiRequest('/auth/logout/', { method: 'POST' }, token)
      } catch {
        // Ignore logout network errors and clear local state.
      }
    }
    persist('', null, false)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        ready,
        isDemo,
        login,
        register,
        enterDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
