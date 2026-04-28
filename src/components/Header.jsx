export default function Header({ onOpenCalc }) {
  return (
    <div className="pt-safe bg-[#070b14] border-b border-blue-900/20">
      <div className="px-4 py-4 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-widest text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            RAMZ WORKOUT LOG
          </h1>
          <div className="mt-1 h-0.5 w-16 bg-blue-500 rounded-full" />
        </div>
        <button
          onClick={onOpenCalc}
          className="mt-1 flex flex-col items-center gap-0.5 text-blue-400/50 hover:text-blue-400 active:scale-90 transition-all"
        >
          <span className="text-xl leading-none">⚡</span>
          <span className="text-[9px] font-bold tracking-widest uppercase">1RM</span>
        </button>
      </div>
    </div>
  )
}
