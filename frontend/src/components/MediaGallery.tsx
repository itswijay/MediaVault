import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MediaCard } from '@/components/MediaCard'
import { Search, Loader2, AlertCircle, Grid3x3, List } from 'lucide-react'
import type { Media } from '@/types'
import {
  getUserMedia,
  deleteMedia,
  getPublicMedia,
} from '@/services/mediaService'

interface MediaGalleryProps {
  isPublicGallery?: boolean
  refreshTrigger?: number
}

interface FilterState {
  searchQuery: string
  selectedTags: string[]
  isPublicFilter: boolean | null
  viewMode: 'grid' | 'list'
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  isPublicGallery = false,
  refreshTrigger,
}) => {
  const navigate = useNavigate()
  // State
  const [allMedia, setAllMedia] = useState<Media[]>([])
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [allTags, setAllTags] = useState<string[]>([])
  const itemsPerPage = 12

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedTags: [],
    isPublicFilter: isPublicGallery ? true : null,
    viewMode: 'grid',
  })

  // Fetch media on component mount and when triggers change
  useEffect(() => {
    fetchMedia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, isPublicGallery])

  // Apply filters whenever media or filters change
  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMedia, filters])

  // Fetch media from API
  const fetchMedia = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let media: Media[] = []
      if (isPublicGallery) {
        media = (await getPublicMedia(1, 1000)) || []
      } else {
        media = (await getUserMedia(1, 1000)) || []
      }

      setAllMedia(media)

      // Extract unique tags
      const tags = new Set<string>()
      media.forEach((m) => {
        if (m.tags && Array.isArray(m.tags)) {
          m.tags.forEach((tag) => tags.add(tag))
        }
      })
      setAllTags(Array.from(tags).sort())
    } catch (err) {
      console.error('Error fetching media:', err)
      setError('Failed to load media. Please try again.')
      setAllMedia([])
    } finally {
      setIsLoading(false)
    }
  }

  // Apply all filters to media
  const applyFilters = () => {
    let filtered = [...allMedia]

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      )
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter((m) =>
        filters.selectedTags.some((tag) => m.tags && m.tags.includes(tag))
      )
    }

    // Public/Private filter
    if (filters.isPublicFilter !== null) {
      filtered = filtered.filter((m) => m.isPublic === filters.isPublicFilter)
    }

    setFilteredMedia(filtered)
    const pages = Math.ceil(filtered.length / itemsPerPage)
    setTotalPages(Math.max(1, pages))
    setCurrentPage(1)
  }

  // Get paginated media for current page
  const getPaginatedMedia = () => {
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    return filteredMedia.slice(startIdx, endIdx)
  }

  // Handle media deletion
  const handleDeleteMedia = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return
    }

    try {
      setIsDeleting(id)
      const success = await deleteMedia(id)

      if (success) {
        setAllMedia((prev) =>
          prev.filter((m) => {
            const mediaId = m._id || m.id
            return mediaId !== id
          })
        )
      } else {
        setError('Failed to delete media')
      }
    } catch (err) {
      console.error('Error deleting media:', err)
      setError('Failed to delete media')
    } finally {
      setIsDeleting(null)
    }
  }

  // Handle view action
  const handleViewMedia = (id: string) => {
    navigate(`/media/${id}`)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: e.target.value,
    }))
  }

  // Toggle tag filter
  const handleToggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }))
  }

  // Toggle public/private filter
  const handleTogglePublicFilter = () => {
    setFilters((prev) => ({
      ...prev,
      isPublicFilter:
        prev.isPublicFilter === null
          ? true
          : prev.isPublicFilter
          ? false
          : null,
    }))
  }

  // Clear all filters
  const handleClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: '',
      selectedTags: [],
      isPublicFilter: isPublicGallery ? true : null,
    }))
  }

  // Toggle view mode
  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setFilters((prev) => ({
      ...prev,
      viewMode: mode,
    }))
  }

  const paginatedMedia = getPaginatedMedia()
  const hasFiltersApplied =
    filters.searchQuery.trim() !== '' ||
    filters.selectedTags.length > 0 ||
    (filters.isPublicFilter !== null && !isPublicGallery)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isPublicGallery ? 'Public Gallery' : 'My Gallery'}
          </h1>
          <p className="text-slate-400 mt-1">
            {filteredMedia.length} media item
            {filteredMedia.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filters.viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggleViewMode('grid')}
            className="gap-2"
          >
            <Grid3x3 className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={filters.viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggleViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-slate-700 bg-slate-800/50 p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Public/Private Filter */}
            {!isPublicGallery && (
              <Button
                variant={
                  filters.isPublicFilter === null
                    ? 'outline'
                    : filters.isPublicFilter
                    ? 'default'
                    : 'secondary'
                }
                size="sm"
                onClick={handleTogglePublicFilter}
              >
                {filters.isPublicFilter === null
                  ? 'All Media'
                  : filters.isPublicFilter
                  ? 'Public'
                  : 'Private'}
              </Button>
            )}

            {/* Clear Filters Button */}
            {hasFiltersApplied && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-slate-300 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">
                Filter by tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={
                      filters.selectedTags.includes(tag) ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleToggleTag(tag)}
                    className="text-xs h-8 rounded-full"
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-2" />
            <p className="text-slate-400">Loading media...</p>
          </div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">
            {allMedia.length === 0
              ? 'No media uploaded yet'
              : 'No media matches your filters'}
          </p>
          {hasFiltersApplied && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Media Grid or List View */}
          <div
            className={
              filters.viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3'
            }
          >
            {paginatedMedia.map((media) => (
              <MediaCard
                key={media._id || media.id}
                media={media}
                onView={handleViewMedia}
                onDelete={handleDeleteMedia}
                isLoading={isDeleting === (media._id || media.id)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredMedia.length)} of{' '}
                {filteredMedia.length} items
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    const isNearCurrent = Math.abs(pageNum - currentPage) <= 1
                    const isFirstOrLast =
                      pageNum === 1 || pageNum === totalPages

                    if (isNearCurrent || isFirstOrLast) {
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    } else if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span
                          key={pageNum}
                          className="w-8 h-8 flex items-center justify-center text-slate-400"
                        >
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Load More Alternative */}
          {totalPages > 1 && currentPage < totalPages && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
