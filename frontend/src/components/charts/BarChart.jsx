import { useMemo, useState } from 'react'

// One series -> one color for every bar (never a value-ramp on nominal
// categories - see the dataviz skill's anti-patterns). Sequential blue,
// same hue as TrendChart for a consistent "magnitude" language across the
// dashboard.
const BAR_COLOR = '#2a78d6'
const BAR_COLOR_HOVER = '#1c5cab'
const TEXT_PRIMARY = '#0b0b0b'
const TEXT_MUTED = '#898781'

const BAR_HEIGHT = 22
const BAR_GAP = 14
const LABEL_WIDTH = 130
const WIDTH = 520

export default function BarChart({ data = [], loading, valuePrefix = 'KES ', countLabel = 'transaction' }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data])
  const maxValue = Math.max(...sorted.map((d) => d.value), 1)
  const plotWidth = WIDTH - LABEL_WIDTH - 70
  const height = sorted.length * (BAR_HEIGHT + BAR_GAP) + BAR_GAP

  if (loading) {
    return <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
  }
  if (!sorted.length) {
    return <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet.</div>
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full h-auto" role="img" aria-label="Breakdown chart">
      {sorted.map((d, i) => {
        const barWidth = (d.value / maxValue) * plotWidth
        const y = BAR_GAP + i * (BAR_HEIGHT + BAR_GAP)
        const hovered = hoverIndex === i
        const labelFitsInside = barWidth > 70

        return (
          <g
            key={d.label}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            style={{ cursor: 'default' }}
          >
            {/* Larger transparent hit area than the painted bar */}
            <rect x={LABEL_WIDTH} y={y - 4} width={plotWidth + 60} height={BAR_HEIGHT + 8} fill="transparent" />

            <text x={LABEL_WIDTH - 10} y={y + BAR_HEIGHT / 2 + 4} textAnchor="end" fontSize="12" fill={TEXT_PRIMARY}>
              {d.label}
            </text>

            <rect
              x={LABEL_WIDTH}
              y={y}
              width={Math.max(barWidth, 2)}
              height={BAR_HEIGHT}
              rx="4"
              fill={hovered ? BAR_COLOR_HOVER : BAR_COLOR}
            />

            <text
              x={labelFitsInside ? LABEL_WIDTH + barWidth - 8 : LABEL_WIDTH + barWidth + 8}
              y={y + BAR_HEIGHT / 2 + 4}
              textAnchor={labelFitsInside ? 'end' : 'start'}
              fontSize="12"
              fontWeight="600"
              fill={labelFitsInside ? '#ffffff' : TEXT_PRIMARY}
            >
              {valuePrefix}{d.value.toLocaleString()}
            </text>

            {hovered && (
              <text x={LABEL_WIDTH + Math.max(barWidth, 2) / 2} y={y - 8} textAnchor="middle" fontSize="10" fill={TEXT_MUTED}>
                {d.count} {countLabel}{d.count === 1 ? '' : 's'}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
