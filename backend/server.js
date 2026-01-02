const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const connectDB = require('./config/database')

// Import routes
const authRoutes = require('./routes/authRoutes')
const mediaRoutes = require('./routes/mediaRoutes')
const contactRoutes = require('./routes/contactRoutes')
const userRoutes = require('./routes/userRoutes')

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()

// Connect to MongoDB
connectDB()

/**
 * Global Middleware
 */

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Body parser middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve uploaded files (for local storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/**
 * API Routes
 */

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// Mount auth routes
app.use('/api/auth', authRoutes)

// Mount media routes
app.use('/api/media', mediaRoutes)

// Mount contact routes
app.use('/api/contact', contactRoutes)

// Mount user routes
app.use('/api/users', userRoutes)

/**
 * 404 Handler - Route not found
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    path: req.originalUrl,
  })
})

/**
 * Global Error Handling Middleware
 * This should be the last middleware
 */
app.use((err, req, res, next) => {
  // Log error details
  console.error('=== ERROR ===')
  console.error('Timestamp:', new Date().toISOString())
  console.error('Method:', req.method)
  console.error('URL:', req.originalUrl)
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  console.error('=============')

  // Determine status code
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal server error'

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
  })
})

/**
 * Start Server
 */
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

const server = app.listen(PORT, () => {
  console.log('\n========== SERVER STARTED ==========')
  console.log(`⚡ Port: ${PORT}`)
  console.log(`🔧 Environment: ${NODE_ENV}`)
  console.log(`📦 MongoDB: Connected`)
  console.log(
    `🌐 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`
  )
  console.log('====================================\n')

  // Display API routes
  console.log('📍 Available API Routes:')
  console.log('  • GET  /api/health')
  console.log('  • POST /api/auth/register')
  console.log('  • POST /api/auth/login')
  console.log('  • POST /api/auth/google-login')
  console.log('  • POST /api/media/upload')
  console.log('  • GET  /api/media/public')
  console.log('  • POST /api/contact')
  console.log('  • GET  /api/users/profile')
  console.log('  • And more...\n')
})

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error)
  process.exit(1)
})

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

module.exports = app
