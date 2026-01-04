import api from './api'
import type { User } from '../types'

interface UserResponse {
  success: boolean
  data: {
    user: User
  }
}

// Get user profile
export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await api.get<UserResponse>('/users/profile')
    if (response.data.success) {
      return response.data.data.user
    }
    return null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

// Update user profile
export const updateUserProfile = async (
  updates: Partial<User>
): Promise<User | null> => {
  try {
    const response = await api.put<UserResponse>('/users/profile', updates)
    if (response.data.success) {
      return response.data.data.user
    }
    return null
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const response = await api.post<{ success: boolean }>(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      }
    )
    return response.data.success
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

// Delete user account
export const deleteUserAccount = async (): Promise<boolean> => {
  try {
    const response = await api.delete<{ success: boolean }>('/users/profile')
    return response.data.success
  } catch (error) {
    console.error('Error deleting user account:', error)
    throw error
  }
}

// Get user by ID (for admin or public data)
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.get<UserResponse>(`/users/${userId}`)
    if (response.data.success) {
      return response.data.data.user
    }
    return null
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}
