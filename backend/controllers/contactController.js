import Contact from '../models/Contact.js'

/**
 * Submit contact message
 * POST /api/contact
 */
const submitMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message.',
      })
    }

    // Message length validation
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long.',
      })
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 1000 characters.',
      })
    }

    // Create contact message
    const contact = new Contact({
      name,
      email,
      message,
      userId: req.user?.userId || req.user?.id || null, // Link to user if authenticated
    })

    await contact.save()
    await contact.populate('userId')

    return res.status(201).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.',
      data: { contact },
    })
  } catch (error) {
    console.error('Submit message error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to submit message.',
      error: error.message,
    })
  }
}

/**
 * Get user's contact messages
 * GET /api/contact/mymessages?page=1&limit=10
 */
const getUserMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const userId = req.user.userId || req.user.id

    // Get total count for authenticated user's messages
    const total = await Contact.countDocuments({ userId })

    // Get paginated messages
    const messages = await Contact.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Get user messages error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your messages.',
      error: error.message,
    })
  }
}

/**
 * Update contact message
 * PUT /api/contact/:id
 */
const updateMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, message } = req.body

    const contact = await Contact.findById(id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      })
    }

    // Check ownership
    const userId = req.user.userId || req.user.id
    if (contact.userId && contact.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own messages.',
      })
    }

    // Check if authenticated user is the one who submitted the anonymous message
    if (!contact.userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot update anonymous messages.',
      })
    }

    // Validate message length if updating
    if (message) {
      if (message.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Message must be at least 10 characters long.',
        })
      }

      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot exceed 1000 characters.',
        })
      }
    }

    // Update fields
    if (name) contact.name = name
    if (email) contact.email = email
    if (message) contact.message = message

    await contact.save()
    await contact.populate('userId')

    return res.status(200).json({
      success: true,
      message: 'Message updated successfully.',
      data: { contact },
    })
  } catch (error) {
    console.error('Update message error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update message.',
      error: error.message,
    })
  }
}

/**
 * Delete user's contact message
 * DELETE /api/contact/:id
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params

    const contact = await Contact.findById(id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      })
    }

    // Check ownership
    const userId = req.user.userId || req.user.id
    if (contact.userId && contact.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages.',
      })
    }

    if (!contact.userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete anonymous messages.',
      })
    }

    await Contact.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
    })
  } catch (error) {
    console.error('Delete message error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete message.',
      error: error.message,
    })
  }
}

/**
 * Get all contact messages (Admin only)
 * GET /api/admin/contact?page=1&limit=10&isRead=false&sort=-createdAt
 */
const getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const { isRead, sort } = req.query

    // Build query
    let query = {}

    if (isRead !== undefined) {
      query.isRead = isRead === 'true'
    }

    // Get total count
    const total = await Contact.countDocuments(query)

    // Get paginated messages with sorting
    const sortField = sort || '-createdAt'
    const messages = await Contact.find(query)
      .sort(sortField)
      .skip(skip)
      .limit(limit)

    return res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Get all messages error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages.',
      error: error.message,
    })
  }
}

/**
 * Delete any contact message (Admin only)
 * DELETE /api/admin/contact/:id
 */
const adminDeleteMessage = async (req, res) => {
  try {
    const { id } = req.params

    const contact = await Contact.findById(id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      })
    }

    await Contact.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
    })
  } catch (error) {
    console.error('Admin delete message error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete message.',
      error: error.message,
    })
  }
}

/**
 * Mark contact message as read (Admin only)
 * PUT /api/contact/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.user.userId || req.user.id

    const contact = await Contact.findById(id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      })
    }

    // Check if admin already marked this message as read
    const alreadyRead = contact.readBy.some(
      (read) => read.adminId.toString() === adminId
    )

    if (!alreadyRead) {
      // Add admin to readBy array
      contact.readBy.push({
        adminId,
        readAt: new Date(),
      })
      await contact.save()
    }

    await contact.populate('userId')

    return res.status(200).json({
      success: true,
      message: 'Message marked as read.',
      data: { contact },
    })
  } catch (error) {
    console.error('Mark as read error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update message status.',
      error: error.message,
    })
  }
}

export {
  submitMessage,
  getUserMessages,
  updateMessage,
  deleteMessage,
  getAllMessages,
  adminDeleteMessage,
  markAsRead,
}
