import User from '../models/User.js'
import Media from '../models/Media.js'
import Contact from '../models/Contact.js'

/**
 * Get user profile
 * GET /api/users/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message,
    })
  }
}

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, profileImage } = req.body
    const userId = req.user.userId || req.user.id

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use.',
        })
      }
      user.email = email
    }

    // Update other fields
    if (name) user.name = name
    if (profileImage !== undefined) user.profileImage = profileImage

    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    })
  }
}

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // If requester is admin or the user themselves, return full info
    const isAdmin = req.user && req.user.role === 'admin'
    const isSelf = req.user && req.user.id === id

    if (isAdmin || isSelf) {
      return res.status(200).json({
        success: true,
        data: { user },
      })
    }

    // Otherwise, return only public info
    const publicUser = {
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
      createdAt: user.createdAt,
    }

    return res.status(200).json({
      success: true,
      data: { user: publicUser },
    })
  } catch (error) {
    console.error('Get user by ID error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user.',
      error: error.message,
    })
  }
}

/**
 * Get all users (Admin only)
 * GET /api/admin/users?page=1&limit=10&role=user&isActive=true
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const { role, isActive } = req.query

    // Build query
    let query = {}

    if (role) {
      query.role = role
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    // Get total count
    const total = await User.countDocuments(query)

    // Get paginated users
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Get all users error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: error.message,
    })
  }
}

/**
 * Update user (Admin only)
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, isActive } = req.body

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use.',
        })
      }
      user.email = email
    }

    // Update fields
    if (name) user.name = name
    if (role) user.role = role
    if (isActive !== undefined) user.isActive = isActive

    await user.save()

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    })
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update user.',
      error: error.message,
    })
  }
}

/**
 * Soft delete user (Admin only)
 * Deactivates user account without deleting data
 * DELETE /api/admin/users/:id
 */
const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      })
    }

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // Soft delete: set isActive to false
    user.isActive = false
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'User account has been deactivated.',
      data: { user },
    })
  } catch (error) {
    console.error('Soft delete user error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate user.',
      error: error.message,
    })
  }
}

/**
 * Hard delete user (Admin only)
 * Permanently deletes user and all associated data
 * DELETE /api/admin/users/:id/permanent
 */
const hardDeleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const { confirmation } = req.body

    // Require confirmation
    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message:
          'Please provide confirmation to permanently delete user. Send confirmation: "DELETE"',
      })
    }

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      })
    }

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // Delete all user's media
    await Media.deleteMany({ userId: id })

    // Delete all user's contact messages
    await Contact.deleteMany({ userId: id })

    // Delete user
    await User.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: 'User and all associated data have been permanently deleted.',
    })
  } catch (error) {
    console.error('Hard delete user error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to permanently delete user.',
      error: error.message,
    })
  }
}

export {
  getUserProfile,
  updateUserProfile,
  getUserById,
  getAllUsers,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
}
