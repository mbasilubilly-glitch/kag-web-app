import { useCallback, useEffect, useState } from 'react'

// Preference stored in localStorage is 'light' | 'dark' | absent (absent
// means "follow the system"). Mirrors the no-flash script in index.html,
// which applies the same logic before React mounts.
function getStoredPreference() {
  return localStorage.getItem('theme') || 'system'
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(preference) {
  const isDark = preference === 'dark' || (preference === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  return isDark
}

// Single source of truth for the light/dark theme, following the same
// "hook wraps localStorage + a DOM side effect" pattern as useAuth.
export default function useTheme() {
  const [preference, setPreference] = useState(getStoredPreference)
  const [isDark, setIsDark] = useState(() => applyTheme(getStoredPreference()))

  useEffect(() => {
    setIsDark(applyTheme(preference))
    if (preference === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', preference)
    }
  }, [preference])

  // While following the system, react live to the OS theme changing -
  // otherwise the app would only pick it up on next full reload.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setIsDark(applyTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const toggle = useCallback(() => {
    setPreference((prev) => {
      const currentlyDark = prev === 'dark' || (prev === 'system' && systemPrefersDark())
      return currentlyDark ? 'light' : 'dark'
    })
  }, [])

  return { isDark, preference, setPreference, toggle }
}
