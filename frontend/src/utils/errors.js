// Pulls a human-readable message out of an axios error, in the same
// detail -> message -> error -> raw-string -> err.message -> fallback order
// every page used to reimplement independently (~17 copies before this was
// extracted). Pass `fields` to also check specific DRF serializer field
// errors (checked right after `detail`, since DRF responses are rarely
// both at once). Pass `useFirstField: true` for the "just grab whichever
// field the backend complained about first" behavior some registration
// forms relied on.
export function extractErrorMessage(err, fallback, { fields = [], useFirstField = false } = {}) {
  const data = err?.response?.data

  // No response at all (timeout or the request never reached the server) -
  // axios's own message ("timeout of 60000ms exceeded" / "Network Error")
  // reads as a bug report rather than a network issue, so give a clearer one.
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED') {
      return 'This is taking too long to respond. Please check your internet connection and try again.'
    }
    if (err?.message === 'Network Error') {
      return 'Unable to reach the server. Please check your internet connection and try again.'
    }
  }

  if (useFirstField && data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0]
    if (firstKey) {
      const value = data[firstKey]
      return Array.isArray(value) ? value[0] : String(value)
    }
  }

  const fieldMessage = fields
    .map((field) => data?.[field])
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .find(Boolean)

  return (
    data?.detail ||
    fieldMessage ||
    data?.message ||
    data?.error ||
    (typeof data === 'string' ? data : null) ||
    err?.message ||
    fallback
  )
}
