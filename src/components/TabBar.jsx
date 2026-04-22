export default function TabBar({ tabs, activeTabId, onSelect, onAdd, onDelete }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-blue-900/20 bg-[#070b14]">
      {tabs.map((tab) => (
        <div key={tab.id} className="relative flex-shrink-0 group">
          <button
            onClick={() => onSelect(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
              tab.id === activeTabId
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-[#111827] text-blue-300/60 hover:text-blue-300 border border-blue-900/30 active:scale-95'
            }`}
          >
            {tab.name}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(tab)
            }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] items-center justify-center opacity-0 group-hover:opacity-100 hidden group-hover:flex transition-opacity z-10"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex-shrink-0 w-9 h-9 bg-blue-600/20 border border-blue-600/40 rounded-xl text-blue-400 hover:bg-blue-600/30 active:scale-95 flex items-center justify-center text-xl font-light transition-all"
      >
        +
      </button>
    </div>
  )
}
