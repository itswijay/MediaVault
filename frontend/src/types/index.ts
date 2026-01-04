// User Types
export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  profileImage?: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

// Auth Types
export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
    refreshToken?: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface SendOTPPayload {
  email: string
}

export interface VerifyOTPPayload {
  email: string
  otp: string
}

export interface ResetPasswordPayload {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

// Media Types
export interface Media {
  _id?: string
  id?: string
  userId: string
  title: string
  description?: string
  tags: string[]
  imageUrl: string
  thumbnailUrl?: string
  fileSize: number
  isPublic: boolean
  sharedWith: string[]
  createdAt: string
  updatedAt: string
}

export interface MediaResponse {
  success: boolean
  message: string
  data: Media | Media[]
}

// Contact Types
export interface Contact {
  id: string
  name: string
  email: string
  message: string
  userId?: string
  isRead: boolean
  createdAt: string
}

export interface ContactPayload {
  name: string
  email: string
  message: string
}

export interface ContactResponse {
  success: boolean
  message: string
  data: Contact | Contact[]
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
