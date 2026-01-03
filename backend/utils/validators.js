import { body, param, query, validationResult } from 'express-validator'

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    })
  }
  next()
}

/**
 * ==================== AUTH VALIDATION ====================
 */

const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain lowercase, uppercase, and number'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
]

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

const validateSendOTP = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('purpose')
    .optional()
    .isIn(['registration', 'forgot-password', 'verification'])
    .withMessage('Invalid OTP purpose'),
]

const validateVerifyOTP = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
]

const validateGoogleLogin = [
  body('googleId').trim().notEmpty().withMessage('Google ID is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
]

const validateResetPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
]

/**
 * ==================== MEDIA VALIDATION ====================
 */

const validateMediaUpload = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .trim()
    .custom((value) => {
      if (value && typeof value === 'string') {
        const tags = value.split(',')
        if (tags.length > 10) {
          throw new Error('Maximum 10 tags allowed')
        }
      }
      return true
    }),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
]

const validateMediaUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .trim()
    .custom((value) => {
      if (value && typeof value === 'string') {
        const tags = value.split(',')
        if (tags.length > 10) {
          throw new Error('Maximum 10 tags allowed')
        }
      }
      return true
    }),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  param('id').isMongoId().withMessage('Invalid media ID'),
]

const validateMediaById = [
  param('id').isMongoId().withMessage('Invalid media ID'),
]

const validateMediaShare = [
  param('id').isMongoId().withMessage('Invalid media ID'),
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be a non-empty array')
    .custom((value) => {
      if (!value.every((id) => typeof id === 'string')) {
        throw new Error('All user IDs must be strings')
      }
      return true
    }),
]

const validateDownloadZip = [
  body('mediaIds')
    .isArray({ min: 1 })
    .withMessage('mediaIds must be a non-empty array')
    .custom((value) => {
      if (!value.every((id) => typeof id === 'string')) {
        throw new Error('All media IDs must be strings')
      }
      return true
    }),
]

const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
]

/**
 * ==================== CONTACT VALIDATION ====================
 */

const validateContactSubmit = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
]

const validateContactUpdate = [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
]

const validateContactDelete = [
  param('id').isMongoId().withMessage('Invalid message ID'),
]

const validateMarkAsRead = [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('isRead').isBoolean().withMessage('isRead must be a boolean'),
]

/**
 * ==================== USER VALIDATION ====================
 */

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('profileImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('Profile image must be a valid URL'),
]

const validateUserId = [param('id').isMongoId().withMessage('Invalid user ID')]

const validateAdminUpdateUser = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
]

const validateHardDelete = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('confirmation')
    .notEmpty()
    .withMessage('Confirmation is required')
    .equals('DELETE')
    .withMessage('Please provide correct confirmation (DELETE)'),
]

export {
  handleValidationErrors,
  // Auth
  validateRegister,
  validateLogin,
  validateSendOTP,
  validateVerifyOTP,
  validateGoogleLogin,
  validateResetPassword,
  // Media
  validateMediaUpload,
  validateMediaUpdate,
  validateMediaById,
  validateMediaShare,
  validateDownloadZip,
  validatePaginationQuery,
  // Contact
  validateContactSubmit,
  validateContactUpdate,
  validateContactDelete,
  validateMarkAsRead,
  // User
  validateUpdateProfile,
  validateUserId,
  validateAdminUpdateUser,
  validateHardDelete,
}
