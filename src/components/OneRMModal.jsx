import { useState } from 'react'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'
import { epley } from '../lib/lifts'
import PlateCalculator from './PlateCalculator'

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60]

const MODES = {
  '1rm': { label: '1RM', title: '1RM ESTIMATOR', sub: 'Epley formula' },
  plates: { label: 'Plates', title: 'PLATE CALC', sub: 'What to load on each side' },
}

export default function OneRMModal({ onClose }) {
  const [mode, setMode] = useState('1rm')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [plateTarget, setPlateTarget] = useState('')

  useLockBodyScroll()

  const w = parseFloat(weight)
  const r = parseInt(reps)
  const oneRM = epley(w, r)

  function showPlates(barbell) {
    setPlateTarget(String(Math.round(barbell)))
    setMode('plates')
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0d1526] border border-blue-900/30 rounded-2xl p-6 max-h-[80vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-lg tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {MODES[mode].title}
            </h2>
            <p className="text-blue-400/40 text-xs mt-0.5">{MODES[mode].sub}</p>
          </div>
          <button onClick={onClose} className="text-blue-400/40 hover:text-blue-400 text-xl transition-colors">✕</button>
        </div>

        <div className="flex bg-[#131f35] rounded-xl p-1 mb-5 border border-blue-900/30">
          {Object.entries(MODES).map(([id, m]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold tracking-wider transition-all ${
                mode === id
                  ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20'
                  : 'text-blue-300/40 hover:text-blue-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'plates' ? (
          <PlateCalculator target={plateTarget} onTargetChange={setPlateTarget} />
        ) : (
          <>
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest block mb-1.5">Weight</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-[#131f35] border border-blue-900/30 rounded-xl px-3 py-3 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest block mb-1.5">Reps</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-[#131f35] border border-blue-900/30 rounded-xl px-3 py-3 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors"
                />
              </div>
            </div>

            {oneRM ? (
              <>
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl px-4 py-4 text-center mb-4">
                  <p className="text-blue-300/50 text-xs font-semibold uppercase tracking-widest mb-1">Estimated 1RM</p>
                  <p className="text-white text-4xl font-black tracking-tight">{Math.round(oneRM)}</p>
                  <p className="text-blue-400/40 text-xs mt-1">kg / lbs</p>
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-[40px_1fr_1fr] gap-3 px-3 mb-2">
                    <span className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest">%</span>
                    <span className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest text-right">Barbell</span>
                    <span className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest text-right">DB ea.</span>
                  </div>
                  {PERCENTAGES.map((pct) => {
                    const barbell = oneRM * pct / 100
                    const dbPerHand = barbell * 0.40
                    return (
                      <button
                        key={pct}
                        onClick={() => showPlates(barbell)}
                        className="w-full grid grid-cols-[40px_1fr_1fr] gap-3 px-3 py-1.5 bg-[#131f35] hover:bg-[#1a2a45] active:scale-[0.98] rounded-xl items-center text-left transition-all"
                      >
                        <span className="text-blue-400/60 text-xs font-semibold">{pct}%</span>
                        <span className="text-white text-sm font-bold text-right tabular-nums">{Math.round(barbell)}</span>
                        <span className="text-blue-300/70 text-sm font-bold text-right tabular-nums">{Math.round(dbPerHand * 2) / 2}</span>
                      </button>
                    )
                  })}
                  <p className="text-blue-400/30 text-[10px] mt-2 px-1 leading-relaxed">
                    Tap a row to see the plates to load.
                    <br />
                    * DB equivalent ≈ 80% of barbell total (~20% lighter), split per hand. Rough estimate.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-blue-300/20 text-sm font-semibold">
                Enter weight and reps above
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
