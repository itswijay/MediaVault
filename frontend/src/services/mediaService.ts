import api from './api'
import type { Media, MediaResponse } from '../types'

// Response type for paginated media
interface PaginatedMediaResponse {
  success: boolean
  data: {
    media: Media[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

// Get user's media with pagination
export const getUserMedia = async (
  page: number = 1,
  limit: number = 10
): Promise<Media[]> => {
  try {
    const response = await api.get<PaginatedMediaResponse>(
      `/media/my-media?page=${page}&limit=${limit}`
    )
    if (response.data.success && response.data.data?.media) {
      return response.data.data.media
    }
    return []
  } catch (error) {
    console.error('Error fetching user media:', error)
    throw error
  }
}

// Get media with limit (for recent uploads)
export const getRecentMedia = async (limit: number = 5): Promise<Media[]> => {
  try {
    const response = await api.get<PaginatedMediaResponse>(
      `/media/my-media?limit=${limit}&sort=-createdAt`
    )
    if (response.data.success && response.data.data?.media) {
      return response.data.data.media
    }
    return []
  } catch (error) {
    console.error('Error fetching recent media:', error)
    throw error
  }
}

// Get shared media
export const getSharedMedia = async (limit: number = 5): Promise<Media[]> => {
  try {
    const response = await api.get<PaginatedMediaResponse>(
      `/media/shared?limit=${limit}&sort=-createdAt`
    )
    if (response.data.success && response.data.data?.media) {
      return response.data.data.media
    }
    return []
  } catch (error) {
    console.error('Error fetching shared media:', error)
    return []
  }
}

// Get public media
export const getPublicMedia = async (
  page: number = 1,
  limit: number = 10
): Promise<Media[]> => {
  try {
    const response = await api.get<PaginatedMediaResponse>(
      `/media/public?page=${page}&limit=${limit}`
    )
    if (response.data.success && response.data.data?.media) {
      return response.data.data.media
    }
    return []
  } catch (error) {
    console.error('Error fetching public media:', error)
    throw error
  }
}

// Get media by ID
export const getMediaById = async (id: string): Promise<Media | null> => {
  try {
    const response = await api.get<MediaResponse>(`/media/${id}`)
    if (response.data.success) {
      const data = response.data.data
      return Array.isArray(data) ? data[0] : data
    }
    return null
  } catch (error) {
    console.error('Error fetching media:', error)
    throw error
  }
}

// Upload media
export const uploadMedia = async (
  formData: FormData
): Promise<Media | null> => {
  try {
    const response = await api.post<MediaResponse>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    if (response.data.success) {
      const data = response.data.data
      return Array.isArray(data) ? data[0] : data
    }
    return null
  } catch (error) {
    console.error('Error uploading media:', error)
    throw error
  }
}

// Update media
export const updateMedia = async (
  id: string,
  updates: Partial<Media>
): Promise<Media | null> => {
  try {
    const response = await api.put<MediaResponse>(`/media/${id}`, updates)
    if (response.data.success) {
      const data = response.data.data
      return Array.isArray(data) ? data[0] : data
    }
    return null
  } catch (error) {
    console.error('Error updating media:', error)
    throw error
  }
}

// Delete media
export const deleteMedia = async (id: string): Promise<boolean> => {
  try {
    const response = await api.delete<MediaResponse>(`/media/${id}`)
    return response.data.success
  } catch (error) {
    console.error('Error deleting media:', error)
    throw error
  }
}

// Search media
export const searchMedia = async (
  query: string,
  filters?: { tags?: string[]; isPublic?: boolean }
): Promise<Media[]> => {
  try {
    let url = `/media/search?query=${query}`
    if (filters?.tags?.length) {
      url += `&tags=${filters.tags.join(',')}`
    }
    if (filters?.isPublic !== undefined) {
      url += `&isPublic=${filters.isPublic}`
    }

    const response = await api.get<MediaResponse>(url)
    if (response.data.success) {
      const data = response.data.data
      return Array.isArray(data) ? data : [data]
    }
    return []
  } catch (error) {
    console.error('Error searching media:', error)
    throw error
  }
}

// Share media
export const shareMedia = async (
  mediaId: string,
  userIds: string[]
): Promise<Media | null> => {
  try {
    const response = await api.put<MediaResponse>(`/media/${mediaId}/share`, {
      userIds,
    })
    if (response.data.success) {
      const data = response.data.data
      return Array.isArray(data) ? data[0] : data
    }
    return null
  } catch (error) {
    console.error('Error sharing media:', error)
    throw error
  }
}

export default {
  getUserMedia,
  getRecentMedia,
  getSharedMedia,
  getPublicMedia,
  getMediaById,
  uploadMedia,
  updateMedia,
  deleteMedia,
  searchMedia,
  shareMedia,
}
