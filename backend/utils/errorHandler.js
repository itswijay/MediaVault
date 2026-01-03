/**
 * Custom error classes for the application
 * Provides standardized error handling with proper HTTP status codes
 */

/**
 * Base custom error class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 400 Bad Request Error
 * Used for validation errors, invalid input, etc.
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400)
    this.name = 'BadRequestError'
  }
}

/**
 * 401 Unauthorized Error
 * Used when authentication fails or token is missing
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

/**
 * 403 Forbidden Error
 * Used when user doesn't have permission to access a resource
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * 404 Not Found Error
 * Used when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * 409 Conflict Error
 * Used for duplicate entries, version conflicts, etc.
 */
class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

/**
 * 422 Unprocessable Entity Error
 * Used for validation errors
 */
class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, 422)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

/**
 * 429 Too Many Requests Error
 * Used for rate limiting
 */
class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429)
    this.name = 'TooManyRequestsError'
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500)
    this.name = 'InternalServerError'
  }
}

/**
 * Global error handling middleware
 * Should be placed at the end of all other middleware and routes
 */
const errorHandler = (err, req, res, next) => {
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('\n=== ERROR DETAILS ===')
    console.error('Timestamp:', new Date().toISOString())
    console.error('Method:', req.method)
    console.error('URL:', req.originalUrl)
    console.error('Error Name:', err.name)
    console.error('Error Message:', err.message)
    console.error('Status Code:', err.statusCode || 500)
    if (err.errors) console.error('Validation Errors:', err.errors)
    console.error('Stack:', err.stack)
    console.error('====================\n')
  } else {
    // Log only essential info in production
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`)
  }

  // Set default status and message
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422
    const errors = Object.values(err.errors).map((e) => e.message)
    message = 'Validation failed'
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    })
  }

  // Handle mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyPattern)[0]
    message = `${field} already exists`
    return res.status(statusCode).json({
      success: false,
      message,
    })
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
    return res.status(statusCode).json({
      success: false,
      message,
    })
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
    return res.status(statusCode).json({
      success: false,
      message,
    })
  }

  // Handle custom AppError
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(err.errors && { errors: err.errors }),
    })
  }

  // Handle unexpected errors
  console.error('Unexpected Error:', err)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  })
}

/**
 * Async error wrapper for route handlers
 * Wraps async functions to catch errors and pass to error handler
 * Usage: router.get('/path', asyncHandler(controllerFunction))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  errorHandler,
  asyncHandler,
}
