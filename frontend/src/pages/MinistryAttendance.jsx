import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import { extractErrorMessage as readableError } from '../utils/errors'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', activeClass: 'bg-green-600 text-white' },
  { value: 'absent', label: 'Absent', activeClass: 'bg-slate-700 text-white' },
  { value: 'excused', label: 'Excused', activeClass: 'bg-amber-500 text-white' },
  { value: 'visitor', label: 'Visitor', activeClass: 'bg-primary-600 text-white' },
]

export default function MinistryAttendance() {
  const { id } = useParams()
  const [ministry, setMinistry] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [creating, setCreating] = useState(false)

  const [activeSession, setActiveSession] = useState(null)
  const [members, setMembers] = useState([])
  const [marks, setMarks] = useState({})
  const [savingMarks, setSavingMarks] = useState(false)

  const loadSessions = () => {
    return api.get(`/ministries/${id}/attendance/sessions/`).then((res) => setSessions(res.data))
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    Promise.all([
      api.get(`/ministries/${id}/`),
      loadSessions(),
      api.get(`/ministries/${id}/members/`),
    ])
      .then(([ministryRes, , membersRes]) => {
        if (!mounted) return
        setMinistry(ministryRes.data)
        setMembers(membersRes.data)
      })
      .catch(() => { if (mounted) setError('Unable to load attendance data.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  const createSession = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await api.post(`/ministries/${id}/attendance/sessions/`, { title: newTitle, session_date: newDate })
      setNewTitle('')
      setNewDate('')
      await loadSessions()
    } catch (err) {
      setError(readableError(err, 'Unable to create session.'))
    } finally {
      setCreating(false)
    }
  }

  const openSession = async (session) => {
    setError('')
    setNotice('')
    try {
      const res = await api.get(`/ministries/${id}/attendance/sessions/${session.id}/`)
      setActiveSession(res.data)
      const initialMarks = {}
      res.data.records.forEach((r) => { initialMarks[r.member] = r.status })
      setMarks(initialMarks)
    } catch (err) {
      setError(readableError(err, 'Unable to load session.'))
    }
  }

  const toggleMark = (memberId, status) => {
    setMarks((prev) => ({ ...prev, [memberId]: status }))
  }

  const saveMarks = async () => {
    if (!activeSession) return
    setSavingMarks(true)
    setError('')
    setNotice('')
    try {
      const records = members.map((m) => ({ member_id: m.user_id, status: marks[m.user_id] || 'absent' }))
      const res = await api.post(`/ministries/${id}/attendance/sessions/${activeSession.id}/mark/`, { records })
      setNotice(`Attendance saved (${res.data.created} created, ${res.data.updated} updated).`)
    } catch (err) {
      setError(readableError(err, 'Unable to save attendance.'))
    } finally {
      setSavingMarks(false)
    }
  }

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}
        {notice && <div className="p-4 bg-slate-100 text-slate-800 rounded mb-4">{notice}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4">Sessions</h2>

            <form onSubmit={createSession} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Session title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" disabled={creating} className="w-full rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {creating ? 'Creating…' : 'New Session'}
              </button>
            </form>

            {loading && <div className="text-slate-600 text-sm">Loading…</div>}
            <div className="space-y-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s)}
                  className={`w-full text-left rounded-xl px-3 py-2 text-sm border ${activeSession?.id === s.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="font-medium">{s.title || s.session_date}</div>
                  <div className="text-slate-500 text-xs">{s.session_date}</div>
                </button>
              ))}
              {!loading && sessions.length === 0 && <div className="text-slate-500 text-sm">No sessions yet.</div>}
            </div>
          </div>

          <div className="md:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            {!activeSession && <div className="text-slate-600">Select or create a session to mark attendance.</div>}

            {activeSession && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{activeSession.title || activeSession.session_date}</h2>
                  <button onClick={saveMarks} disabled={savingMarks} className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
                    {savingMarks ? 'Saving…' : 'Save Attendance'}
                  </button>
                </div>

                {members.length === 0 && <div className="text-slate-600">No enrolled members to mark.</div>}

                <div className="space-y-2">
                  {members.map((m) => {
                    const current = marks[m.user_id] || 'absent'
                    return (
                      <div key={m.user_id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                        <span className="font-medium">{`${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email}</span>
                        <div className="flex gap-2">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => toggleMark(m.user_id, opt.value)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${current === opt.value ? opt.activeClass : 'bg-slate-100 text-slate-600'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MinistryGuard>
  )
}
