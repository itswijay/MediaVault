const express = require('express')
const {
  submitMessage,
  getUserMessages,
  updateMessage,
  deleteMessage,
  getAllMessages,
  adminDeleteMessage,
  markAsRead,
} = require('../controllers/contactController')
const {
  authMiddleware,
  optionalAuth,
  roleMiddleware,
} = require('../middlewares/auth')

const router = express.Router()

/**
 * Public Routes (No authentication required)
 */

/**
 * POST /api/contact
 * Submit a contact message
 * Can be anonymous or authenticated
 */
router.post('/', optionalAuth, submitMessage)

/**
 * Protected Routes (Authentication required)
 */

/**
 * GET /api/contact/mymessages
 * Get authenticated user's contact messages with pagination
 */
router.get('/mymessages', authMiddleware, getUserMessages)

/**
 * PUT /api/contact/:id
 * Update user's own contact message
 * Only owner can update
 */
router.put('/:id', authMiddleware, updateMessage)

/**
 * DELETE /api/contact/:id
 * Delete user's own contact message
 * Only owner can delete
 */
router.delete('/:id', authMiddleware, deleteMessage)

/**
 * Admin Routes (Authentication + Admin role required)
 */

/**
 * GET /api/admin/contact
 * Get all contact messages with pagination and sorting
 * Admin only
 */
router.get('/admin', authMiddleware, roleMiddleware('admin'), getAllMessages)

/**
 * DELETE /api/admin/contact/:id
 * Delete any contact message
 * Admin only
 */
router.delete(
  '/admin/:id',
  authMiddleware,
  roleMiddleware('admin'),
  adminDeleteMessage
)

/**
 * PUT /api/contact/:id/read
 * Mark contact message as read or unread
 * Admin only
 */
router.put('/:id/read', authMiddleware, roleMiddleware('admin'), markAsRead)

module.exports = router
