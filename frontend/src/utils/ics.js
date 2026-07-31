// Minimal RFC 5545 VEVENT builder for "Add to Calendar" - no existing ICS
// code anywhere in the codebase, so this is deliberately small: just
// enough fields for a single downloadable .ics file, not a full calendar.
function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(text) {
  return String(text || '').replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

export function buildIcsFile({ title, description, location, start, end }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KAG Unity Church PWA//Online Meetings//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@kagunitychurch`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return new Blob([lines.join('\r\n')], { type: 'text/calendar' })
}

export function downloadIcsFile(meeting) {
  const start = new Date(`${meeting.meeting_date}T${meeting.start_time}`)
  const end = new Date(`${meeting.meeting_date}T${meeting.end_time}`)
  const blob = buildIcsFile({
    title: meeting.title,
    description: meeting.description || '',
    location: meeting.meeting_link,
    start,
    end,
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${meeting.title.replace(/[^a-z0-9]+/gi, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
