import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { LogOut, User, Mail, Shield } from 'lucide-react'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You need to be logged in to access this page.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-800/50 border-b border-slate-700 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-br from-cyan-500 to-cyan-600">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">MediaVault</h1>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            Welcome, {user.name}! 👋
          </h2>
          <p className="text-slate-400">
            This is your MediaVault dashboard. Here you can manage your media
            files and account.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/30">
                <span className="text-slate-300 font-medium">Full Name</span>
                <span className="text-white">{user.name}</span>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/30">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </span>
                <span className="text-white">{user.email}</span>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/30">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'admin'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/30">
                <span className="text-slate-300 font-medium">
                  Account Status
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.isActive
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Email Verification */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/30">
                <span className="text-slate-300 font-medium">
                  Email Verified
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.isEmailVerified
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {user.isEmailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Quick Stats</CardTitle>
              <CardDescription className="text-slate-400">
                Your account overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Total Uploads */}
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <p className="text-slate-400 text-sm mb-2">Total Uploads</p>
                  <p className="text-3xl font-bold text-cyan-400">0</p>
                </div>

                {/* Storage Used */}
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <p className="text-slate-400 text-sm mb-2">Storage Used</p>
                  <p className="text-3xl font-bold text-cyan-400">0 MB</p>
                </div>

                {/* Public Media */}
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <p className="text-slate-400 text-sm mb-2">Public Media</p>
                  <p className="text-3xl font-bold text-cyan-400">0</p>
                </div>

                {/* Member Since */}
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <p className="text-slate-400 text-sm mb-2">Member Since</p>
                  <p className="text-sm font-bold text-cyan-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Membership Info */}
              <div className="p-4 rounded-lg bg-linear-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20">
                <p className="text-slate-300 text-sm leading-relaxed">
                  Welcome to MediaVault! You can now upload and manage your
                  media files. Start by uploading your first image or visit the
                  gallery to explore more features.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-400">
              Get started with MediaVault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/upload')}
                className="h-12 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-lg"
              >
                📤 Upload Media
              </Button>
              <Button
                onClick={() => navigate('/gallery')}
                className="h-12 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg"
              >
                📸 View Gallery
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                className="h-12 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg"
              >
                👤 Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        {!user.isEmailVerified && (
          <Card className="border-yellow-500/20 bg-yellow-500/10 backdrop-blur mt-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-1">
                    Email Not Verified
                  </h3>
                  <p className="text-yellow-200/80 text-sm">
                    Please verify your email address to unlock all features.
                    Check your inbox for the verification link.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
