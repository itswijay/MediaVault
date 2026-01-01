// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
}

// File Upload Constraints
export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 5242880, // 5MB in bytes
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png'],
}

// JWT Token Expiry
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d',
  OTP_TOKEN: '10m',
}

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_TIME: 600000, // 10 minutes in milliseconds
  MAX_ATTEMPTS: 5,
}

// Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_OTP: 'Invalid or expired OTP',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'You do not have permission to access this resource',
  INVALID_FILE: 'Invalid file type or size',
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
}

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  OTP_SENT: 'OTP sent successfully',
  PASSWORD_RESET: 'Password reset successful',
  MEDIA_UPLOADED: 'Media uploaded successfully',
  CONTACT_SUBMITTED: 'Your message has been submitted successfully',
}
