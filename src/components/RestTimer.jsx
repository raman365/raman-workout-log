import { useEffect, useRef, useState } from 'react'

export default function RestTimer({ endsAt, duration, onClose }) {
  const [now, setNow] = useState(Date.now())
  const triggered = useRef(false)

  useEffect(() => {
    triggered.current = false
    const i = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(i)
  }, [endsAt])

  const remaining = Math.max(0, endsAt - now)
  const progress = Math.min(1, (duration - remaining) / duration)
  const done = remaining <= 0

  useEffect(() => {
    if (done && !triggered.current) {
      triggered.current = true
      if (navigator.vibrate) navigator.vibrate([180, 90, 180, 90, 240])
      const t = setTimeout(onClose, 5000)
      return () => clearTimeout(t)
    }
  }, [done, onClose])

  const mm = Math.floor(remaining / 60000)
  const ss = Math.floor((remaining % 60000) / 1000)
  const display = `${mm}:${ss.toString().padStart(2, '0')}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none">
      <div
        className={`mx-3 mb-3 rounded-2xl border backdrop-blur-md shadow-xl shadow-black/50 overflow-hidden pointer-events-auto transition-colors ${
          done ? 'bg-green-900/50 border-green-500/40' : 'bg-[#0d1526]/95 border-blue-900/40'
        }`}
      >
        <div className="h-1.5 bg-blue-900/40 relative overflow-visible">
          <div
            className={`h-full relative transition-[width,background-color] duration-300 ${
              done
                ? 'bg-linear-to-r from-green-500 to-green-300'
                : 'bg-linear-to-r from-blue-600 to-blue-400'
            }`}
            style={{
              width: `${progress * 100}%`,
              boxShadow: done
                ? '0 0 10px rgba(74, 222, 128, 0.9), 0 0 22px rgba(74, 222, 128, 0.5)'
                : '0 0 10px rgba(96, 165, 250, 0.9), 0 0 22px rgba(59, 130, 246, 0.55)',
            }}
          >
            {progress > 0 && progress < 1 && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1.5 rounded-full animate-pulse"
                style={{
                  background: 'rgba(191, 219, 254, 0.95)',
                  boxShadow: '0 0 10px rgba(191, 219, 254, 1), 0 0 18px rgba(96, 165, 250, 0.9)',
                }}
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-2xl shrink-0 ${done ? 'text-green-400' : 'text-blue-400'}`}>⏱</span>
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-widest ${done ? 'text-green-300/60' : 'text-blue-300/40'}`}>
                {done ? "Time's up" : 'Rest'}
              </div>
              <div
                className={`font-black text-2xl tabular-nums tracking-tight leading-none mt-0.5 ${done ? 'text-green-200' : 'text-white'}`}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {done ? '✓ READY' : display}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg active:scale-95 transition-all border ${
              done
                ? 'border-green-500/30 text-green-200 hover:bg-green-500/10'
                : 'border-blue-900/40 text-blue-300/60 hover:text-blue-200 hover:border-blue-700'
            }`}
          >
            {done ? 'Close' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  )
}
