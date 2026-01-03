import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

/**
 * Configure multer storage
 * Using memory storage since files are uploaded directly to Cloudinary
 * No need to save to disk first
 */
const storage = multer.memoryStorage()

/**
 * File filter to validate file types
 * Allowed types: JPG, JPEG, PNG
 */
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png']

  // Allowed file extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png']

  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        `Invalid file type. Only JPG and PNG files are allowed. Received: ${file.mimetype}`
      ),
      false
    )
  }
}

/**
 * Configure multer with storage, file filter, and size limits
 * Max file size: 5MB
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

/**
 * Error handling middleware for multer
 * Handles file size and other multer errors
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum file size is 5MB.',
      })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Please upload one file at a time.',
      })
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    })
  } else if (err) {
    // Handle custom errors (e.g., from fileFilter)
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }
  next()
}

/**
 * Single file upload middleware
 * Usage: app.post('/upload', uploadSingle, controller)
 */
const uploadSingle = upload.single('file')

/**
 * Multiple files upload middleware
 * Usage: app.post('/uploads', uploadMultiple, controller)
 */
const uploadMultiple = upload.array('files', 10) // Max 10 files

/**
 * Get file path for uploaded file
 * @param {string} filename - Filename returned from multer
 * @returns {string} Full URL path for the file
 */
const getFileUrl = (filename) => {
  return `/uploads/${filename}`
}

/**
 * Delete uploaded file
 * @param {string} filename - Filename to delete
 * @returns {boolean} True if deleted, false if file not found
 */
const deleteUploadedFile = (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename)

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

/**
 * Validate file exists and is readable
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if file exists
 */
const fileExists = (filename) => {
  const filePath = path.join(uploadsDir, filename)
  return fs.existsSync(filePath)
}

/**
 * Get file stats (size, created date, etc.)
 * @param {string} filename - Filename to get stats for
 * @returns {object|null} File stats or null if not found
 */
const getFileStats = (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename)

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      }
    }
    return null
  } catch (error) {
    console.error('Error getting file stats:', error)
    return null
  }
}

export {
  uploadSingle,
  uploadMultiple,
  handleUploadErrors,
  getFileUrl,
  deleteUploadedFile,
  fileExists,
  getFileStats,
  uploadsDir,
}
