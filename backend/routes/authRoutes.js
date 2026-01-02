const express = require('express')
const {
  register,
  sendOTPHandler,
  verifyOTPHandler,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
} = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/auth')

const router = express.Router()

/**
 * Public Routes (No authentication required)
 */

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', register)

/**
 * POST /api/auth/send-otp
 * Send OTP to user's email for verification or password reset
 */
router.post('/send-otp', sendOTPHandler)

/**
 * POST /api/auth/verify-otp
 * Verify OTP sent to user's email
 */
router.post('/verify-otp', verifyOTPHandler)

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', login)

/**
 * POST /api/auth/google-login
 * Google OAuth login
 */
router.post('/google-login', googleLogin)

/**
 * POST /api/auth/forgot-password
 * Initiate password reset by sending OTP
 */
router.post('/forgot-password', forgotPassword)

/**
 * POST /api/auth/reset-password
 * Reset password using OTP
 */
router.post('/reset-password', resetPassword)

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
router.post('/refresh-token', refreshToken)

/**
 * Protected Routes (Authentication required)
 */

/**
 * POST /api/auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', authMiddleware, logout)

module.exports = router
