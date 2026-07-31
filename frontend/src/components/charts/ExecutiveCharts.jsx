import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart,
  Legend, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import useTheme from '../../hooks/useTheme'

// Fixed-order categorical palette (validated for CVD-safe adjacent contrast -
// see the dataviz skill's reference palette). Slot order is the safety
// mechanism: it's assigned in sequence per series, never re-cycled or
// re-ordered per chart.
const CATEGORICAL = [
  { light: '#2a78d6', dark: '#3987e5' }, // 1 blue
  { light: '#008300', dark: '#008300' }, // 2 green
  { light: '#e87ba4', dark: '#d55181' }, // 3 magenta
  { light: '#eda100', dark: '#c98500' }, // 4 yellow
  { light: '#1baf7a', dark: '#199e70' }, // 5 aqua
  { light: '#eb6834', dark: '#d95926' }, // 6 orange
  { light: '#4a3aa7', dark: '#9085e9' }, // 7 violet
  { light: '#e34948', dark: '#e66767' }, // 8 red
]

const BRAND_BLUE = { light: '#2a78d6', dark: '#3987e5' }

// Status is a fixed, reserved scale - never reused for "series N".
const STATUS = { good: '#0ca30c', warning: '#fab219', neutral: BRAND_BLUE }

const GRID = { light: '#e1e0d9', dark: '#2c2c2a' }
const AXIS_TEXT = '#898781'

function useChartColors() {
  const { isDark } = useTheme()
  return {
    isDark,
    grid: isDark ? GRID.dark : GRID.light,
    surface: isDark ? '#1e293b' : '#ffffff',
    axis: AXIS_TEXT,
    pick: (slot) => (isDark ? slot.dark : slot.light),
  }
}

function formatValue(value, valuePrefix) {
  if (typeof value !== 'number') return value
  const compact = Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString()
  return `${valuePrefix}${compact}`
}

function ChartTooltip({ active, payload, label, valuePrefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-slate-700 shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color || entry.fill }} />
          <span>{entry.name}: {formatValue(entry.value, valuePrefix)}</span>
        </p>
      ))}
    </div>
  )
}

// Empty/loading state shared by every chart slot below.
function ChartFrame({ loading, empty, children, height = 260 }) {
  if (loading) {
    return <div className="animate-pulse bg-gray-100 dark:bg-slate-700/40 rounded-xl" style={{ height }} />
  }
  if (empty) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400 dark:text-slate-500" style={{ height }}>
        No data yet
      </div>
    )
  }
  return <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
}

// Church Growth / Financial Trends / Event Registration - single-series
// line with a light area wash. One series needs no legend box.
export function LineTrendChart({ data, loading, valuePrefix = '' }) {
  const { grid, axis, surface, pick } = useChartColors()
  const color = pick(BRAND_BLUE)
  return (
    <ChartFrame loading={loading} empty={!data?.length}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis }} axisLine={{ stroke: grid }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.1}
          dot={{ r: 4, fill: color, stroke: surface, strokeWidth: 2 }}
          activeDot={{ r: 5, fill: color, stroke: surface, strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartFrame>
  )
}

// Attendance Analytics / Homecell Growth - single-series vertical bar.
export function BarTrendChart({ data, loading, valuePrefix = '' }) {
  const { grid, axis, pick } = useChartColors()
  const color = pick(BRAND_BLUE)
  return (
    <ChartFrame loading={loading} empty={!data?.length}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis }} axisLine={{ stroke: grid }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} />} cursor={{ fill: color, fillOpacity: 0.06 }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartFrame>
  )
}

// Prayer Statistics - single-series bar, but each bar is a workflow state,
// so it draws from the reserved status scale instead of the categorical set.
export function StatusBarChart({ data, loading, statusMap }) {
  const { grid, axis, pick } = useChartColors()
  return (
    <ChartFrame loading={loading} empty={!data?.length}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis }} axisLine={{ stroke: grid }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#888', fillOpacity: 0.06 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data?.map((entry) => {
            const status = statusMap[entry.label] || 'neutral'
            const color = status === 'neutral' ? pick(BRAND_BLUE) : STATUS[status]
            return <Cell key={entry.label} fill={color} />
          })}
        </Bar>
      </BarChart>
    </ChartFrame>
  )
}

// Ministry Performance - horizontal bar, top N ministries by member count.
export function HorizontalBarChart({ data, loading, valuePrefix = '' }) {
  const { grid, axis, pick } = useChartColors()
  const color = pick(BRAND_BLUE)
  const height = Math.max(220, (data?.length || 0) * 34)
  return (
    <ChartFrame loading={loading} empty={!data?.length} height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: axis }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} />} cursor={{ fill: color, fillOpacity: 0.06 }} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ChartFrame>
  )
}

// Stacked bar - one series per category, fixed categorical order (assigned
// in sequence, never re-cycled per chart).
export function StackedBarChart({ data, loading, series, valuePrefix = '' }) {
  const { grid, axis, pick } = useChartColors()
  return (
    <ChartFrame loading={loading} empty={!data?.length}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis }} axisLine={{ stroke: grid }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} />} cursor={{ fill: '#888', fillOpacity: 0.06 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
        {series.map((key, i) => (
          <Bar key={key} dataKey={key} stackId="stack" fill={pick(CATEGORICAL[i % CATEGORICAL.length])} maxBarSize={28} />
        ))}
      </BarChart>
    </ChartFrame>
  )
}

// Member Distribution - pie, one slice per role, fixed categorical order.
export function DistributionPieChart({ data, loading }) {
  const { surface, pick } = useChartColors()
  return (
    <ChartFrame loading={loading} empty={!data?.length}>
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={2}
          stroke={surface}
          strokeWidth={2}
        >
          {data?.map((entry, i) => (
            <Cell key={entry.label} fill={pick(CATEGORICAL[i % CATEGORICAL.length])} />
          ))}
        </Pie>
      </PieChart>
    </ChartFrame>
  )
}

// Visitor Conversion - funnel. Stages are ordinal (order carries meaning),
// so this draws from one hue at monotone lightness steps, not the
// categorical set.
const FUNNEL_OPACITY = [1, 0.7, 0.45]

export function ConversionFunnelChart({ data, loading }) {
  const { pick } = useChartColors()
  const color = pick(BRAND_BLUE)
  return (
    <ChartFrame loading={loading} empty={!data?.length}>
      <FunnelChart margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
        <Tooltip content={<ChartTooltip />} />
        <Funnel dataKey="value" nameKey="label" data={data} isAnimationActive>
          {data?.map((entry, i) => (
            <Cell key={entry.label} fillOpacity={FUNNEL_OPACITY[i % FUNNEL_OPACITY.length]} fill={color} />
          ))}
          <LabelList dataKey="label" position="right" fill="currentColor" className="text-xs fill-gray-600 dark:fill-slate-300" stroke="none" />
          <LabelList dataKey="value" position="center" fill="#ffffff" className="text-sm font-semibold" stroke="none" />
        </Funnel>
      </FunnelChart>
    </ChartFrame>
  )
}
