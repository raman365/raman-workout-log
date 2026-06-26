import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOAL_KEY = 'bw_goal_direction'

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

// goal 'cut' => losing weight is good (green); goal 'bulk' => gaining is good
function deltaColor(delta, goal) {
  if (delta === 0) return 'text-blue-300/40'
  const good = goal === 'cut' ? delta < 0 : delta > 0
  return good ? 'text-green-400' : 'text-red-400'
}

function TrendChart({ logs }) {
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

  return (
    <div className="bg-[#131f35] rounded-2xl p-3 mb-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bwFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#bwFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#0d1526" stroke="#60a5fa" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] font-semibold text-blue-300/40 mt-1 px-1">
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
  const [goal, setGoal] = useState(() => localStorage.getItem(GOAL_KEY) || 'cut')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editWeight, setEditWeight] = useState('')
  const [editDate, setEditDate] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, goal)
  }, [goal])

  async function fetchLogs() {
    const { data, error } = await supabase
      .from('body_weight_logs')
      .select('*')
      .order('logged_at', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error && data) setLogs(data)
    setLoading(false)
  }

  async function addEntry() {
    const w = parseFloat(weight)
    if (!w || w <= 0 || saving) return
    setSaving(true)
    const { error } = await supabase
      .from('body_weight_logs')
      .insert({ weight_kg: w, logged_at: date })
    if (!error) {
      setWeight('')
      setDate(todayStr())
      await fetchLogs()
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
      await fetchLogs()
    }
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('body_weight_logs').delete().eq('id', id)
    if (!error) {
      setConfirmDeleteId(null)
      await fetchLogs()
    }
  }

  const latest = logs[logs.length - 1]
  const prev = logs[logs.length - 2]
  const first = logs[0]
  const lastChange = latest && prev ? Number(latest.weight_kg) - Number(prev.weight_kg) : null
  const totalChange = latest && first && first !== latest ? Number(latest.weight_kg) - Number(first.weight_kg) : null

  const inputClass =
    'w-full bg-[#131f35] border border-blue-900/30 rounded-xl px-3 py-3 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors'
  // iOS native date inputs ignore text-align/padding and overflow flex columns
  // without these; appearance-none + min-w-0 keeps it aligned with the weight field
  const dateInputClass = `${inputClass} appearance-none min-w-0 leading-none`

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0d1526] border border-blue-900/30 rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-black text-lg tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              BODY WEIGHT
            </h2>
            <p className="text-blue-400/40 text-xs mt-0.5">Weekly weigh-ins &amp; trend</p>
          </div>
          <button onClick={onClose} className="text-blue-400/40 hover:text-blue-400 text-xl transition-colors">✕</button>
        </div>

        {/* Add entry */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <label className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest block mb-1.5">Weight (kg)</label>
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-blue-900/40 text-blue-300/60 hover:text-white text-xs leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest block mb-1.5">Date</label>
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
          className="w-full py-3 mb-5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#131f35] disabled:text-blue-300/20 text-white rounded-xl font-bold text-sm tracking-widest uppercase active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
        >
          {saving ? 'Saving…' : 'Log Weight'}
        </button>

        {/* Goal direction toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest">Goal</span>
          <div className="flex bg-[#131f35] rounded-xl p-0.5 border border-blue-900/30">
            {['cut', 'bulk'].map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  goal === g ? 'bg-blue-600 text-white' : 'text-blue-300/40 hover:text-blue-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-blue-300/20 text-sm font-semibold">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-blue-300/20 text-sm font-semibold">
            Log your first weigh-in above
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl px-4 py-4 text-center mb-4">
              <p className="text-blue-300/50 text-xs font-semibold uppercase tracking-widest mb-1">Current</p>
              <p className="text-white text-4xl font-black tracking-tight tabular-nums">{Number(latest.weight_kg)}</p>
              <p className="text-blue-400/40 text-xs mt-1">kg · {fmtDate(latest.logged_at)}</p>
              <div className="flex justify-center gap-5 mt-3 pt-3 border-t border-blue-900/30">
                <div>
                  <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Since last</p>
                  <p className={`text-sm font-bold tabular-nums ${lastChange === null ? 'text-blue-300/30' : deltaColor(lastChange, goal)}`}>
                    {lastChange === null ? '—' : fmtDelta(lastChange)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Since start</p>
                  <p className={`text-sm font-bold tabular-nums ${totalChange === null ? 'text-blue-300/30' : deltaColor(totalChange, goal)}`}>
                    {totalChange === null ? '—' : fmtDelta(totalChange)}
                  </p>
                </div>
              </div>
            </div>

            <TrendChart logs={logs} />

            {/* History (newest first) */}
            <div className="space-y-1.5">
              <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest px-1 mb-2">History</p>
              {logs
                .map((log, i) => ({ log, prevWeight: i > 0 ? Number(logs[i - 1].weight_kg) : null }))
                .reverse()
                .map(({ log, prevWeight }) => {
                  const delta = prevWeight === null ? null : Number(log.weight_kg) - prevWeight
                  if (editingId === log.id) {
                    return (
                      <div key={log.id} className="bg-[#131f35] rounded-xl p-2 flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="w-16 bg-[#0d1526] border border-blue-900/30 rounded-lg px-2 py-2 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="date"
                          value={editDate}
                          max={todayStr()}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="flex-1 min-w-0 appearance-none bg-[#0d1526] border border-blue-900/30 rounded-lg px-2 py-2 text-white text-center text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={saveEdit} className="text-green-400 hover:text-green-300 px-1.5 text-lg">✓</button>
                        <button onClick={() => setEditingId(null)} className="text-blue-400/40 hover:text-blue-400 px-1.5 text-lg">✕</button>
                      </div>
                    )
                  }
                  return (
                    <div key={log.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 bg-[#131f35] rounded-xl items-center">
                      <span className="text-blue-200/70 text-sm font-semibold">{fmtDate(log.logged_at)}</span>
                      <div className="flex items-baseline gap-2 justify-end">
                        <span className="text-white text-sm font-bold tabular-nums">{Number(log.weight_kg)} kg</span>
                        {delta !== null && delta !== 0 && (
                          <span className={`text-[11px] font-bold tabular-nums ${deltaColor(delta, goal)}`}>
                            {fmtDelta(delta)}
                          </span>
                        )}
                      </div>
                      {confirmDeleteId === log.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteEntry(log.id)} className="text-red-400 hover:text-red-300 text-xs font-bold px-1">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-blue-400/40 hover:text-blue-400 text-sm px-1">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(log)} className="text-blue-400/40 hover:text-blue-400 text-sm transition-colors">✎</button>
                          <button onClick={() => { setEditingId(null); setConfirmDeleteId(log.id) }} className="text-blue-400/30 hover:text-red-400 text-sm transition-colors">🗑</button>
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
