import { useState } from 'react'
import api, { clearAuthToken } from '../api'
import { Link, useNavigate } from 'react-router-dom'
import { applySession } from '../utils/session'

// Separate from /signin on purpose: this surface is for Super
// Administrators and Church/Department Admins only. It carries no
// "Register Here" link or public sign-up path, and rejects a successful
// login from a non-admin account instead of quietly landing them on the
// member dashboard from an admin-branded page.
export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '', showPassword: false, rememberMe: true })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await api.post('/auth/token/', { username: form.username, password: form.password })
      const { isSystemAdmin, isSuperAdmin } = await applySession(response.data.access, form.rememberMe)

      if (!isSystemAdmin && !isSuperAdmin) {
        clearAuthToken()
        localStorage.removeItem('isAdmin')
        localStorage.removeItem('isSuperAdmin')
        localStorage.removeItem('isMediaTeam')
        localStorage.removeItem('userRole')
        window.dispatchEvent(new Event('authChanged'))
        setError('This sign-in is for administrators only. Please use the member sign-in page.')
        return
      }

      navigate('/dashboard')
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail
      if (status === 403 && detail) {
        setError(detail)
      } else {
        setError('Invalid username or password. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="KAG Unity Church" className="inline-block w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          <h1 className="font-display text-3xl font-bold text-white mb-2">Administrator Sign In</h1>
          <p className="text-slate-400">Super Admin &amp; Church/Department Admin access only</p>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-lg p-8 border-t-4 border-slate-500 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-300 mb-2 block">Username / Email</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                placeholder="Enter your admin username"
                className="w-full rounded-lg border-2 border-slate-700 bg-slate-800 text-white px-4 py-3 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-600 transition"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300 mb-2 block">Password</span>
              <div className="relative">
                <input
                  type={form.showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-lg border-2 border-slate-700 bg-slate-800 text-white px-4 py-3 pr-12 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-600 transition"
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

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                className="w-4 h-4 accent-slate-400"
              />
              Remember Me
            </label>

            {error && (
              <div className="rounded-lg bg-red-950 border-l-4 border-red-500 p-4 text-red-300">
                <p className="font-semibold text-sm">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-700 text-white px-6 py-3 font-bold text-lg hover:bg-slate-600 transition disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'SIGN IN'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/signin" className="text-slate-400 text-sm hover:text-slate-200 hover:underline">
            Not an administrator? Member sign-in →
          </Link>
        </div>
      </div>
    </div>
  )
}
