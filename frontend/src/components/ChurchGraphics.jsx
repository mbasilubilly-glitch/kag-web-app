// Hand-built SVG graphics for the church system's homepage - not photography,
// not sourced from any external site. Uses the app's own navy/gold/teal
// design tokens so it always matches the rest of the UI. Swap any of these
// out for real photography later by replacing the component usage with an
// <img> in the same container.

export function HeroWorshipGraphic({ className = '' }) {
  return (
    <svg viewBox="0 0 400 320" className={className} role="img" aria-label="Rays of light behind a cross">
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="120" r="150" fill="url(#heroGlow)" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const x1 = 200 + Math.cos(angle) * 60
        const y1 = 120 + Math.sin(angle) * 60
        const x2 = 200 + Math.cos(angle) * 145
        const y2 = 120 + Math.sin(angle) * 145
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="white" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round"
          />
        )
      })}
      <circle cx="200" cy="120" r="58" fill="white" fillOpacity="0.12" />
      {/* Cross */}
      <rect x="188" y="70" width="24" height="110" rx="8" fill="white" />
      <rect x="152" y="106" width="96" height="24" rx="8" fill="white" />
      {/* Congregation silhouette along the base */}
      <g fill="#0d1f3f" fillOpacity="0.55">
        <path d="M40 320 Q40 250 80 250 Q120 250 120 320 Z" />
        <path d="M110 320 Q110 235 160 235 Q210 235 210 320 Z" />
        <path d="M195 320 Q195 245 240 245 Q285 245 285 320 Z" />
        <path d="M270 320 Q270 255 310 255 Q350 255 350 320 Z" />
        <circle cx="80" cy="228" r="20" />
        <circle cx="160" cy="212" r="22" />
        <circle cx="240" cy="222" r="21" />
        <circle cx="310" cy="232" r="19" />
      </g>
    </svg>
  )
}

export function CommunityGraphic({ className = '' }) {
  return (
    <svg viewBox="0 0 300 220" className={className} role="img" aria-label="Circle of hands joined together">
      <circle cx="150" cy="110" r="95" fill="white" fillOpacity="0.08" />
      <circle cx="150" cy="110" r="60" fill="white" fillOpacity="0.12" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
        const cx = 150 + Math.cos(angle) * 78
        const cy = 110 + Math.sin(angle) * 78
        return <circle key={i} cx={cx} cy={cy} r="16" fill="white" fillOpacity="0.9" />
      })}
      <circle cx="150" cy="110" r="22" fill="#fbbf24" />
    </svg>
  )
}

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

export function IconSermon({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v10a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 15.5v-10Z" />
      <path d="M8 8h4M8 11h4" />
      <path d="M16 8.5c2 .3 3.5 2 3.5 4s-1.5 3.7-3.5 4" />
      <path d="M9 17v2.2c0 .5.6.8 1 .5l2.6-2" />
    </svg>
  )
}

export function IconEvents({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
      <path d="M12 13.2 13 15l2-.3-1.4 1.5.3 2-1.9-.9-1.9.9.3-2L9 14.7l2-.3.5-1.6Z" />
    </svg>
  )
}

export function IconGraduation({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 4.5 2.5 9 12 13.5 21.5 9 12 4.5Z" />
      <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11" />
      <path d="M21.5 9v6" />
    </svg>
  )
}

export function IconHandshake({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M2.5 12.5 6 9l3 2.3 2-1.8 2.3 1.8L16 9l3.5 3.5" />
      <path d="M6 9 3.5 11.5a1.7 1.7 0 0 0 2.4 2.4L8 11.8" />
      <path d="M18 9l2.5 2.5a1.7 1.7 0 0 1-2.4 2.4L16 11.8" />
      <path d="M9 11.6l-1.6 1.6a1.5 1.5 0 0 0 2.1 2.1l.6-.5" />
      <path d="M15 11.6l1.6 1.6a1.5 1.5 0 0 1-2.1 2.1l-.6-.5" />
    </svg>
  )
}

export function IconClock({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconPray({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 3v6.5" />
      <path d="M12 9.5c-1.8 0-3 1.6-3 4.2V20" />
      <path d="M12 9.5c1.8 0 3 1.6 3 4.2V20" />
      <path d="M9 20h6" />
    </svg>
  )
}

export function IconGift({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3.5" y="9.5" width="17" height="11" rx="1.5" />
      <path d="M3.5 13.5h17" />
      <path d="M12 9.5v11" />
      <path d="M12 9.5c-1-3-3.2-4-4.5-3.2-1.3.8-1 3.2 4.5 3.2Z" />
      <path d="M12 9.5c1-3 3.2-4 4.5-3.2 1.3.8 1 3.2-4.5 3.2Z" />
    </svg>
  )
}

export function IconPin({ className = '' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}
