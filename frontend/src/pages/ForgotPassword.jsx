import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'confirm'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const requestCode = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)

    try {
      await api.post('/auth/password-reset/send/', { email })
      setMessage('If your account exists, reset instructions have been sent.')
      setStep('confirm')
    } catch (err) {
      setError(readableError(err, 'Unable to send reset instructions.'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmReset = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/password-reset/confirm/', { email, otp, new_password: newPassword })
      setMessage('Password updated. Redirecting to sign in...')
      setTimeout(() => navigate('/signin'), 1500)
    } catch (err) {
      setError(readableError(err, 'Unable to reset password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-4">Forgot Password</h1>

        {step === 'request' && (
          <>
            <p className="text-slate-600 mb-6">Enter your email address and we will send instructions to reset your password.</p>
            <form onSubmit={requestCode} className="space-y-5">
              <label className="block">
                <span className="text-slate-700">Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>

              {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
              {message && <div className="p-4 bg-slate-100 text-slate-800 rounded">{message}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/forgot-password/security-questions" className="text-primary-600 font-semibold hover:underline">
                Don't have access to your email? Reset using security questions →
              </Link>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <p className="text-slate-600 mb-6">Enter the code we emailed you along with your new password.</p>
            <form onSubmit={confirmReset} className="space-y-5">
              <label className="block">
                <span className="text-slate-700">Reset Code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="6-digit code"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 tracking-widest"
                />
              </label>

              <label className="block">
                <span className="text-slate-700">New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="text-slate-700">Confirm New Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>

              {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
              {message && <div className="p-4 bg-slate-100 text-slate-800 rounded">{message}</div>}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold disabled:opacity-60"
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

