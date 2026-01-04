import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileUploadDropzone } from '@/components/FileUploadDropzone'
import { Footer } from '@/components/Footer'
import { uploadMedia } from '@/services/mediaService'
import {
  Upload,
  ArrowLeft,
  LogOut,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react'
import logoImg from '../assets/mediavault.png'

interface UploadProgress {
  loaded: number
  total: number
}

export const ImageUploadPage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const abortControllerRef = useRef<AbortController | null>(null)

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form validation
  const isFormValid = selectedFile && title.trim().length > 0

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
  }

  const validateForm = (): boolean => {
    setError(null)

    if (!selectedFile) {
      setError('Please select an image file')
      return false
    }

    if (!title.trim()) {
      setError('Title is required')
      return false
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters')
      return false
    }

    if (title.trim().length > 100) {
      setError('Title must not exceed 100 characters')
      return false
    }

    if (description.trim().length > 500) {
      setError('Description must not exceed 500 characters')
      return false
    }

    return true
  }

  const handleUpload = async () => {
    if (!validateForm()) {
      return
    }

    if (!selectedFile) {
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Create FormData
      const formData = new FormData()
      formData.append('title', title.trim())
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      // Handle tags
      const tagList = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      if (tagList.length > 0) {
        formData.append('tags', JSON.stringify(tagList))
      }

      formData.append('isPublic', String(isPublic))
      formData.append('file', selectedFile)

      // Upload with progress tracking
      abortControllerRef.current = new AbortController()
      const media = await uploadMedia(formData)

      if (media) {
        setSuccess(true)
        // Redirect after short delay to show success message
        setTimeout(() => {
          navigate('/gallery')
        }, 2000)
      } else {
        setError('Failed to upload media. Please try again.')
      }
    } catch (err) {
      console.error('Error uploading media:', err)
      if (err instanceof Error && err.message === 'Aborted') {
        setError('Upload cancelled')
      } else {
        setError('Failed to upload media. Please try again.')
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleCancel = () => {
    if (isUploading) {
      abortControllerRef.current?.abort()
      setIsUploading(false)
      setUploadProgress(null)
      setError('Upload cancelled')
    } else {
      navigate('/gallery')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const progressPercent = uploadProgress
    ? Math.round((uploadProgress.loaded / uploadProgress.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/dashboard')}
            >
              <img src={logoImg} alt="MediaVault" className="h-8 w-8" />
              <span className="font-bold text-white hidden sm:inline">
                MediaVault
              </span>
            </div>

            {/* Navigation Links */}
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
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Upload Media</h1>
          <p className="text-slate-400 mt-2">
            Share your photos and videos with the world
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-green-400 font-medium">Upload successful!</p>
              <p className="text-green-300 text-sm">
                Redirecting to gallery...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Upload Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Choose Image</CardTitle>
                <CardDescription className="text-slate-400">
                  Upload a JPG or PNG image (max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadDropzone
                  onFileSelect={handleFileSelect}
                  accept="image/jpeg,image/png"
                  maxSize={5 * 1024 * 1024}
                  disabled={isUploading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Title *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter image title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    disabled={isUploading}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500">
                    {title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter image description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    disabled={isUploading}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-500">
                    {description.length}/500 characters
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Tags
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter tags (comma-separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isUploading}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500">
                    e.g. nature, landscape, sunset
                  </p>
                </div>

                {/* Public/Private Toggle */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Visibility
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={isUploading}
                      className="w-4 h-4 rounded border-slate-600 text-cyan-500 cursor-pointer"
                    />
                    <label
                      htmlFor="isPublic"
                      className="flex-1 text-sm text-slate-300 cursor-pointer"
                    >
                      Make this image public
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    Public images can be seen by anyone
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <Card className="mt-6 border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">
                    Uploading...
                  </p>
                  <p className="text-sm text-slate-400">{progressPercent}%</p>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-cyan-500 to-cyan-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {uploadProgress.loaded && uploadProgress.total
                    ? `${(uploadProgress.loaded / 1024 / 1024).toFixed(
                        2
                      )}MB / ${(uploadProgress.total / 1024 / 1024).toFixed(
                        2
                      )}MB`
                    : 'Processing...'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 justify-center sm:justify-start">
          <Button
            onClick={handleUpload}
            disabled={!isFormValid || isUploading || success}
            className="gap-2 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Media
              </>
            )}
          </Button>

          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isUploading && !uploadProgress}
            className="gap-2"
          >
            {isUploading ? 'Cancel' : 'Go Back'}
          </Button>
        </div>

        {/* Info Section */}
        <Card className="mt-8 border-slate-700 bg-slate-800/30">
          <CardHeader>
            <CardTitle className="text-white text-base">Upload Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>• Supported formats: JPG, PNG</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Use descriptive titles and tags for better discoverability</p>
            <p>• Private images are only visible to you</p>
            <p>• Public images can be shared and discovered by other users</p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
