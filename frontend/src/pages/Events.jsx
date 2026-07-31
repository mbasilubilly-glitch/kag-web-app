import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Events() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/events/')
      .then((res) => {
        setEvents(res.data || [])
        setError('')
      })
      .catch((err) => {
        console.error('Failed to load events:', err)
        setError('Unable to load events. Please try again later.')
      })
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Header Section */}
      <section className="bg-gradient-hero text-white px-4 py-12 md:py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">📅 Church Events</h1>
          <p className="text-lg text-primary-100">Register for conferences, worship nights, youth meetings, and community outreach activities.</p>
        </div>
      </section>

      {/* Content Section */}
      <div className="container px-4 py-12">
        {error && (
          <div className="mb-8 rounded-2xl bg-danger-50 border-l-4 border-danger-500 p-6 text-danger-800">
            <p className="font-semibold">⚠️ Unable to Load</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 && !error ? (
          <div className="rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-700 font-semibold text-lg">No events scheduled</p>
            <p className="text-gray-600 mt-2">Check back soon for upcoming events</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {events.map((event) => {
              const eventDate = new Date(event.date)
              return (
                <article key={event.id} className="group rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-2xl transition border-t-4 border-secondary-500 h-full flex flex-col">
                  {/* Date Badge */}
                  <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-secondary-100">Event Date</div>
                      <div className="text-2xl font-bold">{eventDate.getDate()}</div>
                      <div className="text-sm">{eventDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span className="text-5xl opacity-50">📅</span>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-6 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-primary-800 group-hover:text-primary-600 transition line-clamp-2">
                        {event.title}
                      </h2>
                    </div>

                    {event.venue && (
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-xl">📍</span>
                        <span className="text-gray-700"><strong>Venue:</strong> {event.venue}</span>
                      </div>
                    )}

                    {event.description && (
                      <p className="text-gray-600 line-clamp-3">{event.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500 text-xs">
                      <span>🕐</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 py-4 border-t border-gray-100">
                    <Link to={`/events/${event.id}`} className="block w-full px-4 py-3 bg-primary-600 text-white font-semibold text-center rounded-lg hover:bg-primary-700 transition">
                      View & Register →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
