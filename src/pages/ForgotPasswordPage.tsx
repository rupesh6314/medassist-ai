import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PulseMark } from '@/components/shared/PulseMark'
import { api } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setErrorMsg('')
    try {
      await api.forgotPassword(email)
      setSent(true)
      showToast('Reset Link Dispatched', 'Check your email inbox for password reset instructions.', 'success')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch reset email.')
      showToast('Error', err.message || 'Failed to dispatch reset email.', 'warning')
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

        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-teal-600" />
            <h1 className="font-display text-lg font-semibold text-ink">Check your email</h1>
            <p className="mt-2 text-sm text-ink-soft">
              If an account exists for {email || 'that address'}, we&apos;ve sent a link to reset your password.
            </p>
            <Link to="/login">
              <Button variant="outline" className="mt-6 w-full">
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <h1 className="font-display text-lg font-semibold text-ink">Reset your password</h1>
              <p className="mt-1 text-sm text-ink-soft">Enter your email and we&apos;ll send a reset link.</p>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  id="reset-email"
                  type="email"
                  className="pl-9"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Send reset link'
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
