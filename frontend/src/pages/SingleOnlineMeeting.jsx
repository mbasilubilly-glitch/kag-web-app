import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import { downloadIcsFile } from '../utils/ics'
import { extractErrorMessage as readableError } from '../utils/errors'
import JitsiMeetingRoom, { getJitsiRoomName } from '../components/JitsiMeetingRoom'

const POLL_INTERVAL_MS = 10000

export default function SingleOnlineMeeting() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [polls, setPolls] = useState([])
  const [questions, setQuestions] = useState([])
  const [prayerRequests, setPrayerRequests] = useState([])
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [prayerText, setPrayerText] = useState('')
  const intervalRef = useRef(null)

  const loadMeeting = () => api.get(`/online-meetings/${id}/`).then((res) => setMeeting(res.data))
  const loadPolls = () => api.get(`/online-meetings/${id}/polls/`).then((res) => setPolls(res.data || []))
  const loadQuestions = () => api.get(`/online-meetings/${id}/questions/`).then((res) => setQuestions(res.data || []))
  const loadPrayerRequests = () => api.get(`/online-meetings/${id}/prayer-requests/`).then((res) => setPrayerRequests(res.data || []))

  useEffect(() => {
    Promise.all([loadMeeting(), loadPolls(), loadQuestions(), loadPrayerRequests()])
      .catch(() => setError('Unable to load session details.'))

    api.get('/auth/profile/')
      .then((res) => {
        const name = `${res.data.first_name || ''} ${res.data.last_name || ''}`.trim()
        setDisplayName(name || res.data.username || '')
      })
      .catch(() => {})

    intervalRef.current = setInterval(() => {
      loadPolls().catch(() => {})
      loadQuestions().catch(() => {})
      loadPrayerRequests().catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const joinMeeting = async () => {
    setJoining(true)
    setError('')
    try {
      const res = await api.post(`/online-meetings/${id}/join/`)
      if (meeting.meeting_platform === 'built_in') {
        setInCall(true)
      } else {
        window.open(res.data.meeting_link, '_blank', 'noopener')
      }
    } catch (err) {
      setError(readableError(err, 'Unable to join this session.'))
    } finally {
      setJoining(false)
    }
  }

  const vote = async (pollId, optionId) => {
    try {
      await api.post(`/online-meetings/polls/${pollId}/vote/`, { option: optionId })
      await loadPolls()
    } catch (err) {
      setError(readableError(err, 'Unable to submit vote.'))
    }
  }

  const askQuestion = async (e) => {
    e.preventDefault()
    if (!questionText.trim()) return
    try {
      await api.post(`/online-meetings/${id}/questions/`, { question_text: questionText })
      setQuestionText('')
      await loadQuestions()
    } catch (err) {
      setError(readableError(err, 'Unable to submit question.'))
    }
  }

  const submitPrayerRequest = async (e) => {
    e.preventDefault()
    if (!prayerText.trim()) return
    try {
      await api.post(`/online-meetings/${id}/prayer-requests/`, { request: prayerText })
      setPrayerText('')
      await loadPrayerRequests()
    } catch (err) {
      setError(readableError(err, 'Unable to submit prayer request.'))
    }
  }

  if (error && !meeting) {
    return <div className="container py-10"><div className="rounded-3xl bg-red-100 p-8 text-red-800">{error}</div></div>
  }
  if (!meeting) {
    return <div className="container py-10"><div className="rounded-3xl bg-slate-100 p-10 text-slate-600">Loading session…</div></div>
  }

  const isPast = meeting.status === 'Ended' || meeting.status === 'Cancelled'

  return (
    <div className="container py-10 space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
            {meeting.status === 'Live' ? 'Live Now 🟢' : meeting.status}
          </span>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
          {meeting.speaker && <div><strong>Speaker:</strong> {meeting.speaker}</div>}
          {meeting.theme && <div><strong>Theme:</strong> {meeting.theme}</div>}
          {meeting.scripture_reference && <div><strong>Scripture:</strong> {meeting.scripture_reference}</div>}
          <div><strong>Date:</strong> {new Date(meeting.meeting_date).toLocaleDateString()}</div>
          <div><strong>Time:</strong> {meeting.start_time} - {meeting.end_time}</div>
        </div>

        {meeting.description && <p className="text-slate-700">{meeting.description}</p>}

        {!isPast && !inCall && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={!meeting.is_joinable || joining}
              onClick={joinMeeting}
              className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {joining ? 'Joining…' : 'Join Meeting'}
            </button>
            <button
              type="button"
              onClick={() => downloadIcsFile(meeting)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
            >
              Add to Calendar
            </button>
          </div>
        )}

        {!isPast && inCall && meeting.meeting_platform === 'built_in' && (
          <div className="space-y-2 pt-2">
            <JitsiMeetingRoom
              roomName={getJitsiRoomName(meeting.meeting_link)}
              displayName={displayName}
              onLeave={() => setInCall(false)}
            />
            <button
              type="button"
              onClick={() => setInCall(false)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
            >
              Leave Meeting
            </button>
          </div>
        )}

        {isPast && meeting.recording_url && (
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="font-semibold mb-2">🎥 Recording</h3>
            <a href={meeting.recording_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 font-semibold">
              Watch Recording →
            </a>
          </div>
        )}

        {meeting.attachments?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Attachments</h3>
            <div className="space-y-1">
              {meeting.attachments.map((a) => (
                <a key={a.id} href={a.file} target="_blank" rel="noopener noreferrer" className="block text-primary-700 text-sm">
                  📎 {a.label || 'Download attachment'}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isPast && (
        <>
          <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Polls</h2>
            {polls.length === 0 && <div className="text-slate-500 text-sm">No polls yet.</div>}
            {polls.map((poll) => (
              <div key={poll.id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="font-medium">{poll.question}</div>
                {poll.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => vote(poll.id, opt.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 text-sm flex items-center justify-between ${
                      poll.my_vote_option_id === opt.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <span>{opt.option_text}</span>
                    <span className="text-slate-500">{opt.vote_count}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Q&amp;A with the Speaker</h2>
            <form onSubmit={askQuestion} className="flex gap-2">
              <input
                type="text" placeholder="Ask a question…"
                value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold">Ask</button>
            </form>
            <div className="space-y-2">
              {questions.map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="font-medium">{q.question_text}</div>
                  <div className="text-slate-400 text-xs">— {q.asked_by_name}</div>
                  {q.answer_text && <div className="mt-2 text-slate-700">💬 {q.answer_text}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Prayer Requests</h2>
            <form onSubmit={submitPrayerRequest} className="flex gap-2">
              <input
                type="text" placeholder="Share a prayer request…"
                value={prayerText} onChange={(e) => setPrayerText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold">Submit</button>
            </form>
            <div className="space-y-2">
              {prayerRequests.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">{p.request}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
