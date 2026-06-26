import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const PEOPLE = ['Raman', 'Kristin']
const PERSON_KEY = 'bw_person'
const goalKey = (person) => `bw_goal_${person}`

// Per-person colour scheme. Class strings are written out in full so Tailwind
// picks them up at build time (no dynamic `bg-${x}` interpolation).
const THEMES = {
  Raman: {
    accent: 'blue',
    surface: 'bg-[#0d1526]',
    surfaceHex: '#0d1526',
    field: 'bg-[#131f35]',
    fieldFocus: 'focus:bg-[#1a2a45]',
    border: 'border-blue-900/30',
    focusBorder: 'focus:border-blue-500',
    divider: 'border-blue-900/30',
    accentGrad: 'bg-gradient-to-r from-blue-600 to-blue-500',
    accentHover: 'hover:from-blue-500 hover:to-blue-400',
    accentShadow: 'shadow-blue-600/20',
    accentText: 'text-blue-400',
    accentTextHover: 'hover:text-blue-400',
    muted: 'text-blue-300/40',
    muted50: 'text-blue-300/50',
    muted30: 'text-blue-300/30',
    muted20: 'text-blue-300/20',
    mutedHover: 'hover:text-blue-300',
    rowText: 'text-blue-200/70',
    summary: 'bg-blue-600/10 border-blue-600/30',
    clearBtn: 'bg-blue-900/40 text-blue-300/60',
    chartStroke: '#3b82f6',
    chartDot: '#60a5fa',
  },
  Kristin: {
    accent: 'pink',
    surface: 'bg-[#1a0d18]',
    surfaceHex: '#1a0d18',
    field: 'bg-[#2a1320]',
    fieldFocus: 'focus:bg-[#3a1a2c]',
    border: 'border-pink-900/40',
    focusBorder: 'focus:border-pink-500',
    divider: 'border-pink-900/40',
    accentGrad: 'bg-gradient-to-r from-pink-600 to-fuchsia-500',
    accentHover: 'hover:from-pink-500 hover:to-fuchsia-400',
    accentShadow: 'shadow-pink-600/30',
    accentText: 'text-pink-400',
    accentTextHover: 'hover:text-pink-400',
    muted: 'text-pink-300/40',
    muted50: 'text-pink-300/50',
    muted30: 'text-pink-300/30',
    muted20: 'text-pink-300/20',
    mutedHover: 'hover:text-pink-300',
    rowText: 'text-pink-200/70',
    summary: 'bg-pink-600/10 border-pink-600/30',
    clearBtn: 'bg-pink-900/40 text-pink-300/60',
    chartStroke: '#ec4899',
    chartDot: '#f9a8d4',
  },
}

function todayStr() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function fmtDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDelta(delta) {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`
}

// goal 'cut' => losing weight is good (green); goal 'bulk' => gaining is good.
// Green/red are universal; the no-change case uses the theme's muted colour.
function deltaColor(delta, goal, neutral) {
  if (delta === 0) return neutral
  const good = goal === 'cut' ? delta < 0 : delta > 0
  return good ? 'text-green-400' : 'text-red-400'
}

function TrendChart({ logs, theme }) {
  if (logs.length < 2) return null

  const W = 320
  const H = 120
  const padX = 10
  const padY = 14
  const weights = logs.map((l) => Number(l.weight_kg))
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  const points = logs.map((l, i) => {
    const x = padX + (i / (logs.length - 1)) * (W - padX * 2)
    const y = padY + (1 - (Number(l.weight_kg) - min) / range) * (H - padY * 2)
    return [x, y]
  })

  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${padX},${H - padY} ${line} ${W - padX},${H - padY}`
  const gradId = `bwFill-${theme.accent}`

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
        <span>{fmtDate(logs[0].logged_at)}</span>
        <span className="tabular-nums">{min === max ? `${min}` : `${min} – ${max} kg`}</span>
        <span>{fmtDate(logs[logs.length - 1].logged_at)}</span>
      </div>
    </div>
  )
}

export default function WeightTrackerModal({ onClose }) {
  // logs kept ascending by date (oldest -> newest)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(todayStr())
  const [person, setPerson] = useState(() => localStorage.getItem(PERSON_KEY) || 'Raman')
  const [goal, setGoal] = useState(() => localStorage.getItem(goalKey(localStorage.getItem(PERSON_KEY) || 'Raman')) || 'cut')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editWeight, setEditWeight] = useState('')
  const [editDate, setEditDate] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const t = THEMES[person] ?? THEMES.Raman
  const refresh = () => setRefreshKey((k) => k + 1)

  useLockBodyScroll()

  useEffect(() => {
    localStorage.setItem(goalKey(person), goal)
  }, [goal, person])

  // Load logs for the selected person; re-runs on person change and after any
  // mutation (refreshKey bump). Self-contained so no setState escapes the effect.
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('*')
        .eq('person', person)
        .order('logged_at', { ascending: true })
        .order('created_at', { ascending: true })
      if (!active) return
      if (!error && data) setLogs(data)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [person, refreshKey])

  // Switching person: remember it, load their goal, reset edit state. The effect
  // above refetches. Done here (not in an effect) to avoid sync setState.
  function selectPerson(p) {
    if (p === person) return
    localStorage.setItem(PERSON_KEY, p)
    setGoal(localStorage.getItem(goalKey(p)) || 'cut')
    setEditingId(null)
    setConfirmDeleteId(null)
    setLoading(true)
    setPerson(p)
  }

  async function addEntry() {
    const w = parseFloat(weight)
    if (!w || w <= 0 || saving) return
    setSaving(true)
    const { error } = await supabase
      .from('body_weight_logs')
      .insert({ weight_kg: w, logged_at: date, person })
    if (!error) {
      setWeight('')
      setDate(todayStr())
      refresh()
    }
    setSaving(false)
  }

  function startEdit(log) {
    setConfirmDeleteId(null)
    setEditingId(log.id)
    setEditWeight(String(log.weight_kg))
    setEditDate(log.logged_at)
  }

  async function saveEdit() {
    const w = parseFloat(editWeight)
    if (!w || w <= 0) return
    const { error } = await supabase
      .from('body_weight_logs')
      .update({ weight_kg: w, logged_at: editDate })
      .eq('id', editingId)
    if (!error) {
      setEditingId(null)
      refresh()
    }
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('body_weight_logs').delete().eq('id', id)
    if (!error) {
      setConfirmDeleteId(null)
      refresh()
    }
  }

  const latest = logs[logs.length - 1]
  const prev = logs[logs.length - 2]
  const first = logs[0]
  const lastChange = latest && prev ? Number(latest.weight_kg) - Number(prev.weight_kg) : null
  const totalChange = latest && first && first !== latest ? Number(latest.weight_kg) - Number(first.weight_kg) : null

  const inputClass = `w-full ${t.field} border ${t.border} rounded-xl px-3 py-3 text-white text-center text-sm font-semibold focus:outline-none ${t.focusBorder} ${t.fieldFocus} transition-colors`
  // iOS native date inputs ignore text-align/padding and overflow flex columns
  // without these; appearance-none + min-w-0 keeps it aligned with the weight field
  const dateInputClass = `${inputClass} appearance-none min-w-0 leading-none`

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm ${t.surface} border ${t.border} rounded-2xl p-6 max-h-[85vh] overflow-y-auto overscroll-contain transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-black text-lg tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              BODY WEIGHT
            </h2>
            <p className={`${t.accentText} opacity-50 text-xs mt-0.5`}>Weekly weigh-ins &amp; trend</p>
          </div>
          <button onClick={onClose} className={`${t.muted} ${t.accentTextHover} text-xl transition-colors`}>✕</button>
        </div>

        {/* Person tabs */}
        <div className={`flex ${t.field} rounded-xl p-1 mb-5 border ${t.border}`}>
          {PEOPLE.map((p) => {
            const pt = THEMES[p]
            const active = person === p
            return (
              <button
                key={p}
                onClick={() => selectPerson(p)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all ${
                  active
                    ? `${pt.accentGrad} text-white shadow-lg ${pt.accentShadow}`
                    : `${t.muted} ${t.mutedHover}`
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Add entry */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <label className={`${t.muted} text-xs font-semibold uppercase tracking-widest block mb-1.5`}>Weight (kg)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                placeholder="e.g. 82.4"
                className={`${inputClass} pr-8`}
              />
              {weight && (
                <button
                  onClick={() => setWeight('')}
                  aria-label="Clear weight"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full ${t.clearBtn} hover:text-white text-xs leading-none`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label className={`${t.muted} text-xs font-semibold uppercase tracking-widest block mb-1.5`}>Date</label>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className={dateInputClass}
            />
          </div>
        </div>
        <button
          onClick={addEntry}
          disabled={!parseFloat(weight) || saving}
          className={`w-full py-3 mb-5 ${t.accentGrad} ${t.accentHover} text-white rounded-xl font-bold text-sm tracking-widest uppercase active:scale-[0.98] transition-all shadow-lg ${t.accentShadow} disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed`}
        >
          {saving ? 'Saving…' : 'Log Weight'}
        </button>

        {/* Goal direction toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className={`${t.muted} text-[10px] font-bold uppercase tracking-widest`}>Goal</span>
          <div className={`flex ${t.field} rounded-xl p-0.5 border ${t.border}`}>
            {['cut', 'bulk'].map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  goal === g ? `${t.accentGrad} text-white` : `${t.muted} ${t.mutedHover}`
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={`text-center py-8 ${t.muted20} text-sm font-semibold`}>Loading…</div>
        ) : logs.length === 0 ? (
          <div className={`text-center py-8 ${t.muted20} text-sm font-semibold`}>
            Log {person}'s first weigh-in above
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className={`${t.summary} border rounded-2xl px-4 py-4 text-center mb-4`}>
              <p className={`${t.muted50} text-xs font-semibold uppercase tracking-widest mb-1`}>Current</p>
              <p className="text-white text-4xl font-black tracking-tight tabular-nums">{Number(latest.weight_kg)}</p>
              <p className={`${t.muted} text-xs mt-1`}>kg · {fmtDate(latest.logged_at)}</p>
              <div className={`flex justify-center gap-5 mt-3 pt-3 border-t ${t.divider}`}>
                <div>
                  <p className={`${t.muted} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Since last</p>
                  <p className={`text-sm font-bold tabular-nums ${lastChange === null ? t.muted30 : deltaColor(lastChange, goal, t.muted)}`}>
                    {lastChange === null ? '—' : fmtDelta(lastChange)}
                  </p>
                </div>
                <div>
                  <p className={`${t.muted} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Since start</p>
                  <p className={`text-sm font-bold tabular-nums ${totalChange === null ? t.muted30 : deltaColor(totalChange, goal, t.muted)}`}>
                    {totalChange === null ? '—' : fmtDelta(totalChange)}
                  </p>
                </div>
              </div>
            </div>

            <TrendChart logs={logs} theme={t} />

            {/* History (newest first) */}
            <div className="space-y-1.5">
              <p className={`${t.muted} text-[10px] font-bold uppercase tracking-widest px-1 mb-2`}>History</p>
              {logs
                .map((log, i) => ({ log, prevWeight: i > 0 ? Number(logs[i - 1].weight_kg) : null }))
                .reverse()
                .map(({ log, prevWeight }) => {
                  const delta = prevWeight === null ? null : Number(log.weight_kg) - prevWeight
                  if (editingId === log.id) {
                    return (
                      <div key={log.id} className={`${t.field} rounded-xl p-2 flex items-center gap-2`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className={`w-16 ${t.surface} border ${t.border} rounded-lg px-2 py-2 text-white text-center text-sm font-semibold focus:outline-none ${t.focusBorder}`}
                        />
                        <input
                          type="date"
                          value={editDate}
                          max={todayStr()}
                          onChange={(e) => setEditDate(e.target.value)}
                          className={`flex-1 min-w-0 appearance-none ${t.surface} border ${t.border} rounded-lg px-2 py-2 text-white text-center text-xs font-semibold focus:outline-none ${t.focusBorder}`}
                        />
                        <button onClick={saveEdit} className="text-green-400 hover:text-green-300 px-1.5 text-lg">✓</button>
                        <button onClick={() => setEditingId(null)} className={`${t.muted} ${t.accentTextHover} px-1.5 text-lg`}>✕</button>
                      </div>
                    )
                  }
                  return (
                    <div key={log.id} className={`grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 ${t.field} rounded-xl items-center`}>
                      <span className={`${t.rowText} text-sm font-semibold`}>{fmtDate(log.logged_at)}</span>
                      <div className="flex items-baseline gap-2 justify-end">
                        <span className="text-white text-sm font-bold tabular-nums">{Number(log.weight_kg)} kg</span>
                        {delta !== null && delta !== 0 && (
                          <span className={`text-[11px] font-bold tabular-nums ${deltaColor(delta, goal, t.muted)}`}>
                            {fmtDelta(delta)}
                          </span>
                        )}
                      </div>
                      {confirmDeleteId === log.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteEntry(log.id)} className="text-red-400 hover:text-red-300 text-xs font-bold px-1">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className={`${t.muted} ${t.accentTextHover} text-sm px-1`}>✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(log)} className={`${t.muted} ${t.accentTextHover} text-sm transition-colors`}>✎</button>
                          <button onClick={() => { setEditingId(null); setConfirmDeleteId(log.id) }} className={`${t.muted30} hover:text-red-400 text-sm transition-colors`}>🗑</button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
