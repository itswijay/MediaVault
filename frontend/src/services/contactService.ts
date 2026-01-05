import api from './api'
import type { ContactPayload, Contact } from '@/types'

// Submit a contact message
export const submitContactMessage = async (
  payload: ContactPayload
): Promise<Contact> => {
  try {
    const response = await api.post('/contact', payload)
    return response.data.data.contact
  } catch (error) {
    console.error('Error submitting contact message:', error)
    throw error
  }
}

// Get user's contact messages with pagination
export const getUserMessages = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  messages: Contact[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}> => {
  try {
    const response = await api.get('/contact/mymessages', {
      params: { page, limit },
    })
    return response.data.data
  } catch (error) {
    console.error('Error fetching user messages:', error)
    throw error
  }
}

// Update a contact message
export const updateContactMessage = async (
  id: string,
  message: string
): Promise<Contact> => {
  try {
    const response = await api.put(`/contact/${id}`, { message })
    return response.data.data.contact
  } catch (error) {
    console.error('Error updating contact message:', error)
    throw error
  }
}

// Delete a contact message
export const deleteContactMessage = async (id: string): Promise<void> => {
  try {
    await api.delete(`/contact/${id}`)
  } catch (error) {
    console.error('Error deleting contact message:', error)
    throw error
  }
}
