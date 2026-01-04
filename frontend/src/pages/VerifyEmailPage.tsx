import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Footer } from '@/components/Footer'
import api from '@/services/api'
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  // State
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return

    const timer = setTimeout(() => {
      setResendCountdown(resendCountdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendCountdown])

  // Request OTP
  const handleRequestOTP = async () => {
    if (!user?.email) return

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await api.post('/auth/send-otp', {
        email: user.email,
      })

      if (response.data.success) {
        setStep('verify')
        setSuccessMessage('OTP sent to your email. Please check your inbox.')
        setResendCountdown(60)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg =
        error?.response?.data?.message ||
        'Failed to send OTP. Please try again.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!user?.email || !otp.trim()) {
      setError('Please enter the OTP')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await api.post('/auth/verify-otp', {
        email: user.email,
        otp: otp.trim(),
      })

      if (response.data.success) {
        // Update user in context to mark email as verified using backend response
        const updatedUser = response.data.data || {
          ...user,
          isEmailVerified: true,
        }
        updateUser(updatedUser)

        setSuccessMessage('Email verified successfully!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg =
        error?.response?.data?.message ||
        'Failed to verify OTP. Please try again.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if email already verified
  if (user?.isEmailVerified) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Email Already Verified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              Your email is already verified. You can now enjoy all features!
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-white">Verify Your Email</CardTitle>
            <CardDescription className="text-slate-400">
              Complete the verification process to unlock all features
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Alert Messages */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}

            {step === 'request' ? (
              // Step 1: Request OTP
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">Email</Label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-700/50 border-slate-600 text-slate-300 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    We'll send a verification code to this email address
                  </p>
                </div>

                <Button
                  onClick={handleRequestOTP}
                  disabled={isLoading}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </div>
            ) : (
              // Step 2: Verify OTP
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp" className="text-slate-300 mb-2 block">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-lg tracking-widest"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Check your email for the 6-digit verification code
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold disabled:opacity-50"
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

                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    Didn't receive the code?
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestOTP}
                    disabled={resendCountdown > 0 || isLoading}
                    className="text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 p-0 h-auto"
                  >
                    {resendCountdown > 0 ? (
                      `Resend in ${resendCountdown}s`
                    ) : (
                      <>Resend Code</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur mt-6">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <p className="text-slate-400">
                <strong className="text-white">Why verify?</strong>
                <br />
                Email verification helps us keep your account secure and ensures
                you receive important notifications.
              </p>
              <p className="text-slate-400">
                <strong className="text-white">Spam folder?</strong>
                <br />
                If you don't see the email, check your spam or promotions
                folder.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
