import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Footer } from '@/components/Footer'
import {
  submitContactMessage,
  getUserMessages,
  updateContactMessage,
  deleteContactMessage,
} from '@/services/contactService'
import type { Contact, ContactPayload } from '@/types'
import {
  Mail,
  Send,
  Loader2,
  Trash2,
  Edit2,
  ArrowLeft,
  MessageCircle,
  Clock,
} from 'lucide-react'
import { formatDate } from '@/utils'
import logoImg from '../assets/mediavault.png'

interface FormData {
  name: string
  email: string
  message: string
}

interface EditingMessage {
  id: string
  message: string
}

export const ContactFormPage = () => {
  const { user, isAuthenticated } = useAuth()

  // Form State
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    message: '',
  })

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showMessagesList, setShowMessagesList] = useState(false)

  // Messages State
  const [messages, setMessages] = useState<Contact[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(
    null
  )
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  const MESSAGES_PER_PAGE = 5

  // Fetch user messages when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && showMessagesList) {
      fetchUserMessages(1)
    }
  }, [isAuthenticated, showMessagesList])

  // Update form when user data changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }))
    }
  }, [isAuthenticated, user])

  // Fetch user's messages
  const fetchUserMessages = async (page: number) => {
    try {
      setIsLoadingMessages(true)
      setError(null)
      const data = await getUserMessages(page, MESSAGES_PER_PAGE)
      setMessages(data.messages)
      setCurrentPage(data.pagination.currentPage)
      setTotalPages(data.pagination.totalPages)
      setTotalItems(data.pagination.totalItems)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load your messages')
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (!formData.message.trim()) {
      setError('Message is required')
      return false
    }

    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters long')
      return false
    }

    if (formData.message.trim().length > 1000) {
      setError('Message cannot exceed 1000 characters')
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload: ContactPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      }

      await submitContactMessage(payload)
      setSuccessMessage(
        'Thank you for your message! We will get back to you soon.'
      )
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        message: '',
      })

      // Refresh messages list if showing
      if (showMessagesList && isAuthenticated) {
        await fetchUserMessages(1)
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      let errorMessage = 'Failed to submit message. Please try again.'
      if (err instanceof Error && err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle message editing
  const handleEditMessage = async (id: string, newMessage: string) => {
    if (!newMessage.trim()) {
      setError('Message cannot be empty')
      return
    }

    if (newMessage.trim().length < 10) {
      setError('Message must be at least 10 characters long')
      return
    }

    if (newMessage.trim().length > 1000) {
      setError('Message cannot exceed 1000 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateContactMessage(id, newMessage.trim())
      setMessages((prev) => prev.map((msg) => (msg.id === id ? updated : msg)))
      setEditingMessage(null)
      setSuccessMessage('Message updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMessage = 'Failed to update message. Please try again.'
      if (err instanceof Error && err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle message deletion
  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    setIsDeletingId(id)
    try {
      await deleteContactMessage(id)
      setMessages((prev) => prev.filter((msg) => msg.id !== id))
      setSuccessMessage('Message deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMessage = 'Failed to delete message. Please try again.'
      if (err instanceof Error && err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-slate-800/50 border-b border-slate-700 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="MediaVault" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-white">MediaVault</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-slate-200 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Contact Us</h2>
            <p className="text-slate-400">
              Have a question or feedback? We'd love to hear from you.
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <Mail className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Contact Form Card */}
          {!showMessagesList && (
            <Card className="mb-8 border-slate-700 bg-slate-800/50">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-2xl text-white">
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Fill out the form below and we'll get back to you as soon as
                  possible
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-200">
                      Message{' '}
                      <span className="text-xs text-slate-500">
                        ({formData.message.length}/1000)
                      </span>
                    </Label>
                    <textarea
                      id="message"
                      placeholder="Your message here... (10-1000 characters)"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      disabled={isSubmitting}
                      rows={6}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none transition resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold h-10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* View Messages Button */}
          {isAuthenticated && (
            <div className="mb-8 flex justify-center">
              <Button
                onClick={() => setShowMessagesList(!showMessagesList)}
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {showMessagesList ? 'Hide My Messages' : 'View My Messages'}
              </Button>
            </div>
          )}

          {/* Messages List */}
          {showMessagesList && isAuthenticated && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                My Messages
              </h3>

              {isLoadingMessages ? (
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardContent className="pt-6 flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                  </CardContent>
                </Card>
              ) : messages.length === 0 ? (
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardContent className="pt-6 py-12 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                      You haven't sent any messages yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Messages */}
                  {messages.map((msg) => (
                    <Card
                      key={msg.id}
                      className="border-slate-700 bg-slate-800/50 hover:border-slate-600 transition"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock className="w-4 h-4" />
                            {formatDate(msg.createdAt)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                setEditingMessage({
                                  id: msg.id,
                                  message: msg.message,
                                })
                              }
                              disabled={editingMessage?.id === msg.id}
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-cyan-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteMessage(msg.id)}
                              disabled={isDeletingId === msg.id}
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-red-400"
                            >
                              {isDeletingId === msg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Edit Mode */}
                        {editingMessage?.id === msg.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingMessage.message}
                              onChange={(e) =>
                                setEditingMessage({
                                  ...editingMessage,
                                  message: e.target.value,
                                })
                              }
                              rows={4}
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none transition resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                onClick={() => setEditingMessage(null)}
                                disabled={isSubmitting}
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-200 hover:bg-slate-800"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() =>
                                  handleEditMessage(
                                    msg.id,
                                    editingMessage.message
                                  )
                                }
                                disabled={isSubmitting}
                                size="sm"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                              >
                                {isSubmitting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Save'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-300 leading-relaxed">
                            {msg.message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
                      <p className="text-sm text-slate-400">
                        Showing page {currentPage} of {totalPages} ({totalItems}{' '}
                        total messages)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => fetchUserMessages(currentPage - 1)}
                          disabled={currentPage === 1 || isLoadingMessages}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-md text-sm text-slate-300">
                          {currentPage}/{totalPages}
                        </div>
                        <Button
                          onClick={() => fetchUserMessages(currentPage + 1)}
                          disabled={
                            currentPage === totalPages || isLoadingMessages
                          }
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
