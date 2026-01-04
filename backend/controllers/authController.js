import User from '../models/User.js'
import {
  generateAccessToken,
  generateTokens,
  verifyAccessToken,
  decodeToken,
} from '../utils/jwt.js'
import { sendOTP, verifyOTP, isOTPVerified, clearOTP } from '../utils/otp.js'

// Helper function to maintain backward compatibility
const generateToken = (payload) => {
  return generateAccessToken(payload.id || payload.userId, payload.role)
}

// Helper function to maintain backward compatibility
const verifyToken = (token) => {
  try {
    return verifyAccessToken(token)
  } catch (error) {
    return decodeToken(token)
  }
}

/**
 * Register a new user with email and password
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and confirm password.',
      })
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      })
    }

    // Check password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          'Email already registered. Please login or use a different email.',
      })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      isEmailVerified: false,
    })

    // Save user (password will be hashed by middleware)
    await user.save()

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.role
    )

    // Send OTP for verification
    const otpResult = await sendOTP(email, 'registration')

    return res.status(201).json({
      success: true,
      message:
        'Registration successful. Please verify your email using the OTP sent to your email.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      otpSent: otpResult.success,
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    })
  }
}

/**
 * Send OTP to user's email
 * POST /api/auth/send-otp
 */
const sendOTPHandler = async (req, res) => {
  try {
    const { email, purpose = 'verification' } = req.body

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      })
    }

    // For forgot-password, check if email exists
    if (purpose === 'forgot-password') {
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in our system.',
        })
      }
    }

    // Send OTP
    const result = await sendOTP(email, purpose)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP.',
      error: error.message,
    })
  }
}

/**
 * Verify OTP sent to user's email
 * POST /api/auth/verify-otp
 */
const verifyOTPHandler = async (req, res) => {
  try {
    const { email, otp } = req.body

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP.',
      })
    }

    // Verify OTP
    const result = verifyOTP(email, otp)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      })
    }

    // If verification is for registration, mark email as verified
    if (result.purpose === 'registration') {
      const user = await User.findOne({ email })
      if (user) {
        user.isEmailVerified = true
        await user.save()
      }
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      purpose: result.purpose,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message,
    })
  }
}

/**
 * Login user with email and password
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      })
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled.',
      })
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.role
    )

    // Return response
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    })
  }
}

/**
 * Google OAuth login
 * POST /api/auth/google-login
 */
const googleLogin = async (req, res) => {
  try {
    const { googleId, name, email, profileImage } = req.body

    // Validation
    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide googleId and email from Google OAuth.',
      })
    }

    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    })

    // If user doesn't exist, create new user
    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        profileImage: profileImage || null,
        isEmailVerified: true, // Google users are pre-verified
      })

      await user.save()
    } else {
      // If user exists but doesn't have googleId, add it
      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled.',
      })
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.role
    )

    return res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    })
  } catch (error) {
    console.error('Google login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Google login failed.',
      error: error.message,
    })
  }
}

/**
 * Forgot password - trigger OTP sending
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our system.',
      })
    }

    // Send OTP
    const result = await sendOTP(email, 'forgot-password')

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to reset your password.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate password reset.',
      error: error.message,
    })
  }
}

/**
 * Reset password using OTP
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body

    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password.',
      })
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      })
    }

    // Check password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      })
    }

    // Check if OTP has been verified (should be done before calling this endpoint)
    if (!isOTPVerified(email)) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification required. Please verify your OTP first.',
      })
    }

    // Find user and update password
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Clear OTP after successful password reset
    clearOTP(email)

    return res.status(200).json({
      success: true,
      message:
        'Password reset successful. Please login with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Password reset failed.',
      error: error.message,
    })
  }
}

/**
 * Refresh access token using existing JWT
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided.',
      })
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader

    // Verify token (even if expired)
    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      })
    }

    // Find user
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    // Generate new token
    const newToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    })

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        token: newToken,
      },
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed.',
      error: error.message,
    })
  }
}

/**
 * Logout user (optional - for client-side cleanup)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Get user from authenticated request
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      })
    }

    // Clear any OTP associated with user's email
    const user = await User.findById(userId)
    if (user) {
      clearOTP(user.email)
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful. Please clear the token from your client.',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message,
    })
  }
}

export {
  register,
  sendOTPHandler,
  verifyOTPHandler,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
}
