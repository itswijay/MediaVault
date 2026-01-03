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
 * Admin Routes (Authentication + Admin role required)
 */

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 * Query params: page, limit, role, isActive
 * Admin only
 */
router.get('/admin', authMiddleware, roleMiddleware('admin'), getAllUsers)

/**
 * PUT /api/admin/users/:id
 * Update user details (name, email, role, isActive)
 * Admin only
 */
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateUser)

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (deactivate without losing data)
 * Admin only
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin'), softDeleteUser)

/**
 * DELETE /api/admin/users/:id/permanent
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