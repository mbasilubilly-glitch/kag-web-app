import { useState } from 'react'
import api from '../api'

export default function Contact() {
  const [form, setForm] = useState({ full_name: '', email: '', subject: '', message: '' })
  const [statusMessage, setStatusMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatusMessage('')

    try {
      await api.post('/contact-messages/', {
        full_name: form.full_name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      })

      setStatusMessage('success')
      setForm({ full_name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setStatusMessage('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white px-4 py-16 md:py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 animate-fadeInUp">
            <span className="text-secondary-200 text-sm font-semibold">💬 Get in Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeInUp-delay-1">
            Contact <span className="bg-gradient-to-r from-secondary-300 to-secondary-100 bg-clip-text text-transparent">Us</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto animate-fadeInUp-delay-2">
            We'd love to hear from you. Send us a message or reach out using the information below.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6 animate-slideInLeft">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-primary-600">
              <div className="text-5xl mb-4">📞</div>
              <h2 className="text-2xl font-bold text-primary-800 mb-6">Contact Information</h2>
              
              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-xl">
                  <span className="text-2xl">📞</span>
                  <div>
                    <h3 className="font-semibold text-primary-700">Phone</h3>
                    <p className="text-gray-700">+254 725 812 019</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-secondary-50 rounded-xl">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <h3 className="font-semibold text-primary-700">Email</h3>
                    <p className="text-gray-700">info@kagunitychurch.org</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-accent-50 rounded-xl">
                  <span className="text-2xl">📍</span>
                  <div>
                    <h3 className="font-semibold text-accent-700">Address</h3>
                    <p className="text-gray-700 text-sm">
                      Thika Road, Toll Weighbridge<br />
                      400 meters from Adva Mall<br />
                      Next to Safaricom mast (Booster)
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/JLpRmyqLrNqQPdcE8"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-hero text-white font-bold rounded-xl hover:shadow-lg transition transform hover:-translate-y-1"
              >
                🗺️ Get Directions
              </a>
            </div>

            {/* Quick Response */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 border-l-4 border-secondary-500">
              <div className="flex items-center gap-4">
                <span className="text-4xl">⚡</span>
                <div>
                  <h3 className="font-bold text-primary-800">Quick Response</h3>
                  <p className="text-gray-600 text-sm">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-secondary-500 animate-slideInRight">
            <div className="text-5xl mb-4">💌</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-6">Send a Message</h2>

            {statusMessage === 'success' && (
              <div className="mb-6 p-4 bg-success-500/10 border border-success-500/20 rounded-xl text-success-700 flex items-center gap-3">
                <span>✅</span>
                <span className="font-medium">Message sent successfully. The admin will reply soon.</span>
              </div>
            )}
            {statusMessage === 'error' && (
              <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-700 flex items-center gap-3">
                <span>❌</span>
                <span className="font-medium">Unable to send message. Please try again.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                  placeholder="What is this about?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition resize-none"
                  placeholder="Write your message here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-8 py-4 bg-gradient-hero text-white font-bold rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">✉️ Send Message</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}