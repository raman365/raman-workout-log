import { useState, useRef, useEffect } from 'react'

export default function DayPicker({ tabs, activeTab, onSelect, onAdd, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-900/20 bg-[#070b14]">
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-600/40 rounded-xl px-3 py-2 text-blue-400 hover:bg-blue-600/30 active:scale-95 transition-all text-sm font-bold shrink-0"
      >
        <span className="text-base leading-none">+</span>
        <span className="tracking-wide">ADD</span>
      </button>

      <div ref={ref} className="relative flex-1 min-w-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between bg-[#0d1526] border border-blue-900/30 rounded-xl px-4 py-2.5 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className="text-white font-bold text-sm truncate">
              {activeTab ? activeTab.name : 'Select a day'}
            </span>
          </div>
          <span className={`text-blue-400/60 text-xs ml-2 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1526] border border-blue-900/40 rounded-xl overflow-hidden shadow-xl shadow-black/40 z-50">
            {tabs.length === 0 && (
              <p className="text-blue-300/30 text-sm text-center py-4">No days added yet.</p>
            )}
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-blue-900/20 last:border-0 ${
                  tab.id === activeTab?.id ? 'bg-blue-600/20' : 'hover:bg-white/5'
                }`}
              >
                <button
                  className="flex-1 text-left text-sm font-semibold truncate pr-2"
                  style={{ color: tab.id === activeTab?.id ? '#93c5fd' : '#cbd5e1' }}
                  onClick={() => { onSelect(tab.id); setOpen(false) }}
                >
                  {tab.name}
                </button>
                <button
                  onClick={() => { setOpen(false); onDelete(tab) }}
                  className="text-red-400/30 hover:text-red-400 text-xs shrink-0 px-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
