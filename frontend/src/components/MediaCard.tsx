import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Media } from '@/types'
import { Globe, Lock, Trash2, Eye } from 'lucide-react'

interface MediaCardProps {
  media: Media
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  isLoading?: boolean
}

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onDelete,
  onView,
  isLoading,
}) => {
  const mediaId = (media._id || media.id) as string
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur overflow-hidden group transition-all duration-300 hover:border-cyan-500/50">
      {/* Image Container */}
      <div className="relative h-48 bg-slate-700/50 overflow-hidden cursor-pointer group">
        <img
          src={media.imageUrl}
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onClick={() => mediaId && onView?.(mediaId)}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          {onView && mediaId && (
            <button
              onClick={() => onView(mediaId)}
              className="p-2 rounded-lg bg-cyan-500/80 hover:bg-cyan-600 text-white transition-colors"
              title="View media"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {onDelete && mediaId && (
            <button
              onClick={() => onDelete(mediaId)}
              disabled={isLoading}
              className="p-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              title="Delete media"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Badge */}
        <div className="absolute top-2 right-2 flex gap-1">
          {media.isPublic ? (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium">
              <Globe className="w-3 h-3" />
              Public
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/90 text-white text-xs font-medium">
              <Lock className="w-3 h-3" />
              Private
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {media.title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Description */}
        {media.description && (
          <p className="text-xs text-slate-400 line-clamp-2">
            {media.description}
          </p>
        )}

        {/* Tags */}
        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {media.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded"
              >
                #{tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs text-slate-400">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-400">
            {formatDate(media.createdAt)}
          </span>
          <span className="text-xs text-slate-400">
            {formatFileSize(media.fileSize)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
