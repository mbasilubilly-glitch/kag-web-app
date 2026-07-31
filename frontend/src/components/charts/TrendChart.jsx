import { useMemo, useState } from 'react'

// Sequential single hue (blue), light->dark - see the dataviz skill's
// reference palette. One series here, so no legend box is needed; the
// chart's own title names what's plotted.
const LINE_COLOR = '#2a78d6'
const AREA_COLOR = 'rgba(42, 120, 214, 0.1)'
const GRID_COLOR = '#e1e0d9'
const AXIS_COLOR = '#c3c2b7'
const TEXT_MUTED = '#898781'
const TEXT_SECONDARY = '#52514e'

const WIDTH = 640
const HEIGHT = 260
const PAD = { top: 16, right: 16, bottom: 32, left: 56 }

function niceMax(max) {
  if (max <= 0) return 100
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  const normalized = max / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

export default function TrendChart({ data = [], loading, valuePrefix = 'KES ' }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom

  const maxValue = useMemo(() => niceMax(Math.max(...data.map((d) => d.value), 0)), [data])

  const points = useMemo(() => {
    if (data.length === 0) return []
    const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0
    return data.map((d, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + plotHeight - (maxValue ? (d.value / maxValue) * plotHeight : 0),
      ...d,
    }))
  }, [data, maxValue, plotWidth, plotHeight])

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${PAD.top + plotHeight} L ${points[0].x} ${PAD.top + plotHeight} Z`
    : ''

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD.top + plotHeight - f * plotHeight,
    value: Math.round(maxValue * f),
  }))

  // Show every Nth x-label so labels don't collide when there are many points.
  const labelEvery = Math.ceil(data.length / 8) || 1

  const handleMove = (e) => {
    if (!points.length) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    const localX = (e.clientX - rect.left) * scaleX
    let nearest = 0
    let nearestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - localX)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  if (loading) {
    return <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Loading trend…</div>
  }
  if (!data.length) {
    return <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data yet.</div>
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const tooltipOnRight = hovered && hovered.x < WIDTH - 140

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto"
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIndex(null)}
      role="img"
      aria-label="Trend chart"
    >
      {yTicks.map((t) => (
        <g key={t.y}>
          <line x1={PAD.left} y1={t.y} x2={WIDTH - PAD.right} y2={t.y} stroke={GRID_COLOR} strokeWidth="1" />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill={TEXT_MUTED}>
            {t.value >= 1000 ? `${(t.value / 1000).toFixed(t.value % 1000 === 0 ? 0 : 1)}K` : t.value}
          </text>
        </g>
      ))}

      <line x1={PAD.left} y1={PAD.top + plotHeight} x2={WIDTH - PAD.right} y2={PAD.top + plotHeight} stroke={AXIS_COLOR} strokeWidth="1" />

      {points.map((p, i) =>
        i % labelEvery === 0 || i === points.length - 1 ? (
          <text key={p.label + i} x={p.x} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill={TEXT_MUTED}>
            {p.label}
          </text>
        ) : null
      )}

      {areaPath && <path d={areaPath} fill={AREA_COLOR} />}
      <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* End-dot on the last point, >=8px, with a surface ring */}
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill={LINE_COLOR} stroke="#ffffff" strokeWidth="2" />
      )}

      {hovered && (
        <>
          <line x1={hovered.x} y1={PAD.top} x2={hovered.x} y2={PAD.top + plotHeight} stroke={AXIS_COLOR} strokeWidth="1" />
          <circle cx={hovered.x} cy={hovered.y} r="5" fill={LINE_COLOR} stroke="#ffffff" strokeWidth="2" />
          <g transform={`translate(${tooltipOnRight ? hovered.x + 10 : hovered.x - 130}, ${Math.max(PAD.top, hovered.y - 36)})`}>
            <rect width="120" height="40" rx="8" fill="#0b0b0b" opacity="0.9" />
            <text x="10" y="17" fontSize="12" fontWeight="600" fill="#ffffff">
              {valuePrefix}{hovered.value.toLocaleString()}
            </text>
            <text x="10" y="31" fontSize="10" fill="#c3c2b7">
              {hovered.label}
            </text>
          </g>
        </>
      )}
    </svg>
  )
}
