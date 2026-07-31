import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const GENDERS = ['Male', 'Female', 'Other']

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { useFirstField: true })
}

export default function RegisterVisitor() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', phone: '',
    gender: '', age: '', visitor_address: '', county: '', town_city: '', purpose_of_visit: '',
    service_attended: '', date_of_visit: '', prayer_request: '',
    password: '', confirm_password: '',
  })
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const computedUsername = (() => {
    const base = `${form.first_name}${form.last_name ? ' ' + form.last_name : ''}`.trim()
    if (!form.first_name) return ''
    return base.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '')
  })()
  const effectiveUsername = usernameTouched ? form.username : computedUsername

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const payload = { ...form, username: effectiveUsername }
      await api.post('/auth/register/visitor/', payload)
      navigate('/signin', { state: { message: 'Welcome! Your visitor account is ready — sign in to continue.' } })
    } catch (err) {
      setError(readableError(err, 'Registration failed. Please check your details and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition'
  const labelClass = 'text-sm font-semibold text-primary-800 mb-2 block'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="KAG Unity Church" className="inline-block w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          <h1 className="font-display text-3xl font-bold text-primary-800 mb-2">Visitor Registration</h1>
          <p className="text-gray-600">Quick registration — you'll get immediate access to your Visitor Dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-secondary-500 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className={labelClass}>Full Name *</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="First name" required value={form.first_name} onChange={set('first_name')} className={inputClass} />
                <input type="text" placeholder="Last name" value={form.last_name} onChange={set('last_name')} className={inputClass} />
              </div>
            </label>
            <label className="block"><span className={labelClass}>Phone Number *</span>
              <input type="tel" required value={form.phone} onChange={set('phone')} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Email *</span>
              <input type="email" required value={form.email} onChange={set('email')} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Gender</span>
              <select value={form.gender} onChange={set('gender')} className={inputClass}>
                <option value="">Select…</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label className="block"><span className={labelClass}>Age</span>
              <input type="number" min="0" max="150" value={form.age} onChange={set('age')} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Service Attended</span>
              <input type="text" placeholder="e.g. Sunday 1st Service" value={form.service_attended} onChange={set('service_attended')} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Date of Visit</span>
              <input type="date" value={form.date_of_visit} onChange={set('date_of_visit')} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Purpose of Visit</span>
              <input type="text" value={form.purpose_of_visit} onChange={set('purpose_of_visit')} className={inputClass} />
            </label>
          </div>
          <label className="block"><span className={labelClass}>Address</span>
            <textarea rows={2} value={form.visitor_address} onChange={set('visitor_address')} className={inputClass} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className={labelClass}>County</span>
              <input type="text" value={form.county} onChange={set('county')} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Town/City</span>
              <input type="text" value={form.town_city} onChange={set('town_city')} className={inputClass} />
            </label>
          </div>
          <label className="block"><span className={labelClass}>Prayer Request</span>
            <textarea rows={2} value={form.prayer_request} onChange={set('prayer_request')} className={inputClass} />
          </label>

          <label className="block"><span className={labelClass}>Username</span>
            <input
              type="text" value={effectiveUsername}
              onChange={(e) => { setUsernameTouched(true); setForm({ ...form, username: e.target.value }) }}
              required className={inputClass}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className={labelClass}>Password *</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={set('password')} className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xl" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <label className="block"><span className={labelClass}>Confirm Password *</span>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} value={form.confirm_password} onChange={set('confirm_password')} className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xl" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 border-l-4 border-danger-500 p-4 text-danger-800">
              <p className="font-semibold text-sm">⚠️ {error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-gradient-hero text-white px-6 py-3 font-bold text-lg hover:shadow-lg transition disabled:opacity-60">
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}
