import express from 'express'
import {
  getUserProfile,
  updateUserProfile,
  getUserById,
  getAllUsers,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
} from '../controllers/userController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js'

const router = express.Router()

/**
 * Admin Routes (Authentication + Admin role required)
 * Must be defined BEFORE /:id route to avoid matching conflicts
 */

/**
 * GET /api/users/admin
 * Get all users with pagination and filtering
 * Query params: page, limit, role, isActive
 * Admin only
 */
router.get('/admin', authMiddleware, roleMiddleware('admin'), getAllUsers)

/**
 * Protected Routes (Authentication required)
 */

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
router.get('/profile', authMiddleware, getUserProfile)

/**
 * PUT /api/users/profile
 * Update authenticated user's profile
 * Can update: name, email, profileImage
 */
router.put('/profile', authMiddleware, updateUserProfile)

/**
 * GET /api/users/:id
 * Get user by ID
 * Returns public data or full data if admin or self
 */
router.get('/:id', getUserById)

/**
 * PUT /api/users/:id
 * Update user details (name, email, role, isActive)
 * Admin only
 */
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateUser)

/**
 * DELETE /api/users/:id
 * Soft delete user (deactivate without losing data)
 * Admin only
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin'), softDeleteUser)

/**
 * DELETE /api/users/:id/permanent
 * Hard delete user (permanently delete user and all associated data)
 * Requires confirmation: { confirmation: "DELETE" }
 * Admin only
 */
router.delete(
  '/:id/permanent',
  authMiddleware,
  roleMiddleware('admin'),
  hardDeleteUser
)

export default router
