import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const GENDERS = ['Male', 'Female', 'Other']
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed']

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { useFirstField: true })
}

export default function RegisterMember() {
  const navigate = useNavigate()
  const [ministries, setMinistries] = useState([])
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', phone: '',
    gender: '', date_of_birth: '', national_id: '', occupation: '', marital_status: '',
    residential_address: '', county: '', town_city: '', emergency_contact_name: '', emergency_contact_phone: '',
    baptized: false, confirmed: false, preferred_department: '', church_branch: '',
    password: '', confirm_password: '', agreed_to_policies: false,
  })
  const [profilePicture, setProfilePicture] = useState(null)
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useState(() => {
    api.get('/ministries/').then((res) => setMinistries(res.data)).catch(() => {})
  }, [])

  const computedUsername = (() => {
    const base = `${form.first_name}${form.last_name ? ' ' + form.last_name : ''}`.trim()
    if (!form.first_name) return ''
    return base.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '')
  })()
  const effectiveUsername = usernameTouched ? form.username : computedUsername

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (!form.agreed_to_policies) {
      setError('You must agree to the Church Policies to register.')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'username') return
        if (value === '' || value === null || value === undefined) return
        fd.append(key, value)
      })
      fd.set('username', effectiveUsername)
      if (profilePicture) fd.append('profile_picture', profilePicture)

      await api.post('/auth/register/member/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/signin', { state: { message: 'Thank you. Your registration has been received. A Church Administrator will review your application — you will be able to sign in once approved.' } })
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
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="KAG Unity Church" className="inline-block w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          <h1 className="font-display text-3xl font-bold text-primary-800 mb-2">Church Member Registration</h1>
          <p className="text-gray-600">Full membership registration — reviewed by a Church Administrator.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-primary-600 space-y-8">
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-primary-800">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className={labelClass}>Full Name *</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="First name" required value={form.first_name} onChange={set('first_name')} className={inputClass} />
                  <input type="text" placeholder="Last name" value={form.last_name} onChange={set('last_name')} className={inputClass} />
                </div>
              </label>
              <label className="block"><span className={labelClass}>Gender</span>
                <select value={form.gender} onChange={set('gender')} className={inputClass}>
                  <option value="">Select…</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="block"><span className={labelClass}>Date of Birth</span>
                <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>National ID / Passport</span>
                <input type="text" value={form.national_id} onChange={set('national_id')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>Phone Number *</span>
                <input type="tel" required value={form.phone} onChange={set('phone')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>Email Address *</span>
                <input type="email" required value={form.email} onChange={set('email')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>Occupation</span>
                <input type="text" value={form.occupation} onChange={set('occupation')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>Marital Status</span>
                <select value={form.marital_status} onChange={set('marital_status')} className={inputClass}>
                  <option value="">Select…</option>
                  {MARITAL_STATUSES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <label className="block"><span className={labelClass}>Residential Address</span>
              <textarea rows={2} value={form.residential_address} onChange={set('residential_address')} className={inputClass} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className={labelClass}>County</span>
                <input type="text" value={form.county} onChange={set('county')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>Town/City</span>
                <input type="text" value={form.town_city} onChange={set('town_city')} className={inputClass} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className={labelClass}>Emergency Contact Name</span>
                <input type="text" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} className={inputClass} />
              </label>
              <label className="block"><span className={labelClass}>Emergency Contact Phone</span>
                <input type="tel" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} className={inputClass} />
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-primary-800">Church Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.baptized} onChange={set('baptized')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700">Baptized?</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.confirmed} onChange={set('confirmed')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700">Confirmed?</span>
              </label>
              <label className="block"><span className={labelClass}>Preferred Department</span>
                <select value={form.preferred_department} onChange={set('preferred_department')} className={inputClass}>
                  <option value="">Select…</option>
                  {ministries.map((m) => <option key={m.id} value={m.id}>{m.ministry_name}</option>)}
                </select>
              </label>
              <label className="block"><span className={labelClass}>Church Branch</span>
                <input type="text" placeholder="e.g. Main Campus" value={form.church_branch} onChange={set('church_branch')} className={inputClass} />
              </label>
            </div>
            <label className="block"><span className={labelClass}>Profile Picture</span>
              <input type="file" accept="image/*" onChange={(e) => setProfilePicture(e.target.files?.[0] || null)} className={inputClass} />
            </label>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-primary-800">Account</h2>
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
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={form.agreed_to_policies} onChange={set('agreed_to_policies')} className="w-4 h-4 mt-1 accent-primary-600" />
              <span className="text-sm text-gray-700">I agree to the Church Policies *</span>
            </label>
          </section>

          {error && (
            <div className="rounded-lg bg-danger-50 border-l-4 border-danger-500 p-4 text-danger-800">
              <p className="font-semibold text-sm">⚠️ {error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-gradient-hero text-white px-6 py-3 font-bold text-lg hover:shadow-lg transition disabled:opacity-60">
            {submitting ? 'Submitting…' : 'REGISTER'}
          </button>
        </form>
      </div>
    </div>
  )
}
