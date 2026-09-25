import { useState } from 'react'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const itemClass =
  'w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all bg-[#131f35] text-blue-100 hover:bg-blue-800/30 active:scale-[0.98] border border-blue-900/20 hover:border-blue-700/40 disabled:opacity-30 disabled:active:scale-100'

// Bottom-sheet of actions for one exercise. Each action closes the sheet
// via the parent; rename swaps the list for an inline form.
export default function ExerciseMenu({ name, canMoveUp, canMoveDown, onHistory, onRename, onMoveUp, onMoveDown, onRemove, onClose }) {
  const [renaming, setRenaming] = useState(false)
  const [value, setValue] = useState(name)

  useLockBodyScroll()

  const trimmed = value.trim()
  function saveRename() {
    if (!trimmed) return
    if (trimmed !== name) onRename(trimmed)
    onClose()
  }

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
        <h2 className="text-white font-bold text-base mb-4 tracking-wide truncate">{name}</h2>

        {renaming ? (
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveRename()}
              className="w-full bg-[#131f35] border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-blue-300/20 focus:outline-none focus:border-blue-500 font-semibold text-sm transition-colors"
            />
            <button
              onClick={saveRename}
              disabled={!trimmed}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm tracking-widest uppercase active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40"
            >
              Save Name
            </button>
            <p className="text-blue-300/30 text-xs text-center">History and PRs stay with the exercise.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <button onClick={() => { onClose(); onHistory() }} className={itemClass}>📈 History &amp; PRs</button>
            <button onClick={() => setRenaming(true)} className={itemClass}>✎ Rename</button>
            <div className="flex gap-2">
              <button onClick={() => { onMoveUp(); onClose() }} disabled={!canMoveUp} className={itemClass}>↑ Move up</button>
              <button onClick={() => { onMoveDown(); onClose() }} disabled={!canMoveDown} className={itemClass}>↓ Move down</button>
            </div>
            <button
              onClick={() => { onClose(); onRemove() }}
              className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all bg-red-500/5 text-red-400 hover:bg-red-500/10 active:scale-[0.98] border border-red-500/20"
            >
              🗑 Remove exercise
            </button>
          </div>
        )}

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
