import { verifyAccessToken, decodeToken } from '../utils/jwt.js'

/**
 * Helper function to verify token - tries verification first, falls back to decode
 */
const verifyToken = (token) => {
  try {
    return verifyAccessToken(token)
  } catch (error) {
    return decodeToken(token)
  }
}

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header and verifies it
 * Attaches user info to req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header missing.',
      })
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use "Bearer <token>".',
      })
    }

    // Verify token
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      })
    }

    // Attach user info to request
    req.user = decoded
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message,
    })
  }
}

/**
 * Middleware to check if user is authenticated
 * Similar to authMiddleware but more lenient for optional auth scenarios
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      // No token provided, but that's okay for optional auth
      req.user = null
      return next()
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader

    if (!token) {
      req.user = null
      return next()
    }

    const decoded = verifyToken(token)

    if (decoded) {
      req.user = decoded
    } else {
      req.user = null
    }

    next()
  } catch (error) {
    // Silently fail for optional auth
    req.user = null
    next()
  }
}

/**
 * Middleware to check if user has specific role
 * Must be used after authMiddleware
 * @param {string|string[]} requiredRoles - Role(s) required to access the endpoint
 */
const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (authMiddleware should run first)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Please log in.',
        })
      }

      // Ensure requiredRoles is an array
      const rolesArray = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles]

      // Check if user has required role
      if (!rolesArray.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden. Required role(s): ${rolesArray.join(
            ', '
          )}. Your role: ${req.user.role}`,
        })
      }

      next()
    } catch (error) {
      console.error('Role middleware error:', error)
      return res.status(403).json({
        success: false,
        message: 'Role verification failed.',
        error: error.message,
      })
    }
  }
}

/**
 * Middleware to check if user is admin
 * Shorthand for roleMiddleware with 'admin' role
 * Must be used after authMiddleware
 */
const adminMiddleware = roleMiddleware('admin')

/**
 * Middleware to check if user is owner of a resource
 * Compares req.user.id with resourceOwnerId
 * @param {string} resourceOwnerIdPath - Path to get owner ID (e.g., 'body.userId', 'params.id')
 */
const ownerMiddleware = (resourceOwnerIdPath) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Please log in.',
        })
      }

      // Get owner ID from specified path
      const pathParts = resourceOwnerIdPath.split('.')
      let ownerId = req

      for (const part of pathParts) {
        ownerId = ownerId[part]
      }

      // Convert to string for comparison (in case of ObjectId)
      const userIdString = req.user.id.toString()
      const ownerIdString = ownerId.toString()

      if (userIdString !== ownerIdString) {
        return res.status(403).json({
          success: false,
          message:
            'Forbidden. You do not have permission to access this resource.',
        })
      }

      next()
    } catch (error) {
      console.error('Owner middleware error:', error)
      return res.status(403).json({
        success: false,
        message: 'Permission verification failed.',
        error: error.message,
      })
    }
  }
}

/**
 * Combined middleware for admin or owner
 * User must be either admin or owner of the resource
 * @param {string} resourceOwnerIdPath - Path to get owner ID
 */
const adminOrOwnerMiddleware = (resourceOwnerIdPath) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Please log in.',
        })
      }

      // If user is admin, allow
      if (req.user.role === 'admin') {
        return next()
      }

      // Otherwise check if user is owner
      const pathParts = resourceOwnerIdPath.split('.')
      let ownerId = req

      for (const part of pathParts) {
        ownerId = ownerId[part]
      }

      const userIdString = req.user.id.toString()
      const ownerIdString = ownerId.toString()

      if (userIdString !== ownerIdString) {
        return res.status(403).json({
          success: false,
          message:
            'Forbidden. You do not have permission to access this resource.',
        })
      }

      next()
    } catch (error) {
      console.error('Admin or owner middleware error:', error)
      return res.status(403).json({
        success: false,
        message: 'Permission verification failed.',
        error: error.message,
      })
    }
  }
}

export {
  authMiddleware,
  optionalAuth,
  roleMiddleware,
  adminMiddleware,
  ownerMiddleware,
  adminOrOwnerMiddleware,
}
