import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

// Pages (to be created)
// import LoginPage from '../pages/LoginPage'
// import RegisterPage from '../pages/RegisterPage'
// import DashboardPage from '../pages/DashboardPage'
// import MediaGalleryPage from '../pages/MediaGalleryPage'
// import UploadPage from '../pages/UploadPage'
// import ProfilePage from '../pages/ProfilePage'

interface RouteConfig {
  path: string
  element: ReactNode
  children?: RouteConfig[]
  protected?: boolean
  adminOnly?: boolean
}

// Will be populated when pages are created
export const routes: RouteConfig[] = [
  // Public Routes
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // {
  //   path: '/login',
  //   element: <LoginPage />,
  // },
  // {
  //   path: '/register',
  //   element: <RegisterPage />,
  // },
  // {
  //   path: '/forgot-password',
  //   element: <ForgotPasswordPage />,
  // },

  // Protected Routes
  // {
  //   path: '/dashboard',
  //   element: <DashboardPage />,
  //   protected: true,
  // },
  // {
  //   path: '/gallery',
  //   element: <MediaGalleryPage />,
  //   protected: true,
  // },
  // {
  //   path: '/upload',
  //   element: <UploadPage />,
  //   protected: true,
  // },
  // {
  //   path: '/profile',
  //   element: <ProfilePage />,
  //   protected: true,
  // },

  // Admin Routes
  // {
  //   path: '/admin/users',
  //   element: <AdminUsersPage />,
  //   protected: true,
  //   adminOnly: true,
  // },
  // {
  //   path: '/admin/contact',
  //   element: <AdminContactPage />,
  //   protected: true,
  //   adminOnly: true,
  // },

  // Catch all - 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]
