import { useEffect, useRef, useState } from 'react'
import useTheme from '../hooks/useTheme'

const OPTIONS = [
  { value: 'system', label: 'System Default', icon: '💻' },
  { value: 'light', label: 'Light Mode', icon: '☀️' },
  { value: 'dark', label: 'Dark Mode', icon: '🌙' },
]

export default function ThemeToggle({ className = '' }) {
  const { isDark, preference, setPreference } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const current = OPTIONS.find((o) => o.value === preference) || OPTIONS[0]

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change appearance"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Appearance"
        className="w-9 h-9 rounded-full flex items-center justify-center text-base bg-white/10 hover:bg-white/20 transition"
      >
        {isDark ? '🌙' : current.value === 'system' ? '💻' : '☀️'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-surface-dark shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-30"
        >
          <p className="px-3 pt-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
            Appearance
          </p>
          {OPTIONS.map((option) => {
            const active = option.value === preference
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setPreference(option.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition ${
                  active
                    ? 'text-primary-700 dark:text-secondary-300 font-semibold'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-base leading-none">{option.icon}</span>
                <span className="flex-1">{option.label}</span>
                {active && <span className="text-primary-600 dark:text-secondary-400">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
