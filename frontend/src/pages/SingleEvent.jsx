import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function SingleEvent() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/events/${id}/`)
      .then((response) => setEvent(response.data))
      .catch(() => setError('Unable to load event details.'))
  }, [id])

  return (
    <div className="container py-10">
      {error ? (
        <div className="rounded-3xl bg-red-100 p-8 text-red-800">{error}</div>
      ) : event ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm space-y-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-slate-600">{new Date(event.date).toLocaleString()}</p>
          <p className="text-slate-600">Venue: {event.venue}</p>
          {event.image && <img src={event.image} alt={event.title} className="rounded-3xl w-full object-cover" />}
          <p className="text-slate-700">{event.description}</p>
          <div className="rounded-2xl bg-slate-100 p-6">
            <h2 className="text-xl font-semibold mb-2">Event Registration</h2>
            <p className="text-slate-600">Register through the mobile app or contact the church office for more details.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-100 p-10 text-slate-600">Loading event details...</div>
      )}
    </div>
  )
}
