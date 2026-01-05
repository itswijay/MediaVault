# MediaVault - Media Gallery Management System

A full-stack MERN application for securely managing and sharing media galleries with advanced authentication, cloud storage integration, and administrative controls.

## Overview

MediaVault provides users with a comprehensive platform to upload, organize, and share media files. The system features JWT-based authentication, Google OAuth integration, email verification via OTP, role-based access control, and cloud storage support through Cloudinary.

## Technology Stack

**Frontend:**

- React 19 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Google OAuth integration

**Backend:**

- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for token-based authentication
- Nodemailer for email services
- Cloudinary SDK for media storage
- Multer for file uploads

**DevOps & Tools:**

- Vite for frontend bundling
- Nodemon for backend development
- ESLint and TypeScript for code quality

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas cloud)
- npm or yarn package manager
- Cloudinary account (for media storage)
- Gmail account with app password (for OTP service)
- Google OAuth credentials

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

   # Server
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Authentication
   JWT_SECRET=your_secure_jwt_secret_key_here

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Email Service
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_PASSWORD=your_app_specific_password

   # Cloud Storage
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # File Upload
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=jpg,jpeg,png
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Application runs on `http://localhost:5173`

## Project Structure

```
backend/
├── config/
│   └── database.js              # MongoDB connection
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── mediaController.js       # Media CRUD operations
│   ├── contactController.js     # Contact form handling
│   └── userController.js        # User management
├── models/
│   ├── User.js                  # User schema with auth fields
│   ├── Media.js                 # Media metadata schema
│   └── Contact.js               # Contact message schema
├── routes/
│   ├── authRoutes.js            # Auth endpoints
│   ├── mediaRoutes.js           # Media endpoints
│   ├── contactRoutes.js         # Contact endpoints
│   └── userRoutes.js            # User endpoints
├── middlewares/
│   └── auth.js                  # JWT verification middleware
├── utils/
│   ├── jwt.js                   # JWT utilities
│   ├── otp.js                   # OTP generation and validation
│   ├── upload.js                # File upload handler
│   ├── cloudinary.js            # Cloudinary integration
│   ├── validators.js            # Input validation
│   └── errorHandler.js          # Error handling utilities
├── constants/
│   └── appConstants.js          # Application constants
├── server.js                    # Express app setup
└── package.json                 # Dependencies

frontend/
├── src/
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   ├── FileUploadDropzone.tsx
│   │   ├── MediaCard.tsx
│   │   ├── MediaGallery.tsx
│   │   ├── ShareModal.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MediaGalleryPage.tsx
│   │   ├── ImageUploadPage.tsx
│   │   ├── ImageDetailPage.tsx
│   │   ├── UserProfilePage.tsx
│   │   ├── ContactFormPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   └── AdminContactPage.tsx
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth context definition
│   │   └── AuthContextProvider.tsx
│   ├── services/
│   │   ├── api.ts               # Axios instance and interceptors
│   │   ├── authService.ts
│   │   ├── mediaService.ts
│   │   ├── userService.ts
│   │   └── contactService.ts
│   ├── hooks/
│   │   └── useAuth.ts           # Custom auth hook
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── index.ts             # Utility functions
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## Features

### Authentication & Authorization

- Email/password registration and login
- Google OAuth 2.0 single sign-on
- Email verification via OTP
- Password reset functionality
- JWT-based session management
- Role-based access control (User, Admin)

### Media Management

- Image upload with drag-and-drop interface
- Image metadata editing (title, description, tags)
- Public and private media visibility
- Share galleries with specific users
- Search and filter by tags
- Bulk download as ZIP archive

### Admin Features

- User management and soft deletion
- Contact message viewing and management
- System overview and statistics
- Admin-only dashboard

### User Experience

- Responsive design with Tailwind CSS
- Real-time form validation
- Error handling and user feedback
- Protected routes with authentication checks

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google-login` - Google OAuth login
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### Media Management

- `GET /api/media/my-media` - Retrieve user's media
- `GET /api/media/public` - Get publicly shared media
- `POST /api/media/upload` - Upload new media
- `GET /api/media/:id` - Get media details
- `PUT /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Delete media
- `POST /api/media/download-zip` - Download multiple files as ZIP

### Contact Form

- `POST /api/contact` - Submit contact message
- `GET /api/contact/mymessages` - Get user's messages
- `DELETE /api/contact/:id` - Delete own message

### User Management (Admin)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Soft delete user account

## Environment Configuration

### MongoDB Connection

- **Local:** `mongodb://localhost:27017/media-vault`
- **Atlas Cloud:** `mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority`

### File Upload Limits

- Maximum file size: 5MB
- Allowed formats: JPG, JPEG, PNG

## Development

### Running Tests

```bash
# Backend
cd backend
npm run dev

# Frontend (in separate terminal)
cd frontend
npm run dev
```

### Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-05T10:30:00.000Z",
  "environment": "development"
}
```

## Building for Production

### Backend

```bash
npm run start
```

### Frontend

```bash
npm run build
npm run preview
```

## Contributors

- Pubudu Wijesundara