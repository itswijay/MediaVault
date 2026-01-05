import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  getAllMessages,
  deleteMessageAdmin,
  markMessageAsRead,
} from '@/services/contactService'
import type { Contact } from '@/types'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Mail,
  MessageCircle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { formatDate } from '@/utils'
import logoImg from '../assets/mediavault.png'

interface FullMessage extends Contact {
  userName?: string
}

interface MessageViewModal {
  id: string
  name: string
  email: string
  message: string
  isRead: boolean
}

export const AdminContactPage = () => {
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuth()

  // State
  const [messages, setMessages] = useState<FullMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [readFilter, setReadFilter] = useState<'' | 'read' | 'unread'>('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const MESSAGES_PER_PAGE = 10

  // Modal States
  const [viewingMessage, setViewingMessage] = useState<MessageViewModal | null>(
    null
  )
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null)

  // Fetch messages
  const fetchMessages = async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getAllMessages(page, MESSAGES_PER_PAGE)
      setMessages(data.messages)
      setCurrentPage(data.pagination.currentPage)
      setTotalPages(data.pagination.totalPages)
      setTotalItems(data.pagination.totalItems)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch messages on mount and filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, readFilter])

  useEffect(() => {
    fetchMessages(currentPage)
  }, [currentPage])

  // Check if user is admin
  const isAdmin = isAuthenticated && currentUser?.role === 'admin'

  // Check if current admin has read this message
  const isMessageReadByCurrentAdmin = (
    message: Contact,
    adminId?: string
  ): boolean => {
    if (!adminId) return false
    return message.readBy?.some((read) => read.adminId === adminId) ?? false
  }

  // Filter messages by search term and read status (client-side)
  const filteredMessages = messages.filter((message) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      message.name.toLowerCase().includes(searchLower) ||
      message.email.toLowerCase().includes(searchLower) ||
      message.message.toLowerCase().includes(searchLower)

    const isReadByCurrentAdmin = isMessageReadByCurrentAdmin(
      message,
      currentUser?.id
    )
    const matchesReadFilter =
      readFilter === '' ||
      (readFilter === 'read' && isReadByCurrentAdmin) ||
      (readFilter === 'unread' && !isReadByCurrentAdmin)

    return matchesSearch && matchesReadFilter
  })

  // Handle mark as read
  const handleMarkAsRead = async (messageId: string) => {
    setIsMarkingRead(messageId)
    try {
      const updatedMessage = await markMessageAsRead(messageId)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updatedMessage : m))
      )
      if (viewingMessage?.id === messageId) {
        setViewingMessage({
          ...viewingMessage,
          isRead: isMessageReadByCurrentAdmin(updatedMessage, currentUser?.id),
        })
      }
      setSuccessMessage('Message marked as read')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMsg = 'Failed to mark message as read'
      if (err instanceof Error && err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    } finally {
      setIsMarkingRead(null)
    }
  }

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    setIsDeletingId(messageId)
    try {
      await deleteMessageAdmin(messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      if (viewingMessage?.id === messageId) {
        setViewingMessage(null)
      }
      setSuccessMessage('Message deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMsg = 'Failed to delete message'
      if (err instanceof Error && err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    } finally {
      setIsDeletingId(null)
    }
  }

  // Show access denied if not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You need admin privileges to access this page.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
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
            onClick={() => navigate('/dashboard')}
            className="text-slate-100 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">
              Contact Messages
            </h2>
            <p className="text-slate-400">
              View and manage all contact form submissions
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="mb-8 border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-slate-200">
                  Search by Name, Email, or Message
                </Label>
                <Input
                  id="search"
                  placeholder="Enter name, email, or message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Read Status Filter */}
              <div>
                <Label htmlFor="read-filter" className="text-slate-200">
                  Filter by Status
                </Label>
                <select
                  id="read-filter"
                  value={readFilter}
                  onChange={(e) =>
                    setReadFilter(e.target.value as '' | 'read' | 'unread')
                  }
                  className="mt-2 w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">All Messages</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Messages Table Card */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Messages</CardTitle>
                  <CardDescription className="text-slate-400">
                    Total: {totalItems} messages
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {searchTerm
                      ? 'No messages found matching your search'
                      : 'No messages found'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          From
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Message Preview
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMessages.map((message) => (
                        <tr
                          key={message.id}
                          className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                        >
                          <td className="px-4 py-3 text-slate-200 font-medium">
                            {message.name}
                          </td>
                          <td className="px-4 py-3 text-slate-200">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4 text-slate-500" />
                              {message.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-sm max-w-sm">
                            <p className="truncate">
                              {message.message.substring(0, 50)}
                              {message.message.length > 50 ? '...' : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(message.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                isMessageReadByCurrentAdmin(
                                  message,
                                  currentUser?.id
                                )
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}
                            >
                              {isMessageReadByCurrentAdmin(
                                message,
                                currentUser?.id
                              ) ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {isMessageReadByCurrentAdmin(
                                message,
                                currentUser?.id
                              )
                                ? 'Read'
                                : 'Unread'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  setViewingMessage({
                                    id: message.id,
                                    name: message.name,
                                    email: message.email,
                                    message: message.message,
                                    isRead: isMessageReadByCurrentAdmin(
                                      message,
                                      currentUser?.id
                                    ),
                                  })
                                }
                                size="sm"
                                variant="ghost"
                                className="text-cyan-100 hover:text-cyan-300 hover:bg-cyan-500/10"
                                title="View full message"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!isMessageReadByCurrentAdmin(
                                message,
                                currentUser?.id
                              ) && (
                                <Button
                                  onClick={() => handleMarkAsRead(message.id)}
                                  disabled={isMarkingRead === message.id}
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  title="Mark as read"
                                >
                                  {isMarkingRead === message.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteMessage(message.id)}
                                disabled={isDeletingId === message.id}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Delete message"
                              >
                                {isDeletingId === message.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && filteredMessages.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoading}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || isLoading}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Message Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-slate-700 bg-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Full Message</CardTitle>
                  <CardDescription className="text-slate-400">
                    From: {viewingMessage.name} ({viewingMessage.email})
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingMessage(null)}
                  className="text-slate-100 hover:text-white"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message Content */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-200 whitespace-pre-wrap">
                  {viewingMessage.message}
                </p>
              </div>

              {/* Status Info */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    viewingMessage.isRead
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {viewingMessage.isRead ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {viewingMessage.isRead ? 'Read' : 'Unread'} (Your view)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
                {!viewingMessage.isRead && (
                  <Button
                    onClick={() => {
                      handleMarkAsRead(viewingMessage.id)
                      setViewingMessage(null)
                    }}
                    disabled={isMarkingRead === viewingMessage.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isMarkingRead === viewingMessage.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Mark as Read
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleDeleteMessage(viewingMessage.id)
                    setViewingMessage(null)
                  }}
                  disabled={isDeletingId === viewingMessage.id}
                  variant="destructive"
                >
                  {isDeletingId === viewingMessage.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
                <Button
                  onClick={() => setViewingMessage(null)}
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
