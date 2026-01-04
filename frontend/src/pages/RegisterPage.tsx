import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
import type { RegisterPayload, AuthResponse, SendOTPPayload } from '../types'
import { Mail, Lock, User, Loader2, Check } from 'lucide-react'
import logoImg from '../assets/mediavault.png'

export const RegisterPage = () => {
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  // UI states
  const [step, setStep] = useState<'registration' | 'otp-verification'>(
    'registration'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'fair' | 'strong'
  >('weak')
  const [canResendOtp, setCanResendOtp] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return 'weak'
    if (pwd.length < 8) return 'fair'
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumbers = /\d/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)

    const strength = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length

    if (strength >= 3) return 'strong'
    if (strength >= 2) return 'fair'
    return 'weak'
  }

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  // Validate registration form
  const validateRegistrationForm = () => {
    if (!name.trim()) {
      setError('Name is required')
      return false
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return false
    }
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (!confirmPassword) {
      setError('Please confirm your password')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  // Validate OTP
  const validateOtp = () => {
    if (!otp.trim()) {
      setError('OTP is required')
      return false
    }
    if (otp.trim().length !== 6) {
      setError('OTP must be 6 digits')
      return false
    }
    return true
  }

  // Handle registration submission
  const handleRegistration = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateRegistrationForm()) {
      return
    }

    setIsLoading(true)
    try {
      const payload: RegisterPayload = {
        name,
        email,
        password,
        confirmPassword,
      }

      const response = await api.post<AuthResponse>('/auth/register', payload)

      if (response.data.success) {
        setSuccess('Registration successful! OTP sent to your email.')
        setStep('otp-verification')
        startResendCountdown()
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      setError(errorMessage)
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Start OTP resend countdown
  const startResendCountdown = () => {
    setCanResendOtp(false)
    setResendCountdown(60)
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResendOtp(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const payload: SendOTPPayload = { email }
      const response = await api.post('/auth/send-otp', payload)

      if (response.data.success) {
        setSuccess('OTP resent to your email')
        startResendCountdown()
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to resend OTP'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateOtp()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
      })

      if (response.data.success) {
        setSuccess('Email verified successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'OTP verification failed'
      setError(errorMessage)
      console.error('OTP verification error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 rounded-2xl">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <img
            src={logoImg}
            alt="MediaVault Logo"
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-white mb-2">MediaVault</h1>
          <p className="text-slate-400">Create your account</p>
        </div>

        {/* Registration Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">
              {step === 'registration' ? 'Create Account' : 'Verify Email'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'registration'
                ? 'Sign up to get started with MediaVault'
                : `We've sent an OTP to ${email}`}
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

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Registration Form */}
            {step === 'registration' ? (
              <form onSubmit={handleRegistration} className="space-y-4">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                  </div>
                </div>

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
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        handlePasswordChange(e.target.value)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {['weak', 'fair', 'strong'].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              passwordStrength === level ||
                              (level === 'weak' &&
                                ['fair', 'strong'].includes(
                                  passwordStrength
                                )) ||
                              (level === 'fair' &&
                                passwordStrength === 'strong')
                                ? passwordStrength === 'weak'
                                  ? 'bg-red-500'
                                  : passwordStrength === 'fair'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p
                        className={`text-xs ${
                          passwordStrength === 'weak'
                            ? 'text-red-400'
                            : passwordStrength === 'fair'
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        Password strength:{' '}
                        <span className="capitalize">{passwordStrength}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-2 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer mt-0.5"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-xs text-slate-400 cursor-pointer font-normal"
                  >
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold h-10 mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            ) : (
              /* OTP Verification Form */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-300">
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                      setOtp(value)
                      setError(null)
                    }}
                    maxLength={6}
                    disabled={isLoading}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 text-center text-2xl letter-spacing-2 font-mono"
                  />
                  <p className="text-xs text-slate-400 text-center">
                    Check your email for the 6-digit code
                  </p>
                </div>

                {/* Verify OTP Button */}
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold h-10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>

                {/* Resend OTP Button */}
                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp || isLoading}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  {resendCountdown > 0
                    ? `Resend OTP in ${resendCountdown}s`
                    : 'Resend OTP'}
                </Button>

                {/* Back Button */}
                <Button
                  type="button"
                  onClick={() => {
                    setStep('registration')
                    setOtp('')
                    setError(null)
                    setSuccess(null)
                  }}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-slate-300"
                >
                  Back to Registration
                </Button>
              </form>
            )}

            {/* Divider */}
            {step === 'registration' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-800 text-slate-400">
                      Already have an account?
                    </span>
                  </div>
                </div>

                {/* Login Link */}
                <p className="text-center text-sm text-slate-400">
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
