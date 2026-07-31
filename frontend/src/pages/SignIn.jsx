import { useState } from 'react'
import api from '../api'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { HeroWorshipGraphic } from '../components/ChurchGraphics'
import { applySession } from '../utils/session'

export default function SignIn() {
  const [form, setForm] = useState({ username: '', password: '', showPassword: false, rememberMe: true })
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  const welcomeMessage = location.state?.message || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post('/auth/token/', { username: form.username, password: form.password })
      await applySession(response.data.access, form.rememberMe)
      // Every role lands on the same adaptive dashboard, which renders the
      // correct Super Admin / Church Admin / Department Admin / Member /
      // Visitor experience based on the role the backend just confirmed.
      navigate('/dashboard')
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail
      if (status === 403 && detail) {
        setError(detail)
      } else {
        setError('Invalid username or password. Please try again.')
      }
    }
  }

  const signInWithGoogle = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      // Initialize Google Identity Services (loads script once on first render)
      if (!window.google?.accounts?.id) {
        await new Promise((resolve, reject) => {
          const existing = document.getElementById('google-identity-services')
          if (existing) {
            existing.addEventListener('load', resolve)
            existing.addEventListener('error', () => reject(new Error('Google Identity Services failed to load')))
            return
          }

          const script = document.createElement('script')
          script.id = 'google-identity-services'
          script.src = 'https://accounts.google.com/gsi/client'
          script.async = true
          script.defer = true
          script.onload = resolve
          script.onerror = () => reject(new Error('Google Identity Services failed to load'))
          document.head.appendChild(script)
        })
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setError('Google sign-in not configured. Please configure Google sign-in or use username/password.')
        return
      }

      await new Promise((resolve, reject) => {
        let settled = false
        const settleOnce = (fn) => (value) => {
          if (settled) return
          settled = true
          fn(value)
        }

        const timer = window.setTimeout(
          () => settleOnce(reject)(new Error('Google sign-in timed out. Please try again.')),
          15000
        )

        const onResolved = settleOnce(() => {
          window.clearTimeout(timer)
          resolve()
        })

        const onRejected = settleOnce((err) => {
          window.clearTimeout(timer)
          reject(err)
        })

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const idToken = response?.credential
              if (!idToken) throw new Error('Google did not return an id_token')

              const res = await api.post('/auth/google/', { id_token: idToken })
              await applySession(res.data.access, form.rememberMe)
              navigate('/dashboard')
              onResolved()
            } catch (e) {
              onRejected(e)
            }
          },
        })

        // This shows the Google sign-in UX.
        if (window.google?.accounts?.id?.prompt) {
          window.google.accounts.id.prompt((notification) => {
            try {
              if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
                onRejected(
                  new Error('Google sign-in was blocked or dismissed. Please try again or use username/password.')
                )
              }
            } catch (_) {
              // ignore
            }
          })
        } else {
          onRejected(new Error('Google sign-in UI is not available. Please use username/password.'))
        }
      })
    } catch (e) {
      setError(e?.message || 'Unable to sign in with Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {/* Graphic panel - desktop only */}
      <div className="hidden lg:flex relative bg-gradient-hero items-center justify-center overflow-hidden p-12">
        <HeroWorshipGraphic className="absolute inset-0 h-full w-full opacity-90" />
        <div className="relative z-10 text-center text-white max-w-sm">
          <h2 className="font-display text-3xl font-bold mb-3">Welcome back to KAG Unity Church</h2>
          <p className="text-primary-100">Sermons, events, and community — all in one place.</p>
        </div>
      </div>

      <div className="w-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="KAG Unity Church" className="inline-block w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          <h1 className="font-display text-4xl font-bold text-primary-800 dark:text-primary-300 mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-slate-400">Sign in to access your church community</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8 border-t-4 border-primary-600 space-y-6">
          {welcomeMessage && (
            <div className="rounded-lg bg-success-50 border-l-4 border-success-500 p-4 text-success-800">
              <p className="font-semibold text-sm">✅ {welcomeMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <label className="block">
              <span className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-2 block">👤 Email / Member ID / Username</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                placeholder="Enter your username"
                className="w-full rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              />
            </label>

            {/* Password Field */}
            <label className="block">
              <span className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-2 block">🔑 Password</span>
              <div className="relative">
                <input
                  type={form.showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-4 py-3 pr-12 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition"
                  aria-label={form.showPassword ? 'Hide password' : 'Show password'}
                  title={form.showPassword ? 'Hide password' : 'Show password'}
                >
                  {form.showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">Forgot Password?</Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-danger-50 border-l-4 border-danger-500 p-4 text-danger-800">
                <p className="font-semibold text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-hero text-white px-6 py-3 font-bold text-lg hover:shadow-lg transition transform hover:-translate-y-0.5 shadow-md"
            >
              LOGIN
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-surface-dark text-gray-600 dark:text-slate-400">OR</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-60"
          >
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-700 dark:text-slate-300">Don't have an account?
            <Link to="/register" className="ml-2 text-primary-600 font-semibold hover:text-primary-700 hover:underline">
              Register Here →
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
