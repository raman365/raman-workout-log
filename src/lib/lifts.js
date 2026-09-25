// Shared lifting maths and date helpers.

// Epley estimated one-rep max. Returns null when inputs aren't usable.
export function epley(weight, reps) {
  if (!weight || !reps || reps < 1) return null
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

// e1RM for a set row, whose weight/reps are stored as free text.
export function setE1RM(set) {
  return epley(parseFloat(set.weight), parseInt(set.reps))
}

// Today's *local* date as YYYY-MM-DD. toISOString() alone is UTC, which
// files late-night / early-morning sessions under the wrong day.
export function todayStr() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function fmtDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtAgo(s) {
  const then = new Date(s + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today - then) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
