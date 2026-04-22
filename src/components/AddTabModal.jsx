const WORKOUT_OPTIONS = [
  'Push Heavy Bench Focus / Light Shoulder Press',
  'Pull Heavy Deadlift / Banded Explosive Pull ups',
  'Legs',
  'Push Heavy Shoulder Focus / Light Bench Press',
  'Pull Heavy Weighted Pull Ups',
]

export default function AddTabModal({ onAdd, onClose, existingNames }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-[#0d1526] border-t border-blue-900/40 rounded-t-3xl p-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-blue-900/60 rounded-full mx-auto mb-5" />
        <h2
          className="text-white font-bold text-lg mb-4 tracking-widest uppercase"
          style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px' }}
        >
          Add Workout Day
        </h2>
        <div className="space-y-2">
          {WORKOUT_OPTIONS.map((option) => {
            const exists = existingNames.includes(option)
            return (
              <button
                key={option}
                onClick={() => !exists && onAdd(option)}
                disabled={exists}
                className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  exists
                    ? 'bg-[#111827] text-blue-300/20 cursor-not-allowed border border-blue-900/10'
                    : 'bg-[#131f35] text-blue-100 hover:bg-blue-800/30 active:scale-[0.98] border border-blue-900/20 hover:border-blue-700/40'
                }`}
              >
                {option}
                {exists && (
                  <span className="ml-2 text-xs text-blue-300/20 font-normal">
                    (added)
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-blue-300/40 hover:text-blue-300 font-semibold text-sm tracking-wide transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
