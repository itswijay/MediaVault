# Media Gallery Management System - MediaVault

A full-stack MERN application for managing media galleries with secure authentication, file uploads, and contact form integration.

## Tech Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: Google OAuth 2.0, JWT, Nodemailer (OTP)
- File Storage: Cloudinary (preferred) or local filesystem

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file in the backend directory with the following variables:

   ```
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/media-vault
   # OR for MongoDB Atlas:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here

   # Gmail OTP Configuration
   GMAIL_USER=your_gmail_email@gmail.com
   GMAIL_PASSWORD=your_gmail_app_password_here

   # Cloudinary Configuration
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=jpg,jpeg,png
   ```

4. MongoDB Connection Formats:

   **Local MongoDB:**

   ```
   MONGODB_URI=mongodb://localhost:27017/media-vault
   ```

   **MongoDB Atlas (Cloud):**

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
   ```

   **Connection String Parts:**

   - `mongodb+srv://` - Connection protocol for MongoDB Atlas
   - `username:password` - Atlas username and password
   - `cluster-name.mongodb.net` - MongoDB Atlas cluster endpoint
   - `database-name` - Name of the database
   - `?retryWrites=true&w=majority` - Connection options

5. Start the server:

   ```bash
   npm run dev
   ```

   Server will run on http://localhost:5000

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── mediaController.js   # Media management logic
├── models/
│   ├── User.js              # User schema
│   └── Media.js             # Media schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── mediaRoutes.js       # Media endpoints
│   └── userRoutes.js        # User endpoints
├── middlewares/
│   └── auth.js              # Authentication middleware
├── utils/
│   ├── otp.js               # OTP utilities
│   └── upload.js            # File upload utilities
├── server.js                # Main server file
├── .env                     # Environment variables (not in git)
├── .env.example             # Example environment variables
└── package.json             # Project dependencies
```

## Features

- User authentication with Google OAuth 2.0 and email/password
- Email OTP verification for registration and password reset
- Media gallery with drag & drop uploads
- Image search and filtering by tags
- Private and shared galleries
- ZIP download for multiple images
- Contact form with admin management
- User management (admin only)
- JWT-based protected routes

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google-login` - Login with Google OAuth
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### Media

- `GET /api/media/my-media` - Get user's media
- `GET /api/media/public` - Get public media
- `POST /api/media/upload` - Upload new media
- `GET /api/media/:id` - Get media details
- `PUT /api/media/:id` - Update media
- `DELETE /api/media/:id` - Delete media
- `POST /api/media/download-zip` - Download multiple as ZIP

### Contact

- `POST /api/contact` - Submit contact message
- `GET /api/contact/mymessages` - Get user's messages
- `DELETE /api/contact/:id` - Delete own message

### Users (Admin)

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Soft delete user

## Testing the Server

Once the server is running, test the health check endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Contributors

- Pubudu Wijesundara

## License

ISC
