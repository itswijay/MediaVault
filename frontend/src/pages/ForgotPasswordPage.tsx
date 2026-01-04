import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
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
import type { SendOTPPayload, ResetPasswordPayload } from '../types'
import { Mail, Lock, Loader2, Check, ArrowLeft } from 'lucide-react'
import logoImg from '../assets/mediavault.png'

export const ForgotPasswordPage = () => {
  const navigate = useNavigate()

  // Form states
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI states
  const [step, setStep] = useState<
    'email' | 'otp-verification' | 'password-reset'
  >('email')
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

    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumbers = /\d/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)

    const complexity = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length

    // Strong: 3+ character types AND length >= 8
    if (complexity >= 3 && pwd.length >= 8) return 'strong'
    // Fair: 2+ character types OR length >= 8
    if (complexity >= 2 || pwd.length >= 8) return 'fair'
    // Weak: only 1 character type
    return 'weak'
  }

  const handlePasswordChange = (pwd: string) => {
    setNewPassword(pwd)
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  // Step 1: Request OTP
  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const payload: SendOTPPayload = { email }
      const response = await api.post('/auth/send-otp', payload)

      if (response.data.success) {
        setSuccess('OTP sent to your email')
        setStep('otp-verification')
        startResendCountdown()
      }
    } catch (err) {
      let errorMessage = 'Failed to send OTP'

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
      console.error('Send OTP error:', err)
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

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!otp.trim()) {
      setError('OTP is required')
      return
    }
    if (otp.trim().length !== 6) {
      setError('OTP must be 6 digits')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
      })

      if (response.data.success) {
        setSuccess('OTP verified successfully!')
        setStep('password-reset')
      }
    } catch (err) {
      let errorMessage = 'OTP verification failed'

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
      console.error('OTP verification error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Reset password
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newPassword) {
      setError('New password is required')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!confirmPassword) {
      setError('Please confirm your password')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const payload: ResetPasswordPayload = {
        email,
        otp,
        newPassword,
        confirmPassword,
      }

      const response = await api.post('/auth/reset-password', payload)

      if (response.data.success) {
        setSuccess('Password reset successful! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      let errorMessage = 'Failed to reset password'

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
      console.error('Reset password error:', err)
    } finally {
      setIsLoading(false)
    }
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
      let errorMessage = 'Failed to resend OTP'

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
          <p className="text-slate-400">Reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">
              {step === 'email' && 'Find Your Account'}
              {step === 'otp-verification' && 'Verify Your Email'}
              {step === 'password-reset' && 'Create New Password'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'email' &&
                'Enter your email to receive a password reset code'}
              {step === 'otp-verification' && `We've sent a code to ${email}`}
              {step === 'password-reset' &&
                'Enter a new password for your account'}
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

            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold h-10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>

                {/* Back to Login */}
                <Button
                  type="button"
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  className="w-full text-slate-200 hover:text-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp-verification' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-300">
                    Enter Reset Code
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
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 text-center text-2xl font-mono"
                  />
                  <p className="text-xs text-slate-400 text-center">
                    Check your email for the 6-digit code
                  </p>
                </div>

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
                    'Verify Code'
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp || isLoading}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  {resendCountdown > 0
                    ? `Resend Code in ${resendCountdown}s`
                    : 'Resend Code'}
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setError(null)
                    setSuccess(null)
                  }}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Email
                </Button>
              </form>
            )}

            {/* Step 3: Password Reset */}
            {step === 'password-reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        handlePasswordChange(e.target.value)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
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
                      placeholder="Confirm new password"
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold h-10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setStep('otp-verification')
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordStrength('weak')
                    setError(null)
                    setSuccess(null)
                  }}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Code Verification
                </Button>
              </form>
            )}

            {/* Login Link (Email Step Only) */}
            {step === 'email' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-800 text-slate-400">
                      Remember your password?
                    </span>
                  </div>
                </div>

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
          For security, we may require additional verification
        </p>
      </div>
    </div>
  )
}
