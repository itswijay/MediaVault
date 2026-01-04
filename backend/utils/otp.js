import nodemailer from 'nodemailer'

// Store OTPs in memory with expiration times
// In production, use Redis for better scalability
const otpStore = {}

// Initialize transporter lazily
let transporter = null

const initializeTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    })
  }
  return transporter
}

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP to user's email
 * @param {string} email - User's email address
 * @param {string} purpose - Purpose of OTP (registration, forgot-password, etc.)
 * @returns {Promise<object>} { success: boolean, message: string, otp?: string }
 */
const sendOTP = async (email, purpose = 'verification') => {
  try {
    // Initialize transporter
    const mailTransporter = initializeTransporter()

    // Validate Gmail credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      throw new Error(
        'Gmail credentials not configured in environment variables'
      )
    }

    // Generate OTP
    const otp = generateOTP()

    // Store OTP with 10-minute expiration (600 seconds)
    const expirationTime = Date.now() + 10 * 60 * 1000
    otpStore[email] = {
      otp,
      expiresAt: expirationTime,
      purpose,
      attempts: 0,
    }

    // Email content based on purpose
    let subject = ''
    let htmlContent = ''

    if (purpose === 'registration') {
      subject = 'Verify Your Email - MediaVault'
      htmlContent = `
        <h2>Welcome to MediaVault!</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="color: #007bff; letter-spacing: 2px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    } else if (purpose === 'forgot-password') {
      subject = 'Reset Your Password - MediaVault'
      htmlContent = `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #007bff; letter-spacing: 2px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    } else {
      subject = 'Your Verification Code - MediaVault'
      htmlContent = `
        <h2>Verification Code</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #007bff; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    }

    // Send email
    await mailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    })

    return {
      success: true,
      message: `OTP sent successfully to ${email}`,
    }
  } catch (error) {
    console.error('Error sending OTP:', error)
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: error.message,
    }
  }
}

/**
 * Verify OTP for an email
 * @param {string} email - User's email address
 * @param {string} otp - OTP code to verify
 * @returns {object} { success: boolean, message: string, purpose?: string }
 */
const verifyOTP = (email, otp) => {
  try {
    // Check if OTP exists for this email
    if (!otpStore[email]) {
      return {
        success: false,
        message: 'No OTP found for this email. Please request a new one.',
      }
    }

    const otpData = otpStore[email]

    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      delete otpStore[email]
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      }
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      otpData.attempts += 1

      // Lock after 5 failed attempts
      if (otpData.attempts >= 5) {
        delete otpStore[email]
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.',
        }
      }

      return {
        success: false,
        message: `Incorrect OTP. You have ${
          5 - otpData.attempts
        } attempts remaining.`,
      }
    }

    // OTP is valid, get purpose and mark as verified (but don't delete yet)
    const purpose = otpData.purpose
    otpData.verified = true

    return {
      success: true,
      message: 'OTP verified successfully.',
      purpose,
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return {
      success: false,
      message: 'Error verifying OTP.',
      error: error.message,
    }
  }
}

/**
 * Check if an OTP is verified for an email (without verifying again)
 * @param {string} email - User's email address
 * @returns {boolean} True if OTP is verified and not expired
 */
const isOTPVerified = (email) => {
  if (!otpStore[email]) return false

  if (Date.now() > otpStore[email].expiresAt) {
    delete otpStore[email]
    return false
  }

  return otpStore[email].verified === true
}

/**
 * Check if an OTP exists for an email (without verifying)
 * @param {string} email - User's email address
 * @returns {boolean} True if OTP exists and is not expired
 */
const hasOTP = (email) => {
  if (!otpStore[email]) return false

  if (Date.now() > otpStore[email].expiresAt) {
    delete otpStore[email]
    return false
  }

  return true
}

/**
 * Clear OTP for an email (cleanup)
 * @param {string} email - User's email address
 */
const clearOTP = (email) => {
  if (otpStore[email]) {
    delete otpStore[email]
  }
}

/**
 * Get remaining time for OTP (in seconds)
 * @param {string} email - User's email address
 * @returns {number|null} Remaining seconds or null if OTP doesn't exist
 */
const getOTPRemainingTime = (email) => {
  if (!otpStore[email]) return null

  const remaining = Math.ceil((otpStore[email].expiresAt - Date.now()) / 1000)
  return remaining > 0 ? remaining : null
}

export {
  generateOTP,
  sendOTP,
  verifyOTP,
  isOTPVerified,
  hasOTP,
  clearOTP,
  getOTPRemainingTime,
}
