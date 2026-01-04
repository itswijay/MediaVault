import { createContext, useState, useCallback, ReactNode } from 'react'
import { User } from '../types'

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setError: (error: string | null) => void
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const [isLoading, setIsLoading] = useState(false)
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
    isLoading,
    error,
    setUser,
    setError,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
