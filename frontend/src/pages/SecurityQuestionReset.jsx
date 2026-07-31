import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function SecurityQuestionReset() {
  const navigate = useNavigate()
  const [step, setStep] = useState('identify') // 'identify' | 'answer'
  const [identifier, setIdentifier] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const lookupQuestions = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.get('/auth/security-questions/', { params: { identifier } })
      setQuestions(res.data.questions || [])
      setStep('answer')
    } catch (err) {
      setError(readableError(err, 'Unable to load security questions.'))
    } finally {
      setSubmitting(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/security-questions/reset/', {
        identifier,
        answers: questions.map((q) => ({ question: q, answer: answers[q] || '' })),
        new_password: newPassword,
      })
      setMessage('Password updated. Redirecting to sign in...')
      setTimeout(() => navigate('/signin'), 1500)
    } catch (err) {
      setError(readableError(err, 'Unable to reset your password. Double-check your answers.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-4">Reset Without Email</h1>

        {step === 'identify' && (
          <>
            <p className="text-slate-600 mb-6">
              Enter your username or email. If you've set up security questions, you'll answer them next and set a
              new password directly - no code needed.
            </p>
            <form onSubmit={lookupQuestions} className="space-y-5">
              <label className="block">
                <span className="text-slate-700">Username or Email</span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>

              {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
              >
                {submitting ? 'Loading…' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'answer' && (
          <>
            <p className="text-slate-600 mb-6">Answer your security questions and choose a new password.</p>
            <form onSubmit={submitReset} className="space-y-5">
              {questions.map((q) => (
                <label key={q} className="block">
                  <span className="text-slate-700">{q}</span>
                  <input
                    type="text"
                    required
                    value={answers[q] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </label>
              ))}

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

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
              >
                {submitting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">
            ← Use email reset instead
          </Link>
        </div>
      </div>
    </div>
  )
}
