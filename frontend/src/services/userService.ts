import api from './api'
import type { User } from '../types'

interface UserResponse {
  success: boolean
  data: {
    user: User
  }
}

interface UsersListResponse {
  success: boolean
  data: {
    users: User[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
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

// ======== ADMIN FUNCTIONS ========

// Get all users with pagination and filters
export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  role?: string,
  isActive?: boolean
): Promise<{
  users: User[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })

    if (role) {
      params.append('role', role)
    }

    if (isActive !== undefined) {
      params.append('isActive', String(isActive))
    }

    const response = await api.get<UsersListResponse>('/users/admin', {
      params: Object.fromEntries(params),
    })

    // Transform _id to id for consistency
    const transformedUsers = response.data.data.users.map((user) => ({
      ...user,
      id: (user as { _id?: string } & typeof user)._id || user.id, // Use _id if id doesn't exist
    }))

    return {
      users: transformedUsers,
      pagination: response.data.data.pagination,
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

// Update user (admin only)
export const updateAdminUser = async (
  userId: string,
  updates: { name?: string; email?: string; role?: string; isActive?: boolean }
): Promise<User | null> => {
  try {
    const response = await api.put<UserResponse>(`/users/${userId}`, updates)
    if (response.data.success) {
      const user = response.data.data.user
      // Transform _id to id for consistency
      return {
        ...user,
        id: (user as { _id?: string } & typeof user)._id || user.id,
      }
    }
    return null
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Soft delete user (deactivate)
export const softDeleteUser = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.delete<UserResponse>(`/users/${userId}`)
    if (response.data.success) {
      return response.data.data.user
    }
    return null
  } catch (error) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

// Hard delete user (permanent delete)
export const hardDeleteUser = async (userId: string): Promise<boolean> => {
  try {
    const response = await api.delete<{ success: boolean }>(
      `/users/${userId}/permanent`,
      {
        data: { confirmation: 'DELETE' },
      }
    )
    return response.data.success
  } catch (error) {
    console.error('Error permanently deleting user:', error)
    throw error
  }
}
