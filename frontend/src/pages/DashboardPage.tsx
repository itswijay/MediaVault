import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatCard } from '@/components/StatCard'
import { MediaCard } from '@/components/MediaCard'
import { Footer } from '@/components/Footer'
import { getUserMedia } from '@/services/mediaService'
import type { Media } from '@/types'
import {
  LogOut,
  User,
  Mail,
  Shield,
  HardDrive,
  FileText,
  Lock,
  Share2,
  Upload,
  Loader2,
  ChevronRight,
  Camera,
} from 'lucide-react'
import logoImg from '../assets/mediavault.png'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  // State
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch media
  useEffect(() => {
    if (isAuthenticated) {
      fetchMedia()
    }
  }, [isAuthenticated])

  const fetchMedia = async () => {
    try {
      setIsLoadingMedia(true)
      setError(null)
      const media = await getUserMedia(1, 100)
      setMediaList(media || [])
    } catch (err) {
      console.error('Error fetching media:', err)
      setError('Failed to load media data')
      setMediaList([])
    } finally {
      setIsLoadingMedia(false)
    }
  }

  // Calculate statistics
  const calculateStorageUsed = () => {
    const totalBytes = mediaList.reduce((sum, m) => sum + (m.fileSize || 0), 0)
    const mb = totalBytes / (1024 * 1024)
    const gb = mb / 1024

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`
    } else if (mb >= 1) {
      return `${mb.toFixed(2)} MB`
    } else {
      return `${(totalBytes / 1024).toFixed(2)} KB`
    }
  }

  const stats = {
    totalUploads: mediaList.length,
    publicCount: mediaList.filter((m) => m.isPublic).length,
    privateCount: mediaList.filter((m) => !m.isPublic).length,
    storageUsed: calculateStorageUsed(),
  }

  // Get recent uploads (last 5, sorted by date)
  const recentUploads = [...mediaList]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  // Get shared media
  const sharedMedia = mediaList
    .filter((m) => m.sharedWith && m.sharedWith.length > 0)
    .slice(0, 3)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteMedia = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      try {
        setMediaList((prev) => prev.filter((m) => (m._id || m.id) !== id))
        // Call delete API here if needed
      } catch (err) {
        console.error('Error deleting media:', err)
        setError('Failed to delete media')
      }
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You need to be logged in to access this page.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-800/50 border-b border-slate-700 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg  from-cyan-500 to-cyan-600">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <img
                src={logoImg}
                alt="MediaVault Logo"
                className="w-20 h-20 mx-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">MediaVault</h1>
          </div>

          <Button
            onClick={handleLogout}
            className="border-slate-600 text-slate-100 hover:bg-slate-700/50 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome, {user.name}!
          </h2>
          <p className="text-slate-400">
            Manage your media files and account on MediaVault
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-500/20 bg-red-500/10">
            <CardContent className="pt-6">
              <p className="text-red-300 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText />}
            title="Total Uploads"
            value={stats.totalUploads}
            subtitle="media files"
            colorClass="cyan"
            onClick={() => navigate('/gallery')}
          />
          <StatCard
            icon={<Lock />}
            title="Private Media"
            value={stats.privateCount}
            subtitle="private files"
            colorClass="blue"
            onClick={() => navigate('/gallery')}
          />
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 7h-1v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-3H4a1 1 0 0 1-1-1v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3a1 1 0 0 1-1 1z" />
              </svg>
            }
            title="Public Media"
            value={stats.publicCount}
            subtitle="shared files"
            colorClass="green"
            onClick={() => navigate('/gallery')}
          />
          <StatCard
            icon={<HardDrive />}
            title="Storage Used"
            value={stats.storageUsed}
            subtitle="Total media storage"
            colorClass="amber"
          />
        </div>

        {/* Profile & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Profile
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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

              {/* Role Badge */}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Role
                </span>
                <span
                  className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {user.role.toUpperCase()}
                </span>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2 pt-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.isActive
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {user.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.isEmailVerified
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {user.isEmailVerified ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-400">
                Get started with your media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/upload')}
                  className="h-11 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Media
                </Button>
                <Button
                  onClick={() => navigate('/gallery')}
                  className="h-11 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  View Gallery
                </Button>
                <Button
                  onClick={() => navigate('/profile')}
                  className="h-11 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => navigate('/gallery')}
                  className="h-11 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Browse All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Uploads Section */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Uploads</CardTitle>
              <CardDescription className="text-slate-400">
                Your last {Math.min(5, recentUploads.length)} uploaded media
              </CardDescription>
            </div>
            {recentUploads.length > 0 && (
              <Button
                onClick={() => navigate('/gallery')}
                variant="ghost"
                className="text-cyan-100 hover:text-cyan-200"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : recentUploads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentUploads.map((media) => (
                  <MediaCard
                    key={media._id || media.id}
                    media={media}
                    onDelete={handleDeleteMedia}
                    onView={() => navigate('/gallery')}
                    isLoading={isLoadingMedia}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-slate-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-white font-semibold mb-2">No media yet</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Upload your first media to get started
                </p>
                <Button
                  onClick={() => navigate('/upload')}
                  className="bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared Media Section */}
        {sharedMedia.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Shared With You</CardTitle>
                <CardDescription className="text-slate-400">
                  Media shared by other users
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate('/gallery')}
                variant="ghost"
                className="text-cyan-100 hover:text-cyan-200"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sharedMedia.map((media) => (
                  <MediaCard
                    key={media._id || media.id}
                    media={media}
                    onView={() => navigate('/gallery')}
                    isLoading={isLoadingMedia}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Verification Alert */}
        {!user.isEmailVerified && (
          <Card className="border-yellow-500/30 bg-yellow-500/10 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl shrink-0">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-300 mb-1">
                    Email Not Verified
                  </h3>
                  <p className="text-yellow-200/80 text-sm mb-4">
                    Please verify your email address to unlock all features.
                    Check your inbox for the verification link.
                  </p>
                  <Button
                    onClick={() => navigate('/verify-email')}
                    className="bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
                  >
                    Verify Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
