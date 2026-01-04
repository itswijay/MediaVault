import React, { useRef, useState } from 'react'
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'

interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in bytes
  disabled?: boolean
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFileSelect,
  accept = 'image/jpeg,image/png',
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file type
    const acceptedTypes = accept.split(',')
    if (!acceptedTypes.some((type) => file.type === type.trim())) {
      setError(
        `Invalid file type. Accepted types: ${accept.split(',').join(', ')}`
      )
      return false
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
      setError(`File size must be less than ${maxSizeMB}MB`)
      return false
    }

    return true
  }

  const handleFileChange = (file: File) => {
    if (validateFile(file)) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setFileName(file.name)
      onFileSelect(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileChange(files[0])
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Dropzone or Preview */}
      {preview && fileName ? (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative w-full h-64 bg-slate-700/50 rounded-lg overflow-hidden border-2 border-cyan-500/50">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleClearFile}
              className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
              title="Clear file"
            >
              ✕
            </button>
          </div>

          {/* File Info */}
          <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {fileName}
              </p>
              <p className="text-xs text-slate-400">
                {(fileInputRef.current?.files?.[0]?.size || 0) > 0
                  ? `${(
                      (fileInputRef.current?.files?.[0]?.size || 0) / 1024
                    ).toFixed(2)} KB`
                  : 'Ready to upload'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full p-8 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-slate-700/20 border-slate-600'
              : isDragging
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-slate-600 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-cyan-500/5'
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`p-3 rounded-lg mb-3 ${
                isDragging ? 'bg-cyan-500/20' : 'bg-slate-700/50'
              }`}
            >
              {isDragging ? (
                <Upload className="w-8 h-8 text-cyan-400" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {isDragging
                ? 'Drop your image here'
                : 'Drag and drop your image here'}
            </p>
            <p className="text-xs text-slate-400 mb-3">or</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
              disabled={disabled}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Browse Files
            </button>
            <p className="text-xs text-slate-500 mt-3">
              JPG or PNG, max {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
