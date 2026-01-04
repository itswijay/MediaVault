// Token Management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken')
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken')
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token)
}

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refreshToken', token)
}

export const clearTokens = (): void => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]))
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// User Management
export const getStoredUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const setStoredUser = (user: Record<string, unknown>): void => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearStoredUser = (): void => {
  localStorage.removeItem('user')
}

// Format utilities
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.type)
}

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}
