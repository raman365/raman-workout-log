// Rest-timer beep via Web Audio. iOS only lets audio start from a user
// gesture, so primeAudio() runs on the tap that starts the timer and beep()
// can then fire later from a timeout. (iPhones have no vibration API, so
// without this the timer finishes silently.)
let ctx = null

export function primeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx ??= new AC()
  if (ctx.state !== 'running') ctx.resume().catch(() => {})
}

export function beep() {
  if (!ctx) return
  if (ctx.state !== 'running') ctx.resume().catch(() => {})
  const start = ctx.currentTime + 0.05
  ;[0, 0.22, 0.44].forEach((offset, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = i === 2 ? 1320 : 880
    const t = start + offset
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.18)
  })
}
