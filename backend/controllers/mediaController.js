const Media = require('../models/Media')
const User = require('../models/User')
const { deleteUploadedFile, getFileStats } = require('../utils/upload')
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getThumbnailUrl,
} = require('../utils/cloudinary')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

/**
 * Upload media endpoint
 * POST /api/media/upload
 */
const uploadMedia = async (req, res) => {
  try {
    const { title, description, tags, isPublic } = req.body
    const file = req.file

    // Validation
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided.',
      })
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title for the media.',
      })
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadBufferToCloudinary(
      file.buffer,
      file.originalname,
      {
        resource_type: 'auto',
      }
    )

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        success: false,
        message: cloudinaryResult.message,
      })
    }

    // Create media document
    const media = new Media({
      userId: req.user.id,
      title,
      description: description || '',
      tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
      imageUrl: cloudinaryResult.data.url,
      fileSize: file.size,
      isPublic: isPublic === 'true' || isPublic === true,
    })

    // Save media to database
    await media.save()
    await media.populate('userId sharedWith')

    return res.status(201).json({
      success: true,
      message: 'Media uploaded successfully.',
      data: {
        media,
        thumbnail: getThumbnailUrl(cloudinaryResult.data.publicId),
      },
    })
  } catch (error) {
    console.error('Upload media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Media upload failed.',
      error: error.message,
    })
  }
}

/**
 * Get user's media with pagination
 * GET /api/media/my-media?page=1&limit=10
 */
const getUserMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Get total count
    const total = await Media.countDocuments({ userId: req.user.id })

    // Get paginated media
    const media = await Media.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return res.status(200).json({
      success: true,
      data: {
        media,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Get user media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user media.',
      error: error.message,
    })
  }
}

/**
 * Get all public media with optional tag filtering
 * GET /api/media/public?tags=nature,landscape&page=1&limit=10
 */
const getPublicMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const tagsQuery = req.query.tags

    // Build query
    let query = { isPublic: true }

    if (tagsQuery) {
      const tags = tagsQuery.split(',').map((tag) => tag.trim().toLowerCase())
      query.tags = { $in: tags }
    }

    // Get total count
    const total = await Media.countDocuments(query)

    // Get paginated media
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return res.status(200).json({
      success: true,
      data: {
        media,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Get public media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public media.',
      error: error.message,
    })
  }
}

/**
 * Get media by ID
 * GET /api/media/:id
 */
const getMediaById = async (req, res) => {
  try {
    const { id } = req.params

    const media = await Media.findById(id)

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      })
    }

    // Check access: owner, admin, or in sharedWith
    const isOwner = media.userId._id.toString() === req.user.id
    const isShared = media.sharedWith.some(
      (userId) => userId._id.toString() === req.user.id
    )
    const isPublic = media.isPublic

    if (!isOwner && !isShared && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this media.',
      })
    }

    return res.status(200).json({
      success: true,
      data: { media },
    })
  } catch (error) {
    console.error('Get media by ID error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch media.',
      error: error.message,
    })
  }
}

/**
 * Update media
 * PUT /api/media/:id
 */
const updateMedia = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, tags, isPublic } = req.body

    const media = await Media.findById(id)

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      })
    }

    // Check ownership
    if (media.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own media.',
      })
    }

    // Update fields
    if (title) media.title = title
    if (description !== undefined) media.description = description
    if (tags) media.tags = tags.split(',').map((tag) => tag.trim())
    if (isPublic !== undefined)
      media.isPublic = isPublic === 'true' || isPublic === true

    await media.save()
    await media.populate('userId sharedWith')

    return res.status(200).json({
      success: true,
      message: 'Media updated successfully.',
      data: { media },
    })
  } catch (error) {
    console.error('Update media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update media.',
      error: error.message,
    })
  }
}

/**
 * Delete media
 * DELETE /api/media/:id
 */
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params

    const media = await Media.findById(id)

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      })
    }

    // Check ownership
    if (media.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own media.',
      })
    }

    // Delete from Cloudinary
    if (media.imageUrl) {
      // Extract public_id from URL or use stored value
      // Cloudinary URLs typically contain the public_id
      await deleteFromCloudinary(media._id.toString())
    }

    // Delete from database
    await Media.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully.',
    })
  } catch (error) {
    console.error('Delete media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete media.',
      error: error.message,
    })
  }
}

/**
 * Search media by title and tags
 * GET /api/media/search?q=sunset&tags=nature&public=true&page=1&limit=10
 */
const searchMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const { q, tags, public: isPublicParam } = req.query

    // Build query
    let query = {}

    // Search by title
    if (q) {
      query.title = { $regex: q, $options: 'i' }
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim().toLowerCase())
      query.tags = { $in: tagArray }
    }

    // Filter by public/private
    if (isPublicParam !== undefined) {
      query.isPublic = isPublicParam === 'true'
    }

    // Only show public media or user's own media
    if (!isPublicParam || isPublicParam === 'false') {
      query.$or = [
        { userId: req.user.id },
        { sharedWith: req.user.id },
        { isPublic: true },
      ]
    }

    // Get total count
    const total = await Media.countDocuments(query)

    // Get paginated results
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return res.status(200).json({
      success: true,
      data: {
        media,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Search media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to search media.',
      error: error.message,
    })
  }
}

/**
 * Share media with other users
 * PUT /api/media/:id/share
 */
const shareMedia = async (req, res) => {
  try {
    const { id } = req.params
    const { userIds } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to share with.',
      })
    }

    const media = await Media.findById(id)

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      })
    }

    // Check ownership
    if (media.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only share your own media.',
      })
    }

    // Add users to sharedWith (avoid duplicates)
    const newUserIds = userIds.filter(
      (userId) => !media.sharedWith.some((id) => id.toString() === userId)
    )

    media.sharedWith.push(...newUserIds)
    await media.save()
    await media.populate('userId sharedWith')

    return res.status(200).json({
      success: true,
      message: 'Media shared successfully.',
      data: { media },
    })
  } catch (error) {
    console.error('Share media error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to share media.',
      error: error.message,
    })
  }
}

/**
 * Download multiple media files as ZIP
 * POST /api/media/download-zip
 */
const downloadMediaZip = async (req, res) => {
  try {
    const { mediaIds } = req.body

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of media IDs to download.',
      })
    }

    // Find all media
    const mediaList = await Media.find({ _id: { $in: mediaIds } })

    if (mediaList.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No media found with the provided IDs.',
      })
    }

    // Check access to all media
    for (const media of mediaList) {
      const isOwner = media.userId.toString() === req.user.id
      const isShared = media.sharedWith.some(
        (userId) => userId.toString() === req.user.id
      )
      const isPublic = media.isPublic

      if (!isOwner && !isShared && !isPublic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to one or more media files.',
        })
      }
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      return res.status(500).json({
        success: false,
        message: 'Failed to create ZIP file.',
        error: err.message,
      })
    })

    // Set response headers
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="media-${Date.now()}.zip"`
    )

    // Pipe archive to response
    archive.pipe(res)

    // Add files to archive
    for (const media of mediaList) {
      // For Cloudinary URLs, we would need to download them first
      // For now, just append the URL as a text file reference
      archive.append(media.imageUrl, { name: `${media.title}-url.txt` })
    }

    // Finalize archive
    await archive.finalize()
  } catch (error) {
    console.error('Download ZIP error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to download media as ZIP.',
      error: error.message,
    })
  }
}

module.exports = {
  uploadMedia,
  getUserMedia,
  getPublicMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  searchMedia,
  shareMedia,
  downloadMediaZip,
}
