import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { AuthContext, type AuthContextType } from './createAuthContext'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user && !!localStorage.getItem('authToken')

  const login = useCallback(
    (userData: User, token: string, refreshToken?: string) => {
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('authToken', token)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      setError(null)
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    setError(null)
  }, [])

  const updateUser = useCallback((userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: false,
    error,
    setUser,
    setError,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}