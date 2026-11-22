import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PulseMark } from '@/components/shared/PulseMark'
import { api } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setErrorMsg('Invalid or missing password reset token.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      await api.resetPassword({ token, email, password })
      setSuccess(true)
      showToast('Password Updated', 'Your password has been reset successfully. You can now log in.', 'success')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Link may have expired.')
      showToast('Reset Failed', err.message || 'Token is invalid or expired.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-50 px-6">
      <div className="w-full max-w-sm animate-rise rounded-2xl border border-mist-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <PulseMark className="h-8 w-8" />
          <span className="font-display text-lg font-semibold text-ink">MediAssist AI</span>
        </div>

        {success ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-teal-600" />
            <h1 className="font-display text-lg font-semibold text-ink">Password Reset Complete</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Your account password has been updated. You can now log in using your new credentials.
            </p>
            <Button
              className="mt-6 w-full bg-teal-700 hover:bg-teal-800 text-white"
              onClick={() => navigate('/login')}
            >
              Log in now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="font-display text-lg font-semibold text-ink">Create new password</h1>
              <p className="mt-1 text-sm text-ink-soft">Choose a strong password with at least 6 characters.</p>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-9 pr-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-9"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Set New Password'
              )}
            </Button>

            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-teal-600 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
