import express from 'express'
import {
  uploadMedia,
  getUserMedia,
  getPublicMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  searchMedia,
  shareMedia,
  downloadMediaZip,
} from '../controllers/mediaController.js'
import { authMiddleware, optionalAuth } from '../middlewares/auth.js'
import { uploadSingle, handleUploadErrors } from '../utils/upload.js'

const router = express.Router()

/**
 * Public Routes (No authentication required)
 */

/**
 * GET /api/media/public
 * Get all public media with optional tag filtering
 */
router.get('/public', getPublicMedia)

/**
 * GET /api/media/search
 * Search media by title and tags
 */
router.get('/search', optionalAuth, searchMedia)

/**
 * Protected Routes (Authentication required)
 */

/**
 * POST /api/media/upload
 * Upload new media file with metadata
 * Requires: file (multipart/form-data), title, optional: description, tags, isPublic
 */
router.post(
  '/upload',
  authMiddleware,
  uploadSingle,
  handleUploadErrors,
  uploadMedia
)

/**
 * GET /api/media/my-media
 * Get authenticated user's media with pagination
 */
router.get('/my-media', authMiddleware, getUserMedia)

/**
 * GET /api/media/:id
 * Get media by ID with access verification
 */
router.get('/:id', optionalAuth, getMediaById)

/**
 * PUT /api/media/:id
 * Update media metadata (title, description, tags, visibility)
 * Only owner can update
 */
router.put('/:id', authMiddleware, updateMedia)

/**
 * DELETE /api/media/:id
 * Delete media from database and storage
 * Only owner can delete
 */
router.delete('/:id', authMiddleware, deleteMedia)

/**
 * PUT /api/media/:id/share
 * Share media with other users
 * Only owner can share
 */
router.put('/:id/share', authMiddleware, shareMedia)

/**
 * POST /api/media/:id/share
 * Share media with other users (alternative POST method)
 * Only owner can share
 */
router.post('/:id/share', authMiddleware, shareMedia)

/**
 * POST /api/media/download-zip
 * Download multiple media files as ZIP archive
 * User must have access to all media files
 */
router.post('/download-zip', authMiddleware, downloadMediaZip)

export default router
