import { useEffect, useState } from 'react'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'
import { SECURITY_QUESTION_BANK, CUSTOM_QUESTION_OPTION } from '../utils/securityQuestionBank'

const EMPTY_ROW = { question: SECURITY_QUESTION_BANK[0], customQuestion: '', answer: '' }

export default function SecurityQuestionsSettings() {
  const [configured, setConfigured] = useState(null)
  const [rows, setRows] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW, question: SECURITY_QUESTION_BANK[1] }])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () => {
    api.get('/security-questions/mine/')
      .then((res) => setConfigured(res.data || []))
      .catch(() => setConfigured([]))
  }

  useEffect(load, [])

  const addRow = () => {
    if (rows.length >= 3) return
    setRows([...rows, { ...EMPTY_ROW }])
  }

  const removeRow = (index) => {
    if (rows.length <= 2) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index, patch) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

    const questions = rows.map((r) => ({
      question: r.question === CUSTOM_QUESTION_OPTION ? r.customQuestion.trim() : r.question,
      answer: r.answer.trim(),
    }))

    if (questions.some((q) => !q.question || !q.answer)) {
      setError('Every question needs both a question and an answer.')
      return
    }

    setSaving(true)
    try {
      await api.put('/security-questions/mine/', { questions })
      setNotice('Security questions saved.')
      setEditing(false)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to save security questions.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">Security Questions</h2>
      <p className="text-slate-600 text-sm">
        Set 2-3 security questions so you can reset your password directly in the app if you ever lose access to
        your email - no code needed.
      </p>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-red-800 text-sm">{error}</div>}
      {notice && <div className="rounded-2xl bg-green-100 p-4 text-green-800 text-sm">{notice}</div>}

      {!editing && configured !== null && (
        <div className="space-y-3">
          {configured.length > 0 ? (
            <div className="text-sm text-slate-700 space-y-1">
              <p className="font-medium">Configured questions:</p>
              <ul className="list-disc list-inside">
                {configured.map((q) => <li key={q.id}>{q.question}</li>)}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No security questions set up yet.</p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
          >
            {configured.length > 0 ? 'Update Security Questions' : 'Set Up Security Questions'}
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-4">
          {rows.map((row, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Question {i + 1}</span>
                {rows.length > 2 && (
                  <button type="button" onClick={() => removeRow(i)} className="text-red-600 text-xs font-semibold">
                    Remove
                  </button>
                )}
              </div>
              <select
                value={row.question}
                onChange={(e) => updateRow(i, { question: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {SECURITY_QUESTION_BANK.map((q) => <option key={q} value={q}>{q}</option>)}
                <option value={CUSTOM_QUESTION_OPTION}>{CUSTOM_QUESTION_OPTION}</option>
              </select>
              {row.question === CUSTOM_QUESTION_OPTION && (
                <input
                  type="text"
                  placeholder="Your custom question"
                  value={row.customQuestion}
                  onChange={(e) => updateRow(i, { customQuestion: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              )}
              <input
                type="text"
                placeholder="Your answer"
                value={row.answer}
                onChange={(e) => updateRow(i, { answer: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}

          {rows.length < 3 && (
            <button type="button" onClick={addRow} className="text-sm font-semibold text-primary-700">
              + Add another question
            </button>
          )}

          <div className="flex gap-2">
            <button disabled={saving} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Security Questions'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
