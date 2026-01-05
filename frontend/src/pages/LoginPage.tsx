import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Footer } from '../components/Footer'
import type { LoginPayload, AuthResponse } from '../types'
import { Mail, Lock, Loader2 } from 'lucide-react'
import logoImg from '../assets/mediavault.png'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Email validation regex
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate form inputs
  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!password) {
      setError('Password is required')
      return false
    }
    return true
  }

  // Handle email/password login
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const payload: LoginPayload = { email, password }
      const response = await api.post<AuthResponse>('/auth/login', payload)

      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data
        login(user, token, refreshToken)

        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email)
        } else {
          localStorage.removeItem('rememberEmail')
        }

        navigate('/dashboard')
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.'

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google OAuth login
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    setError(null)
    setIsLoading(true)

    const performLogin = async () => {
      try {
        const token = credentialResponse.credential
        if (!token) {
          setError('Failed to get credential from Google')
          return
        }

        // Decode JWT token to get user info (without verification on client)
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const decodedToken = JSON.parse(jsonPayload)

        // Send token to backend for verification and login
        const response = await api.post<AuthResponse>('/auth/google-login', {
          googleId: decodedToken.sub,
          email: decodedToken.email,
          name: decodedToken.name,
          profileImage: decodedToken.picture,
          token: token, // Send the token for verification
        })

        if (response.data.success) {
          const { user, token: accessToken, refreshToken } = response.data.data
          login(user, accessToken, refreshToken)

          navigate('/dashboard')
        }
      } catch (err) {
        let errorMessage = 'Google login failed. Please try again.'

        if (axios.isAxiosError(err)) {
          if (err.response?.data?.message) {
            errorMessage = err.response.data.message
          } else if (err.message) {
            errorMessage = err.message
          }
        } else if (err instanceof Error) {
          errorMessage = err.message
        }

        setError(errorMessage)
        console.error('Google login error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    performLogin()
  }

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col pt-4">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <img
              src={logoImg}
              alt="MediaVault Logo"
              className="w-20 h-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-5xl font-bold text-white mb-2">MediaVault</h1>
            <p className="text-slate-400">Your Personal Media Gallery</p>
          </div>

          {/* Login Card */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <span className="text-lg leading-none">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-slate-400 cursor-pointer font-normal"
                  >
                    Remember me
                  </Label>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold h-10 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Login Button */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="320"
                />
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <p className="text-center text-xs text-slate-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
