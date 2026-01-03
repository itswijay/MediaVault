import cloudinary from 'cloudinary'
import fs from 'fs'

const cloudinaryV2 = cloudinary.v2

/**
 * Initialize Cloudinary configuration with API credentials from environment variables
 * Required environment variables:
 * - CLOUDINARY_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
const initializeCloudinary = () => {
  if (!cloudinaryV2.config().cloud_name) {
    cloudinaryV2.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }
}

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with URL and public_id
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    // Initialize Cloudinary configuration
    initializeCloudinary()

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    // Default options
    const uploadOptions = {
      resource_type: 'auto',
      folder: 'mediavault', // Store files in mediavault folder
      quality: 'auto', // Auto-optimize quality
      ...options,
    }

    // Upload file to Cloudinary
    const result = await cloudinaryV2.uploader.upload(filePath, uploadOptions)

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        fileSize: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        uploadedAt: new Date(),
      },
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      message: 'Failed to upload file to Cloudinary.',
      error: error.message,
    }
  }
}

/**
 * Upload a file buffer to Cloudinary (without saving to disk first)
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} filename - Original filename
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with URL and public_id
 */
const uploadBufferToCloudinary = async (fileBuffer, filename, options = {}) => {
  try {
    // Initialize Cloudinary configuration
    initializeCloudinary()

    if (!fileBuffer) {
      throw new Error('File buffer is empty')
    }

    const uploadOptions = {
      resource_type: 'auto',
      folder: 'mediavault',
      quality: 'auto',
      public_id: filename.split('.')[0], // Use filename without extension as public_id
      ...options,
    }

    // Upload buffer to Cloudinary using a stream
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary buffer upload error:', error)
            reject(error)
          } else {
            resolve({
              success: true,
              data: {
                url: result.secure_url,
                publicId: result.public_id,
                fileSize: result.bytes,
                format: result.format,
                width: result.width,
                height: result.height,
                uploadedAt: new Date(),
              },
            })
          }
        }
      )

      // Write buffer to stream
      uploadStream.end(fileBuffer)
    })
  } catch (error) {
    console.error('Cloudinary buffer upload error:', error)
    return {
      success: false,
      message: 'Failed to upload buffer to Cloudinary.',
      error: error.message,
    }
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<object>} Delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required')
    }

    const result = await cloudinaryV2.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return {
        success: true,
        message: 'File deleted successfully from Cloudinary.',
        publicId,
      }
    } else {
      return {
        success: false,
        message: 'Failed to delete file from Cloudinary.',
        result: result.result,
      }
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return {
      success: false,
      message: 'Error deleting file from Cloudinary.',
      error: error.message,
    }
  }
}

/**
 * Get information about a file in Cloudinary
 * @param {string} publicId - Public ID of the file
 * @returns {Promise<object>} File information
 */
const getFileInfo = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required')
    }

    const result = await cloudinaryV2.api.resource(publicId)

    return {
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        fileSize: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        uploadedAt: result.created_at,
      },
    }
  } catch (error) {
    console.error('Cloudinary get file info error:', error)
    return {
      success: false,
      message: 'Failed to get file information.',
      error: error.message,
    }
  }
}

/**
 * Transform image URL with Cloudinary transformation options
 * @param {string} publicId - Public ID of the image
 * @param {object} transformations - Cloudinary transformation options
 * @returns {string} Transformed image URL
 */
const getTransformedUrl = (publicId, transformations = {}) => {
  try {
    const url = cloudinaryV2.url(publicId, {
      secure: true,
      ...transformations,
    })

    return url
  } catch (error) {
    console.error('Cloudinary transformation error:', error)
    return null
  }
}

/**
 * Generate a thumbnail URL for an image
 * @param {string} publicId - Public ID of the image
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
const getThumbnailUrl = (publicId, width = 200, height = 200) => {
  return getTransformedUrl(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
  })
}

/**
 * Batch delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of public IDs to delete
 * @returns {Promise<object>} Deletion results
 */
const batchDelete = async (publicIds) => {
  try {
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      throw new Error('publicIds must be a non-empty array')
    }

    const results = await cloudinaryV2.api.delete_resources(publicIds)

    const successCount = Object.values(results.deleted).filter(
      (v) => v === 'ok'
    ).length

    return {
      success: true,
      message: `Deleted ${successCount} out of ${publicIds.length} files.`,
      details: results,
    }
  } catch (error) {
    console.error('Cloudinary batch delete error:', error)
    return {
      success: false,
      message: 'Error performing batch deletion.',
      error: error.message,
    }
  }
}

export {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getFileInfo,
  getTransformedUrl,
  getThumbnailUrl,
  batchDelete,
}
