import { useMemo } from 'react'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'
import { setE1RM, fmtDate, fmtAgo } from '../lib/lifts'
import TrendChart from './TrendChart'

const CHART_THEME = {
  field: 'bg-[#131f35]',
  surfaceHex: '#0d1526',
  chartStroke: '#3b82f6',
  chartDot: '#60a5fa',
  muted: 'text-blue-300/40',
}

const round1 = (n) => Math.round(n * 10) / 10

// session_logs rows -> ascending sessions with per-session best e1RM, volume,
// and whether that session beat every session before it.
function groupSessions(rows) {
  const byDate = new Map()
  for (const r of rows) {
    if (!byDate.has(r.session_date)) byDate.set(r.session_date, [])
    byDate.get(r.session_date).push(r)
  }
  let bestSoFar = 0
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, sets]) => {
      sets = [...sets].sort((a, b) => a.set_number - b.set_number)
      const e1rm = Math.max(0, ...sets.map((s) => setE1RM(s) || 0))
      const topSet = sets.find((s) => (setE1RM(s) || 0) === e1rm)
      const volume = sets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
      const isPR = bestSoFar > 0 && e1rm > bestSoFar
      bestSoFar = Math.max(bestSoFar, e1rm)
      return { date, sets, e1rm, topSet, volume, isPR }
    })
}

export default function ExerciseHistoryModal({ name, history, onClose }) {
  useLockBodyScroll()

  const sessions = useMemo(() => groupSessions(history), [history])

  const best = sessions.reduce((b, s) => (s.e1rm > (b?.e1rm ?? 0) ? s : b), null)
  const heaviest = history.reduce((h, s) => {
    const w = parseFloat(s.weight) || 0
    const hw = parseFloat(h?.weight) || 0
    if (w > hw || (w === hw && (parseInt(s.reps) || 0) > (parseInt(h?.reps) || 0))) return s
    return h
  }, null)
  const chartData = sessions.filter((s) => s.e1rm > 0).map((s) => ({ date: s.date, value: round1(s.e1rm) }))

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0d1526] border border-blue-900/30 rounded-2xl p-6 max-h-[85vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 className="text-white font-black text-lg tracking-wide leading-tight">{name}</h2>
            <p className="text-blue-400/40 text-xs mt-0.5">History &amp; PRs</p>
          </div>
          <button onClick={onClose} className="text-blue-400/40 hover:text-blue-400 text-xl transition-colors shrink-0">✕</button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 px-2 text-blue-300/30 text-sm font-semibold leading-relaxed">
            No sessions saved yet.
            <br />
            Log your sets and tap <span className="text-blue-300/60">Finish Workout</span> to start building history.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl px-2 py-3 text-center">
                <p className="text-blue-300/50 text-[10px] font-bold uppercase tracking-widest">Best e1RM</p>
                <p className="text-white text-xl font-black tabular-nums mt-0.5">{best ? Math.round(best.e1rm) : '—'}</p>
                {best && <p className="text-blue-400/40 text-[10px] font-semibold">{fmtDate(best.date)}</p>}
              </div>
              <div className="bg-[#131f35] border border-blue-900/30 rounded-xl px-2 py-3 text-center">
                <p className="text-blue-300/50 text-[10px] font-bold uppercase tracking-widest">Heaviest</p>
                <p className="text-white text-xl font-black tabular-nums mt-0.5">{heaviest ? heaviest.weight : '—'}</p>
                {heaviest && <p className="text-blue-400/40 text-[10px] font-semibold">× {heaviest.reps}</p>}
              </div>
              <div className="bg-[#131f35] border border-blue-900/30 rounded-xl px-2 py-3 text-center">
                <p className="text-blue-300/50 text-[10px] font-bold uppercase tracking-widest">Sessions</p>
                <p className="text-white text-xl font-black tabular-nums mt-0.5">{sessions.length}</p>
                <p className="text-blue-400/40 text-[10px] font-semibold">since {fmtDate(sessions[0].date)}</p>
              </div>
            </div>

            {chartData.length >= 2 && (
              <>
                <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest px-1 mb-2">Est. 1RM per session</p>
                <TrendChart data={chartData} theme={CHART_THEME} />
              </>
            )}

            <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest px-1 mb-2">Sessions</p>
            <div className="space-y-2">
              {[...sessions].reverse().map((s) => (
                <div key={s.date} className="bg-[#131f35] rounded-xl px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-blue-100 text-sm font-bold">{fmtDate(s.date)}</span>
                      <span className="text-blue-400/30 text-xs font-semibold"> · {fmtAgo(s.date)}</span>
                      {s.isPR && (
                        <span className="ml-2 text-[10px] font-black tracking-widest text-amber-400">★ PR</span>
                      )}
                    </div>
                    {s.e1rm > 0 && (
                      <span className="text-blue-300/70 text-xs font-bold tabular-nums shrink-0">
                        e1RM {Math.round(s.e1rm)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.sets.map((set) => (
                      <span
                        key={set.id}
                        className={`text-xs font-semibold tabular-nums rounded-lg px-2 py-1 border ${
                          set === s.topSet
                            ? 'border-blue-500/50 bg-blue-600/15 text-white'
                            : 'border-blue-900/30 text-blue-200/70'
                        }`}
                      >
                        {set.weight} × {set.reps}
                        {set.paused && <span className="text-blue-400/50"> P</span>}
                      </span>
                    ))}
                  </div>
                  {s.volume > 0 && (
                    <p className="text-blue-400/30 text-[10px] font-semibold mt-1.5 tabular-nums">
                      {s.sets.length} set{s.sets.length !== 1 ? 's' : ''} · volume {Math.round(s.volume).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
