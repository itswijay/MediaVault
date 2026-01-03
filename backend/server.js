import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/database.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import mediaRoutes from './routes/mediaRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import userRoutes from './routes/userRoutes.js'

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  console.log(`Port: ${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
  console.log(
    `CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`
  )
  console.log('====================================\n')
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

export default app
