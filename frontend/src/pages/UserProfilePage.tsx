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
import api from '@/services/api'
import { getUserMedia } from '@/services/mediaService'
import type { Media } from '@/types'
import {
  User as UserIcon,
  Mail,
  Shield,
  Camera,
  LogOut,
  Lock,
  Trash2,
  ArrowLeft,
  Loader2,
  FileText,
  HardDrive,
  Eye,
  EyeOff,
} from 'lucide-react'
import { formatDate, formatFileSize } from '@/utils'

interface EditFormData {
  name: string
  email: string
  profileImage: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ConfirmDeleteState {
  isOpen: boolean
  confirmed: boolean
}

export const UserProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()

  // Debug: Log user profileImage value
  useEffect(() => {
    console.log('User:', user)
    console.log('ProfileImage value:', user?.profileImage)
    console.log('ProfileImage truthy:', !!user?.profileImage)
    console.log('ProfileImage trimmed:', user?.profileImage?.trim())
  }, [user])

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<ConfirmDeleteState>({
      isOpen: false,
      confirmed: false,
    })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  // Form data
  const [editForm, setEditForm] = useState<EditFormData>({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || '',
  })

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Fetch user media for statistics
  useEffect(() => {
    if (user) {
      fetchUserMedia()
    }
  }, [user])

  const fetchUserMedia = async () => {
    try {
      const media = await getUserMedia(1, 100)
      setMediaList(media || [])
    } catch (err) {
      console.error('Error fetching media:', err)
      setMediaList([])
    }
  }

  // Calculate statistics
  const calculateStorageUsed = () => {
    const totalBytes = mediaList.reduce((sum, m) => sum + (m.fileSize || 0), 0)
    return formatFileSize(totalBytes)
  }

  const stats = {
    totalUploads: mediaList.length,
    publicCount: mediaList.filter((m) => m.isPublic).length,
    privateCount: mediaList.filter((m) => !m.isPublic).length,
    sharedCount: mediaList.filter(
      (m) => m.sharedWith && m.sharedWith.length > 0
    ).length,
    storageUsed: calculateStorageUsed(),
  }

  const calculateMemberDuration = (): string => {
    if (!user?.createdAt) return 'N/A'
    const created = new Date(user.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 1) return 'Less than a day'
    if (diffDays === 1) return '1 day'
    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} year${
      Math.floor(diffDays / 365) > 1 ? 's' : ''
    }`
  }

  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  // Validate edit form
  const validateEditForm = (): boolean => {
    if (!editForm.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!editForm.email.trim()) {
      setError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.email)) {
      setError('Invalid email format')
      return false
    }
    return true
  }

  // Validate password form
  const validatePasswordForm = (): boolean => {
    if (!passwordForm.currentPassword) {
      setError('Current password is required')
      return false
    }
    if (!passwordForm.newPassword) {
      setError('New password is required')
      return false
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!validateEditForm()) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await api.put('/users/profile', {
        name: editForm.name,
        email: editForm.email,
        profileImage: editForm.profileImage,
      })

      if (response.data.success) {
        const updatedUser = response.data.data.user
        updateUser(updatedUser)
        setIsEditing(false)
        setSuccessMessage('Profile updated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg =
        error?.response?.data?.message ||
        'Failed to update profile. Please try again.'
      setError(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      if (response.data.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setShowPasswordModal(false)
        setSuccessMessage('Password changed successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg =
        error?.response?.data?.message ||
        'Failed to change password. Please try again.'
      setError(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm.confirmed) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await api.delete('/users/profile')

      if (response.data.success) {
        logout()
        navigate('/login')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg =
        error?.response?.data?.message ||
        'Failed to delete account. Please try again.'
      setError(errorMsg)
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-100 hover:text-cyan-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-cyan-400" />
                Profile
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Image */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white overflow-hidden">
                  {user?.profileImage && user.profileImage.trim() ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.log('Image failed to load')
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-white drop-shadow-lg">
                        {user.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((n) => n.charAt(0).toUpperCase())
                          .join('')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-semibold mb-1">
                  Full Name
                </span>
                <span className="text-white font-medium">{user.name}</span>
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </span>
                <span className="text-white font-medium text-sm break-all">
                  {user.email}
                </span>
              </div>

              {/* Role */}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Role
                </span>
                <span
                  className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </div>

              {/* Member Since */}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-semibold mb-1">
                  Member Since
                </span>
                <div className="space-y-1">
                  <p className="text-white font-medium text-sm">
                    {formatDate(user.createdAt)}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {calculateMemberDuration()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {stats.totalUploads}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Total Uploads</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {stats.privateCount}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Private Files</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {stats.publicCount}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Public Files</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <HardDrive className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-lg font-bold text-white">
                      {stats.storageUsed}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Storage Used</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit Profile Card */}
            {isEditing ? (
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Edit Profile</CardTitle>
                  <CardDescription className="text-slate-400">
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      placeholder="Your full name"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="your@email.com"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Profile Image URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="profileImage" className="text-slate-300">
                      Profile Image URL
                    </Label>
                    <Input
                      id="profileImage"
                      name="profileImage"
                      type="url"
                      value={editForm.profileImage}
                      onChange={handleEditChange}
                      placeholder="https://example.com/image.jpg"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    {editForm.profileImage && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs text-slate-400">Preview:</span>
                        <img
                          src={editForm.profileImage}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border border-slate-600"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          name: user.name,
                          email: user.email,
                          profileImage: user.profileImage || '',
                        })
                        setError(null)
                      }}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-slate-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Account Actions</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => {
                      setIsEditing(true)
                      setError(null)
                    }}
                    className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>

                  <Button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>

                  <Button
                    onClick={handleLogout}
                    className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>

                  <Button
                    onClick={() =>
                      setShowDeleteConfirm({
                        isOpen: true,
                        confirmed: false,
                      })
                    }
                    className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Change Password
              </CardTitle>
              <CardDescription className="text-slate-400">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-300">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPasswordFields ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPasswordFields ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-300">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswordFields ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 6 characters)"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswordFields ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="flex-1 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setError(null)
                    setShowPasswordFields(false)
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-slate-200"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-red-600/30 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </CardTitle>
              <CardDescription className="text-slate-400">
                This action cannot be undone. All your data will be permanently
                deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-300">
                  <strong>Warning:</strong> Deleting your account will:
                </p>
                <ul className="list-disc list-inside text-xs text-red-300 mt-2 space-y-1">
                  <li>Permanently delete all your media files</li>
                  <li>Remove all shared content</li>
                  <li>Delete all your contacts and messages</li>
                  <li>Cannot be recovered</li>
                </ul>
              </div>

              {!showDeleteConfirm.confirmed ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Type <strong className="text-red-300">"DELETE"</strong> to
                    confirm:
                  </p>
                  <Input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    onChange={(e) => {
                      setShowDeleteConfirm({
                        isOpen: true,
                        confirmed: e.target.value === 'DELETE',
                      })
                    }}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-sm text-red-300">
                    ✓ Ready to delete. Click the button below to confirm.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={!showDeleteConfirm.confirmed || isSaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Permanently Delete'
                  )}
                </Button>
                <Button
                  onClick={() =>
                    setShowDeleteConfirm({
                      isOpen: false,
                      confirmed: false,
                    })
                  }
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-slate-200"
                >
                  Cancel
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
