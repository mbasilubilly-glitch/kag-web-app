import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'
import Avatar from '../components/Avatar'
import PasswordInput from '../components/PasswordInput'
import SecurityQuestionsSettings from '../components/SecurityQuestionsSettings'
import MyConsoleNav from '../components/MyConsoleNav'
import useAuth from '../hooks/useAuth'

const GENDERS = ['Male', 'Female', 'Other']
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed']

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback)
}

export default function Profile() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const [pictureFile, setPictureFile] = useState(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const load = () => {
    api.get('/auth/profile/')
      .then((response) => {
        setProfile(response.data)
        setForm({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          profile: {
            phone: response.data.profile?.phone || '',
            gender: response.data.profile?.gender || '',
            date_of_birth: response.data.profile?.date_of_birth || '',
            national_id: response.data.profile?.national_id || '',
            occupation: response.data.profile?.occupation || '',
            marital_status: response.data.profile?.marital_status || '',
            residential_address: response.data.profile?.residential_address || '',
            county: response.data.profile?.county || '',
            town_city: response.data.profile?.town_city || '',
            emergency_contact_name: response.data.profile?.emergency_contact_name || '',
            emergency_contact_phone: response.data.profile?.emergency_contact_phone || '',
          },
        })
      })
      .catch(() => setError('Unable to load your profile.'))
  }

  useEffect(() => { load() }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setProfileField = (key) => (e) => setForm({ ...form, profile: { ...form.profile, [key]: e.target.value } })

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        profile: { ...form.profile, date_of_birth: form.profile.date_of_birth || null },
      }
      const res = await api.patch('/auth/profile/', payload)
      setProfile(res.data)
      setNotice('Profile updated.')
    } catch (err) {
      setError(readableError(err, 'Unable to save your profile.'))
    } finally {
      setSaving(false)
    }
  }

  const handlePictureUpload = async (e) => {
    e.preventDefault()
    if (!pictureFile) return
    setError('')
    setNotice('')
    setUploadingPicture(true)
    try {
      const fd = new FormData()
      fd.append('profile_picture', pictureFile)
      const res = await api.patch('/auth/profile/picture/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProfile(res.data)
      setPictureFile(null)
      setNotice('Profile picture updated.')
    } catch (err) {
      setError(readableError(err, 'Unable to upload your profile picture.'))
    } finally {
      setUploadingPicture(false)
    }
  }

  const handlePictureRemove = async () => {
    if (!confirm('Remove your profile picture?')) return
    setError('')
    setNotice('')
    setUploadingPicture(true)
    try {
      const res = await api.delete('/auth/profile/picture/')
      setProfile(res.data)
      setNotice('Profile picture removed.')
    } catch (err) {
      setError(readableError(err, 'Unable to remove your profile picture.'))
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordNotice('')

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setChangingPassword(true)
    try {
      await api.post('/auth/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      // Changing the password invalidates every session, including this
      // one (see MemberProfile.tokens_invalid_before) - sign out and send
      // the user to sign back in with the new password, rather than
      // leaving them here to be silently logged out on their next click.
      signOut()
      navigate('/signin', { state: { message: 'Password changed. Please sign in again with your new password.' } })
      return
    } catch (err) {
      setPasswordError(readableError(err, 'Unable to change password.'))
    } finally {
      setChangingPassword(false)
    }
  }

  if (error && !profile) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-red-100 p-8 text-red-800">{error}</div>
      </div>
    )
  }

  if (!profile || !form) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-slate-100 p-10 text-slate-600">Loading profile...</div>
      </div>
    )
  }

  const roleLabel = profile.is_staff && profile.is_superuser ? 'Super Admin' : (profile.profile?.role || 'Visitor')

  return (
    <div className="container py-10 space-y-8">
      <MyConsoleNav />

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-slate-600 mt-2">Manage your account details, update contact information, and upload a profile picture.</p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <div className="rounded-3xl bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-5">
          <Avatar
            src={profile.profile?.profile_picture || profile.profile?.profile_image}
            name={`${profile.first_name || ''} ${profile.last_name || ''}`}
            size={88}
            className="ring-4 ring-slate-100 shadow-md"
          />
          <div>
            <p className="text-slate-900 text-xl font-semibold">{`${profile.first_name} ${profile.last_name}`}</p>
            <p className="text-slate-600">{roleLabel}</p>
            {profile.profile?.member_number && <p className="text-slate-500 text-sm">Member #{profile.profile.member_number}</p>}
          </div>
        </div>
        <form onSubmit={handlePictureUpload} className="flex flex-wrap items-center gap-3">
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setPictureFile(e.target.files?.[0] || null)} className="text-sm" />
          <button disabled={!pictureFile || uploadingPicture} type="submit" className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {uploadingPicture ? 'Uploading…' : pictureFile ? 'Save Picture' : 'Upload Picture'}
          </button>
          {profile.profile?.profile_picture && (
            <button
              type="button"
              disabled={uploadingPicture}
              onClick={handlePictureRemove}
              className="rounded-2xl border border-red-200 text-red-700 px-5 py-2.5 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
            >
              Remove Picture
            </button>
          )}
        </form>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl bg-white p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Edit Profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700 text-sm">First Name</span>
            <input required value={form.first_name} onChange={set('first_name')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Last Name</span>
            <input value={form.last_name} onChange={set('last_name')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Email</span>
            <input required type="email" value={form.email} onChange={set('email')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Phone</span>
            <input value={form.profile.phone} onChange={setProfileField('phone')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Gender</span>
            <select value={form.profile.gender} onChange={setProfileField('gender')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Select…</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">Date of Birth</span>
            <input type="date" value={form.profile.date_of_birth || ''} onChange={setProfileField('date_of_birth')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">National ID/Passport Number</span>
            <input value={form.profile.national_id} onChange={setProfileField('national_id')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Occupation</span>
            <input value={form.profile.occupation} onChange={setProfileField('occupation')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Marital Status</span>
            <select value={form.profile.marital_status} onChange={setProfileField('marital_status')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Select…</option>
              {MARITAL_STATUSES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">County</span>
            <input value={form.profile.county} onChange={setProfileField('county')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Town/City</span>
            <input value={form.profile.town_city} onChange={setProfileField('town_city')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="md:col-span-2">
            <span className="text-slate-700 text-sm">Residential Address</span>
            <textarea rows={2} value={form.profile.residential_address} onChange={setProfileField('residential_address')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Emergency Contact Name</span>
            <input value={form.profile.emergency_contact_name} onChange={setProfileField('emergency_contact_name')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Emergency Contact Phone</span>
            <input value={form.profile.emergency_contact_phone} onChange={setProfileField('emergency_contact_phone')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        <button disabled={saving} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="rounded-3xl bg-white p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Change Password</h2>
        <p className="text-slate-600 text-sm">
          If an administrator set or reset your password, use this to replace it with one only you know.
        </p>
        {passwordError && <div className="rounded-2xl bg-red-100 p-4 text-red-800 text-sm">{passwordError}</div>}
        {passwordNotice && <div className="rounded-2xl bg-green-100 p-4 text-green-800 text-sm">{passwordNotice}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <label className="md:col-span-2">
            <span className="text-slate-700 text-sm">Current Password</span>
            <PasswordInput
              required
              autoComplete="current-password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label>
            <span className="text-slate-700 text-sm">New Password</span>
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Confirm New Password</span>
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
        </div>
        <button disabled={changingPassword} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {changingPassword ? 'Changing…' : 'Change Password'}
        </button>
      </form>

      <SecurityQuestionsSettings />
    </div>
  )
}
