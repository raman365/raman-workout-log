import { useId } from 'react'
import { fmtDate } from '../lib/lifts'

// Minimal SVG line chart. `data` is ascending [{ date: 'YYYY-MM-DD', value }].
// `theme` supplies: field, surfaceHex, chartStroke, chartDot, muted.
export default function TrendChart({ data, theme, unit = '' }) {
  const gradId = useId()
  if (data.length < 2) return null

  const W = 320
  const H = 120
  const padX = 10
  const padY = 14
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX * 2)
    const y = padY + (1 - (d.value - min) / range) * (H - padY * 2)
    return [x, y]
  })

  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${padX},${H - padY} ${line} ${W - padX},${H - padY}`

  return (
    <div className={`${theme.field} rounded-2xl p-3 mb-4`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.chartStroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={theme.chartStroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={theme.chartStroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill={theme.surfaceHex} stroke={theme.chartDot} strokeWidth="1.5" />
        ))}
      </svg>
      <div className={`flex justify-between text-[10px] font-semibold ${theme.muted} mt-1 px-1`}>
        <span>{fmtDate(data[0].date)}</span>
        <span className="tabular-nums">{min === max ? `${min}` : `${min} – ${max}${unit}`}</span>
        <span>{fmtDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  )
}
