import { useState } from 'react'

const UNIT_KEY = 'plate_unit'
const barKey = (unit) => `plate_bar_${unit}`

// Plates available per side, largest first. `h` (% of tallest) and `t`
// (px thickness) are only for the drawing; colours follow bumper-plate coding.
const PLATES = {
  kg: [
    { w: 25, color: '#dc2626', h: 100, t: 14 },
    { w: 20, color: '#2563eb', h: 100, t: 12 },
    { w: 15, color: '#eab308', h: 88, t: 11 },
    { w: 10, color: '#16a34a', h: 76, t: 9 },
    { w: 5, color: '#e2e8f0', h: 56, t: 7 },
    { w: 2.5, color: '#ef4444', h: 44, t: 6 },
    { w: 1.25, color: '#94a3b8', h: 36, t: 5 },
  ],
  lb: [
    { w: 45, color: '#2563eb', h: 100, t: 14 },
    { w: 35, color: '#eab308', h: 90, t: 12 },
    { w: 25, color: '#16a34a', h: 78, t: 10 },
    { w: 10, color: '#e2e8f0', h: 58, t: 8 },
    { w: 5, color: '#ef4444', h: 46, t: 6 },
    { w: 2.5, color: '#94a3b8', h: 38, t: 5 },
  ],
}
const BARS = { kg: [20, 15, 10, 0], lb: [45, 35, 15, 0] }

function savedBar(unit) {
  const v = localStorage.getItem(barKey(unit))
  return v !== null && BARS[unit].includes(Number(v)) ? Number(v) : BARS[unit][0]
}

// Greedy fill for one side, counted in hundredths so 1.25s don't hit float
// error. Returns null when the target is lighter than the bar.
function plateLoad(target, bar, plates) {
  let rem = Math.round(((target - bar) / 2) * 100)
  if (rem < 0) return null
  const perSide = []
  for (const p of plates) {
    const c = Math.round(p.w * 100)
    while (rem >= c) {
      perSide.push(p)
      rem -= c
    }
  }
  const sideTotal = perSide.reduce((s, p) => s + p.w, 0)
  return { perSide, sideTotal, loaded: bar + sideTotal * 2 }
}

export default function PlateCalculator({ target, onTargetChange }) {
  const [unit, setUnit] = useState(() => (localStorage.getItem(UNIT_KEY) === 'lb' ? 'lb' : 'kg'))
  const [bar, setBar] = useState(() => savedBar(unit))

  function selectUnit(u) {
    localStorage.setItem(UNIT_KEY, u)
    setUnit(u)
    setBar(savedBar(u))
  }

  function selectBar(b) {
    localStorage.setItem(barKey(unit), b)
    setBar(b)
  }

  const t = parseFloat(target)
  const result = t > 0 ? plateLoad(t, bar, PLATES[unit]) : null
  const groups = (result?.perSide ?? []).reduce((acc, p) => {
    const g = acc.find((x) => x.p === p)
    if (g) g.n++
    else acc.push({ p, n: 1 })
    return acc
  }, [])
  const short = result ? Math.round((t - result.loaded) * 100) / 100 : 0

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <label className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest block mb-1.5">Target</label>
          <input
            type="text"
            inputMode="decimal"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder={unit === 'kg' ? 'e.g. 100' : 'e.g. 225'}
            className="w-full bg-[#131f35] border border-blue-900/30 rounded-xl px-3 py-3 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors"
          />
        </div>
        <div>
          <label className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest block mb-1.5">Unit</label>
          <div className="flex bg-[#131f35] rounded-xl p-1 border border-blue-900/30">
            {['kg', 'lb'].map((u) => (
              <button
                key={u}
                onClick={() => selectUnit(u)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  unit === u ? 'bg-blue-600 text-white' : 'text-blue-300/40 hover:text-blue-300'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest shrink-0 w-8">Bar</span>
        <div className="flex gap-1.5 flex-1">
          {BARS[unit].map((b) => (
            <button
              key={b}
              onClick={() => selectBar(b)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold tabular-nums transition-all border ${
                bar === b
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-100'
                  : 'bg-[#131f35] border-blue-900/30 text-blue-300/50 hover:text-blue-200'
              }`}
            >
              {b === 0 ? 'None' : b}
            </button>
          ))}
        </div>
      </div>

      {!(t > 0) ? (
        <div className="text-center py-8 text-blue-300/20 text-sm font-semibold">
          Enter a target weight above
        </div>
      ) : !result ? (
        <div className="text-center py-8 text-blue-300/30 text-sm font-semibold">
          That's lighter than the bar ({bar} {unit})
        </div>
      ) : (
        <>
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl px-4 py-4 text-center mb-3">
            <p className="text-blue-300/50 text-xs font-semibold uppercase tracking-widest mb-1">Each side</p>
            <p className="text-white text-4xl font-black tracking-tight tabular-nums">{result.sideTotal}</p>
            <p className="text-blue-400/40 text-xs mt-1">{unit}{bar > 0 && ` + ${bar} ${unit} bar`}</p>
            {short > 0 && (
              <p className="text-amber-400/80 text-xs font-semibold mt-2">
                Closest: {result.loaded} {unit} ({short} {unit} short)
              </p>
            )}
          </div>

          {result.perSide.length === 0 ? (
            <p className="text-center py-4 text-blue-300/40 text-sm font-semibold">Just the bar</p>
          ) : (
            <>
              {/* One side of the bar: grip → collar → plates (heaviest first) → sleeve end */}
              <div className="bg-[#131f35] rounded-2xl px-3 py-3 mb-3">
                <div className="flex items-center h-24">
                  <div className="h-2 flex-1 min-w-6 bg-slate-500/70 rounded-l-full" />
                  <div className="w-2 h-6 bg-slate-400 rounded-sm shrink-0" />
                  {result.perSide.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-[3px] ml-0.5 shrink-0"
                      style={{ width: p.t, height: `${p.h}%`, background: p.color }}
                    />
                  ))}
                  <div className="h-2 w-8 bg-slate-500/70 rounded-r-full ml-0.5 shrink-0" />
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {groups.map(({ p, n }) => (
                  <span
                    key={p.w}
                    className="inline-flex items-center gap-1.5 text-xs font-bold tabular-nums text-blue-100 bg-[#131f35] border border-blue-900/30 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    {p.w}
                    {n > 1 && <span className="text-blue-300/50">×{n}</span>}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
