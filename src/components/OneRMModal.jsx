import { useState } from 'react'

function epley(weight, reps) {
  if (!weight || !reps || reps < 1) return null
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60]

export default function OneRMModal({ onClose }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  const w = parseFloat(weight)
  const r = parseInt(reps)
  const oneRM = epley(w, r)

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0d1526] border border-blue-900/30 rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-black text-lg tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              1RM ESTIMATOR
            </h2>
            <p className="text-blue-400/40 text-xs mt-0.5">Epley formula</p>
          </div>
          <button onClick={onClose} className="text-blue-400/40 hover:text-blue-400 text-xl transition-colors">✕</button>
        </div>

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
              <p className="text-blue-300/40 text-xs font-semibold uppercase tracking-widest mb-2">% Chart</p>
              {PERCENTAGES.map((pct) => (
                <div key={pct} className="flex items-center justify-between px-3 py-1.5 bg-[#131f35] rounded-xl">
                  <span className="text-blue-400/60 text-xs font-semibold">{pct}%</span>
                  <span className="text-white text-sm font-bold">{Math.round(oneRM * pct / 100)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-blue-300/20 text-sm font-semibold">
            Enter weight and reps above
          </div>
        )}
      </div>
    </div>
  )
}
