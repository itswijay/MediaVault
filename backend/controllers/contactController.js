const Contact = require('../models/Contact')

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
      userId: req.user?.id || null, // Link to user if authenticated
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

    // Get total count for authenticated user's messages
    const total = await Contact.countDocuments({ userId: req.user.id })

    // Get paginated messages
    const messages = await Contact.find({ userId: req.user.id })
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
    if (contact.userId && contact.userId.toString() !== req.user.id) {
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
    if (contact.userId && contact.userId.toString() !== req.user.id) {
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
    const { isRead } = req.body

    if (isRead === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide isRead status.',
      })
    }

    const contact = await Contact.findById(id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      })
    }

    contact.isRead = isRead
    await contact.save()
    await contact.populate('userId')

    return res.status(200).json({
      success: true,
      message: `Message marked as ${isRead ? 'read' : 'unread'}.`,
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

module.exports = {
  submitMessage,
  getUserMessages,
  updateMessage,
  deleteMessage,
  getAllMessages,
  adminDeleteMessage,
  markAsRead,
}
