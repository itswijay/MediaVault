import api from './api'
import type { ContactPayload, Contact } from '@/types'

// Submit a contact message
export const submitContactMessage = async (
  payload: ContactPayload
): Promise<Contact> => {
  try {
    const response = await api.post('/contact', payload)
    const contact = response.data.data.contact
    // Transform _id to id for consistency
    return {
      ...contact,
      id: (contact as { _id?: string } & typeof contact)._id || contact.id,
    }
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

    // Transform _id to id for consistency
    const transformedMessages = response.data.data.messages.map(
      (message: Contact) => ({
        ...message,
        id: (message as { _id?: string } & typeof message)._id || message.id,
      })
    )

    return {
      messages: transformedMessages,
      pagination: response.data.data.pagination,
    }
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
    const contact = response.data.data.contact

    // Transform _id to id for consistency
    return {
      ...contact,
      id: (contact as { _id?: string } & typeof contact)._id || contact.id,
    }
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

// Get all contact messages (admin only)
export const getAllMessages = async (
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
    const response = await api.get('/contact/admin', {
      params: { page, limit },
    })

    // Transform _id to id for consistency
    const transformedMessages = response.data.data.messages.map(
      (message: Contact) => ({
        ...message,
        id: (message as { _id?: string } & typeof message)._id || message.id,
      })
    )

    return {
      messages: transformedMessages,
      pagination: response.data.data.pagination,
    }
  } catch (error) {
    console.error('Error fetching all messages:', error)
    throw error
  }
}

// Delete a contact message (admin)
export const deleteMessageAdmin = async (id: string): Promise<void> => {
  try {
    await api.delete(`/contact/admin/${id}`)
  } catch (error) {
    console.error('Error deleting message:', error)
    throw error
  }
}

// Mark message as read (admin)
export const markMessageAsRead = async (id: string): Promise<Contact> => {
  try {
    const response = await api.put(`/contact/${id}/read`, {})
    const contact = response.data.data.contact

    // Transform _id to id for consistency
    return {
      ...contact,
      id: (contact as { _id?: string } & typeof contact)._id || contact.id,
    }
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}
