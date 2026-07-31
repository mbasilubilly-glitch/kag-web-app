// Shows a user's uploaded/URL profile photo, or a navy/gold initials
// circle (matching the app's gradient-hero token) when no photo exists.
export default function Avatar({ src, name = '', size = 40, className = '' }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        className={`rounded-full object-cover shrink-0 bg-primary-100 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={name ? `${name}'s initials` : 'User avatar'}
      className={`rounded-full flex items-center justify-center shrink-0 bg-gradient-hero text-white font-display font-bold shadow-md ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}
