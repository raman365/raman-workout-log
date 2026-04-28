export default function DayPicker({ tabs, activeTab, onSelect, onAdd, onDelete }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-900/20 bg-[#070b14]">
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-600/40 rounded-xl px-3 py-2 text-blue-400 hover:bg-blue-600/30 active:scale-95 transition-all text-sm font-bold flex-shrink-0"
      >
        <span className="text-base leading-none">+</span>
        <span className="tracking-wide">ADD</span>
      </button>

      <button
        onClick={() => document.getElementById('day-sheet').showModal()}
        className="flex-1 flex items-center justify-between bg-[#0d1526] border border-blue-900/30 rounded-xl px-4 py-2.5 active:scale-[0.98] transition-all min-w-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-white font-bold text-sm truncate">
            {activeTab ? activeTab.name : 'Select a day'}
          </span>
        </div>
        <span className="text-blue-400/60 text-xs ml-2 flex-shrink-0">▼</span>
      </button>

      <dialog
        id="day-sheet"
        className="fixed inset-0 m-0 w-full h-full bg-transparent p-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        <div className="absolute bottom-0 left-0 right-0 bg-[#0d1526] border-t border-blue-900/40 rounded-t-3xl p-6 pb-10">
          <div className="w-10 h-1 bg-blue-900/60 rounded-full mx-auto mb-5" />
          <h2
            className="text-white font-bold mb-4 tracking-widest uppercase"
            style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '13px' }}
          >
            Select Workout Day
          </h2>

          {tabs.length === 0 && (
            <p className="text-blue-300/30 text-sm text-center py-4">No days added yet.</p>
          )}

          <div className="space-y-2">
            {tabs.map((tab) => (
              <div key={tab.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelect(tab.id)
                    document.getElementById('day-sheet').close()
                  }}
                  className={`flex-1 text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    tab.id === activeTab?.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-[#131f35] text-blue-100 hover:bg-blue-800/30 active:scale-[0.98] border border-blue-900/20'
                  }`}
                >
                  {tab.name}
                </button>
                <button
                  onClick={() => {
                    document.getElementById('day-sheet').close()
                    onDelete(tab)
                  }}
                  className="w-9 h-9 flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => document.getElementById('day-sheet').close()}
            className="w-full mt-4 py-3 text-blue-300/40 hover:text-blue-300 font-semibold text-sm tracking-wide transition-colors"
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  )
}
