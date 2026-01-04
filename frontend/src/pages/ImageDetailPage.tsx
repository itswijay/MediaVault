import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShareModal } from '@/components/ShareModal'
import { Footer } from '@/components/Footer'
import {
  getMediaById,
  deleteMedia,
  getUserMedia,
  updateMedia,
} from '@/services/mediaService'
import type { Media } from '@/types'
import {
  Download,
  Trash2,
  Share2,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowLeft,
  LogOut,
  Globe,
  Lock,
  Calendar,
  HardDrive,
  User,
  X,
} from 'lucide-react'
import logoImg from '../assets/mediavault.png'

export const ImageDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // State
  const [media, setMedia] = useState<Media | null>(null)
  const [allMedia, setAllMedia] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    tags: '',
    isPublic: false,
  })

  // Fetch media
  useEffect(() => {
    console.log('ImageDetailPage mounted, id:', id)
    if (!id) {
      console.log('No ID provided')
      setError('Media ID not found')
      return
    }
    const loadMedia = async () => {
      try {
        console.log('Fetching media with ID:', id)
        setIsLoading(true)
        setError(null)

        // Fetch current media
        const currentMedia = await getMediaById(id)
        console.log('Fetched media:', currentMedia)

        // Unwrap if the response is nested (API might return { media: {...} })
        const mediaData =
          (
            currentMedia as {
              media?: typeof currentMedia
            } & typeof currentMedia
          )?.media || currentMedia
        console.log('Unwrapped media:', mediaData)

        if (!mediaData) {
          console.log('Media not found')
          setError('Media not found')
          setMedia(null)
          return
        }
        console.log('Media data before setState:', {
          id: mediaData._id || mediaData.id,
          title: mediaData.title,
          hasImageUrl: !!mediaData.imageUrl,
          imageUrl: mediaData.imageUrl,
        })
        setMedia(mediaData)
        console.log('State set, media:', mediaData)

        // Fetch all media for navigation
        const allUserMedia = await getUserMedia(1, 1000)
        console.log('Fetched all media:', allUserMedia?.length)
        setAllMedia(allUserMedia || [])
      } catch (err) {
        console.error('Error fetching media:', err)
        setError(
          `Failed to load media: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        )
      } finally {
        setIsLoading(false)
      }
    }
    loadMedia()
  }, [id])

  // Debug effect to track media state changes
  useEffect(() => {
    console.log('Media state changed:', {
      hasMedia: !!media,
      hasImageUrl: !!media?.imageUrl,
      imageUrl: media?.imageUrl,
      fullMedia: media,
    })
  }, [media])

  // Format utilities
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Helper to get userId string
  const getUserId = (
    id:
      | string
      | { _id: string; name: string; email: string; profileImage: string }
  ): string => {
    return typeof id === 'string' ? id : id._id
  }

  // Helper to get user name
  const getUserName = (
    id:
      | string
      | { _id: string; name: string; email: string; profileImage: string }
  ): string => {
    return typeof id === 'string' ? id : id.name
  }

  // Navigation
  const currentIndex = allMedia.findIndex(
    (m) => (m._id || m.id) === (media?._id || media?.id)
  )
  const hasNext = currentIndex !== -1 && currentIndex < allMedia.length - 1
  const hasPrev = currentIndex > 0

  const handlePrevious = () => {
    if (hasPrev && currentIndex !== -1) {
      const prevMedia = allMedia[currentIndex - 1]
      navigate(`/media/${prevMedia._id || prevMedia.id}`)
    }
  }

  const handleNext = () => {
    if (hasNext && currentIndex !== -1) {
      const nextMedia = allMedia[currentIndex + 1]
      navigate(`/media/${nextMedia._id || nextMedia.id}`)
    }
  }

  // Actions
  const handleDownload = async () => {
    if (!media) return
    try {
      setIsLoading(true)
      const response = await fetch(media.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${media.title}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading:', err)
      setError('Failed to download media')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !media ||
      !window.confirm('Are you sure you want to delete this media?')
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const success = await deleteMedia(media._id || media.id || '')
      if (success) {
        navigate('/gallery')
      } else {
        setError('Failed to delete media')
      }
    } catch (err) {
      console.error('Error deleting media:', err)
      setError('Failed to delete media')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    if (!media) return
    setEditData({
      title: media.title,
      description: media.description || '',
      tags: media.tags ? media.tags.join(', ') : '',
      isPublic: media.isPublic,
    })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!media || !editData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setIsLoading(true)

      // Parse tags from comma-separated string to array
      const tagsList = editData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const updated = await updateMedia(media._id || media.id || '', {
        title: editData.title,
        description: editData.description,
        tags: tagsList,
        isPublic: editData.isPublic,
      })

      // Unwrap the response if it's nested
      const mediaData =
        (
          updated as {
            media?: typeof updated
          } & typeof updated
        )?.media || updated

      setMedia(mediaData)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      console.error('Error updating media:', err)
      setError('Failed to update media')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isOwner = user && media && user.id === getUserId(media.userId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-2" />
          <p className="text-slate-400">Loading media...</p>
        </div>
      </div>
    )
  }

  if (error || !media) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/gallery')}
              >
                <img src={logoImg} alt="MediaVault" className="h-8 w-8" />
                <span className="font-bold text-white hidden sm:inline">
                  MediaVault
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/gallery')}
                  className="text-slate-300 hover:text-white gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Gallery</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 gap-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-400">{error || 'Media not found'}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar - Hide when fullscreen */}
      {!isFullscreen && (
        <nav className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/gallery')}
              >
                <img src={logoImg} alt="MediaVault" className="h-8 w-8" />
                <span className="font-bold text-white hidden sm:inline">
                  MediaVault
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/gallery')}
                  className="text-slate-300 hover:text-white gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white font-extrabold hover:text-red-300 gap-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 bg-black p-4 flex flex-col items-center justify-center'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
        }
      >
        {/* Error Message */}
        {error && !isFullscreen && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        )}

        <div
          className={
            isFullscreen
              ? 'w-full h-full'
              : 'grid grid-cols-1 lg:grid-cols-3 gap-6'
          }
        >
          {/* Image Section */}
          <div className={isFullscreen ? 'w-full h-full' : 'lg:col-span-2'}>
            {(() => {
              console.log('Rendering image section:', {
                media,
                hasImageUrl: !!media?.imageUrl,
              })
              return null
            })()}
            {/* Image Container */}
            <div
              className={`relative bg-black rounded-lg overflow-hidden w-full ${
                isFullscreen ? 'h-full' : 'aspect-square'
              }`}
            >
              {media && media.imageUrl ? (
                <img
                  src={media.imageUrl}
                  alt={media.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <p>Image not available</p>
                </div>
              )}

              {/* Close Fullscreen Button */}
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                  title="Exit fullscreen"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Fullscreen Button */}
              {!isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                  title="Toggle fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              )}

              {/* Image Navigation */}
              {!isFullscreen && allMedia.length > 1 && (
                <>
                  {hasPrev && (
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {hasNext && (
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                      title="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </>
              )}

              {/* Image Navigation Fullscreen */}
              {isFullscreen && allMedia.length > 1 && (
                <>
                  {hasPrev && (
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {hasNext && (
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                      title="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </>
              )}

              {/* Image Counter */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                  {currentIndex + 1} / {allMedia.length}
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section - Hidden in fullscreen */}
          {!isFullscreen && media && (
            <div className="space-y-4">
              {/* Title and Description */}
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardContent className="pt-6 space-y-4">
                  {/* Title */}
                  <div>
                    <h1 className="text-2xl font-bold text-white word-break">
                      {media.title}
                    </h1>
                  </div>

                  {/* Description */}
                  {media.description && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Description</p>
                      <p className="text-slate-300 text-sm word-break">
                        {media.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {media.tags && media.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {media.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata Card */}
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                <CardContent className="pt-6 space-y-3">
                  {/* Visibility */}
                  <div className="flex items-center gap-3 p-2">
                    {media.isPublic ? (
                      <>
                        <Globe className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-slate-300">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-slate-300">Private</span>
                      </>
                    )}
                  </div>

                  {/* Upload Date */}
                  <div className="flex items-center gap-3 p-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {formatDate(media.createdAt)}
                    </span>
                  </div>

                  {/* File Size */}
                  <div className="flex items-center gap-3 p-2">
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {formatFileSize(media.fileSize)}
                    </span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-3 p-2 border-t border-slate-700 pt-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {isOwner
                        ? 'Your media'
                        : `Owned by ${getUserName(media.userId)}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {isOwner && (
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardContent className="pt-6 space-y-2">
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      className="w-full"
                    >
                      Edit Media
                    </Button>
                    <Button
                      onClick={() => setIsShareModalOpen(true)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full bg-red-500/80 hover:bg-red-600 text-white gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Non-owner Actions */}
              {!isOwner && (
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardContent className="pt-6 space-y-2">
                    <Button
                      onClick={handleDownload}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Shared With Info */}
              {media.sharedWith && media.sharedWith.length > 0 && (
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-400 mb-3">
                      Shared with {media.sharedWith.length} user(s)
                    </p>
                    <div className="space-y-2">
                      {media.sharedWith.map((userId) => (
                        <div
                          key={getUserId(userId)}
                          className="p-2 bg-slate-700/50 rounded text-sm text-slate-300"
                        >
                          {getUserName(userId)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        mediaId={media._id || media.id || ''}
        mediaTitle={media.title}
      />

      {/* Edit Modal */}
      {isEditing && media && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-slate-700 bg-slate-800">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Edit Media
                </h3>

                {/* Title Input */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="edit-title" className="text-slate-300">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    placeholder="Media title"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="edit-description" className="text-slate-300">
                    Description
                  </Label>
                  <textarea
                    id="edit-description"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="Media description"
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 rounded-md p-2 resize-none"
                    rows={3}
                  />
                </div>

                {/* Tags Input */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="edit-tags" className="text-slate-300">
                    Tags
                  </Label>
                  <Input
                    id="edit-tags"
                    value={editData.tags}
                    onChange={(e) =>
                      setEditData({ ...editData, tags: e.target.value })
                    }
                    placeholder="Comma-separated tags (e.g., nature, sunset, landscape)"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400">
                    Separate tags with commas
                  </p>
                </div>

                {/* Public Toggle */}
                <div className="space-y-2 mb-6">
                  <Label className="text-slate-300 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.isPublic}
                      onChange={(e) =>
                        setEditData({ ...editData, isPublic: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span>Make this media public</span>
                  </Label>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    Cancel
                  </Button>
                </div>
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
