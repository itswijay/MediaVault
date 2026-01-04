import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Mail, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import api from '@/services/api'

interface UserPreview {
  id: string
  name: string
  email: string
  profileImage?: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  mediaId: string
  mediaTitle: string
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  mediaTitle,
}) => {
  const [email, setEmail] = useState('')
  const [userPreview, setUserPreview] = useState<UserPreview | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<UserPreview[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  if (!isOpen) return null

  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Search user by email
  const handleSearchUser = async (searchEmail: string) => {
    if (!searchEmail.trim()) {
      setUserPreview(null)
      setSearchError(null)
      return
    }

    if (!isValidEmail(searchEmail)) {
      setSearchError('Please enter a valid email')
      setUserPreview(null)
      return
    }

    try {
      setIsSearching(true)
      setSearchError(null)

      // Search for user by email in the backend
      const response = await api.get(`/users/search?email=${searchEmail}`)

      if (response.data.success && response.data.data) {
        const user = response.data.data
        setUserPreview({
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
        })
      } else {
        setSearchError('User not found')
        setUserPreview(null)
      }
    } catch (err) {
      console.error('Error searching user:', err)
      setSearchError('User not found')
      setUserPreview(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Add user to share list
  const handleAddUser = (user: UserPreview) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
      setEmail('')
      setUserPreview(null)
    }
  }

  // Remove user from share list
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  // Share media with selected users
  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to share with')
      return
    }

    try {
      setIsSharing(true)
      setError(null)
      setSuccess(null)

      const userIds = selectedUsers.map((u) => u.id)

      const response = await api.post(`/media/${mediaId}/share`, {
        userIds,
      })

      if (response.data.success) {
        setSuccess(
          `Shared with ${selectedUsers.length} user${
            selectedUsers.length > 1 ? 's' : ''
          }!`
        )
        setSelectedUsers([])
        setEmail('')
        setUserPreview(null)

        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg = error?.response?.data?.message || 'Failed to share media'
      setError(errorMsg)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Share Media</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Media Title */}
          <div>
            <p className="text-sm text-slate-400 mb-1">Sharing:</p>
            <p className="text-white font-medium truncate">{mediaTitle}</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {searchError && (
            <div className="p-2 rounded text-amber-300 text-xs bg-amber-500/10">
              {searchError}
            </div>
          )}

          {/* Email Search */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-slate-300">
                Add users by email
              </label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    handleSearchUser(e.target.value)
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* User Preview */}
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
            )}

            {userPreview && !isSearching && (
              <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {userPreview.profileImage ? (
                      <img
                        src={userPreview.profileImage}
                        alt={userPreview.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                        {userPreview.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {userPreview.name}
                      </p>
                      <p className="text-slate-400 text-xs truncate">
                        {userPreview.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddUser(userPreview)}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2 p-4 bg-slate-700/20 rounded-lg border border-slate-600">
              <p className="text-sm text-slate-300 font-medium">
                Sharing with {selectedUsers.length} user
                {selectedUsers.length > 1 ? 's' : ''}:
              </p>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-slate-700/50 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isSharing}
            className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Share
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
