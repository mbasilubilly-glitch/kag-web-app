import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterChoice() {
  const [choice, setChoice] = useState('member')
  const navigate = useNavigate()

  const handleContinue = (e) => {
    e.preventDefault()
    navigate(choice === 'visitor' ? '/register/visitor' : '/register/member')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="KAG Unity Church" className="inline-block w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg" />
          <h1 className="font-display text-3xl font-bold text-primary-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Only Visitors and Members can register publicly. Administrators are never self-registered.</p>
        </div>

        <form onSubmit={handleContinue} className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-primary-600 space-y-4">
          <p className="text-sm font-semibold text-primary-800">Register As</p>

          <label className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 cursor-pointer transition ${choice === 'member' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`}>
            <input
              type="radio"
              name="registerAs"
              value="member"
              checked={choice === 'member'}
              onChange={() => setChoice('member')}
              className="w-4 h-4 accent-primary-600"
            />
            <div>
              <div className="font-semibold text-gray-900">Church Member</div>
              <div className="text-sm text-gray-600">Full registration. Requires Church Administrator approval before you gain access.</div>
            </div>
          </label>

          <label className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 cursor-pointer transition ${choice === 'visitor' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`}>
            <input
              type="radio"
              name="registerAs"
              value="visitor"
              checked={choice === 'visitor'}
              onChange={() => setChoice('visitor')}
              className="w-4 h-4 accent-primary-600"
            />
            <div>
              <div className="font-semibold text-gray-900">Visitor</div>
              <div className="text-sm text-gray-600">Quick registration. Immediate access to the Visitor Dashboard.</div>
            </div>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-hero text-white px-6 py-3 font-bold text-lg hover:shadow-lg transition transform hover:-translate-y-0.5 shadow-md"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-700">Already have an account?
            <Link to="/signin" className="ml-2 text-primary-600 font-semibold hover:text-primary-700 hover:underline">
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
