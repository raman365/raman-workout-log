import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { setE1RM, todayStr, fmtAgo } from '../lib/lifts'
import { useDebouncedUpdate } from '../lib/useDebouncedUpdate'
import DeleteModal from './DeleteModal'
import ExerciseMenu from './ExerciseMenu'
import ExerciseHistoryModal from './ExerciseHistoryModal'

const REST_OPTIONS = [60, 90, 120, 180]

const fmtRest = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function ExerciseCard({
  exercise,
  isOpen,
  onToggle,
  onDelete,
  onRename,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onSetsChange,
  historyTick,
  onStartRest,
}) {
  const [sets, setSets] = useState(exercise.sets || [])
  const [adding, setAdding] = useState(false)
  const [confirmExercise, setConfirmExercise] = useState(false)
  const [confirmSetId, setConfirmSetId] = useState(null)
  const [history, setHistory] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const saver = useDebouncedUpdate('sets')

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      const { data } = await supabase
        .from('session_logs')
        .select('*')
        .eq('exercise_id', exercise.id)
        .order('session_date', { ascending: false })
        .order('set_number', { ascending: true })
      if (!cancelled) setHistory(data || [])
    }
    loadHistory()
    return () => { cancelled = true }
  }, [exercise.id, historyTick])

  const lastSession = useMemo(() => {
    if (history.length === 0) return null
    const latestDate = history[0].session_date
    const latestSets = history.filter((r) => r.session_date === latestDate)
    const top = latestSets.reduce((best, s) => {
      const w = parseFloat(s.weight) || 0
      const r = parseInt(s.reps) || 0
      const bw = parseFloat(best?.weight) || 0
      const br = parseInt(best?.reps) || 0
      if (w > bw || (w === bw && r > br)) return s
      return best
    }, latestSets[0])
    return { date: latestDate, top }
  }, [history])

  // Best e1RM from earlier sessions. Today's is left out so re-saving a
  // workout doesn't turn its own sets into the bar to beat.
  const bestPrevE1RM = useMemo(() => {
    const today = todayStr()
    return history.reduce(
      (best, r) => (r.session_date === today ? best : Math.max(best, setE1RM(r) || 0)),
      0
    )
  }, [history])

  async function addSet() {
    setAdding(true)
    const setNumber = sets.length + 1
    const { data, error } = await supabase
      .from('sets')
      .insert({ exercise_id: exercise.id, set_number: setNumber, weight: '', reps: '', paused: false })
      .select()
      .single()
    if (!error) {
      const newSets = [...sets, data]
      setSets(newSets)
      onSetsChange(newSets)
    }
    setAdding(false)
  }

  // Update the screen immediately; the database write is debounced.
  function updateSet(setId, field, value) {
    const newSets = sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s))
    setSets(newSets)
    onSetsChange(newSets)
    saver.queue(setId, { [field]: value })
  }

  async function deleteSet(setId) {
    saver.cancel(setId)
    await supabase.from('sets').delete().eq('id', setId)
    const filtered = sets.filter((s) => s.id !== setId)
    const renumbered = filtered.map((s, i) => ({ ...s, set_number: i + 1 }))
    setSets(renumbered)
    onSetsChange(renumbered)
    for (const s of renumbered) {
      await supabase.from('sets').update({ set_number: s.set_number }).eq('id', s.id)
    }
    setConfirmSetId(null)
  }

  const confirmSetName = confirmSetId
    ? `Set ${sets.find((s) => s.id === confirmSetId)?.set_number}`
    : ''

  return (
    <>
      <div className="bg-[#0d1526] border border-blue-900/30 rounded-2xl overflow-hidden">
        {/* Exercise header */}
        <div
          className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${isOpen ? 'border-b border-blue-900/20' : ''}`}
          onClick={onToggle}
        >
          <div className="flex items-start gap-2 min-w-0">
            <span className={`text-blue-400/60 text-xs mt-1.5 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>▼</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base tracking-wide">{exercise.name}</span>
                {!isOpen && sets.length > 0 && (
                  <span className="text-blue-400/40 text-xs font-semibold">{sets.length} set{sets.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              {lastSession && (
                <div className="text-[11px] text-blue-300/40 font-semibold mt-0.5 tracking-wide">
                  Last: <span className="text-blue-300/70">{lastSession.top.weight} × {lastSession.top.reps}</span>
                  <span className="text-blue-400/30"> · {fmtAgo(lastSession.date)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(true) }}
              aria-label="History and PRs"
              className="text-blue-400/50 hover:text-blue-400 transition-colors px-2 py-1"
            >
              <svg viewBox="0 0 20 20" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,14 8,9 11,12 17,5" />
                <polyline points="12,5 17,5 17,10" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(true) }}
              aria-label="Exercise options"
              className="text-blue-400/50 hover:text-blue-400 transition-colors text-xl leading-none px-2 py-1"
            >
              ⋯
            </button>
          </div>
        </div>

        {/* Sets */}
        {isOpen && sets.length > 0 && (
          <div className="px-4 pt-3 space-y-2">
            <div className="grid grid-cols-[52px_1fr_1fr_52px_24px] gap-2 text-xs text-blue-300/40 font-semibold uppercase tracking-widest px-1">
              <span></span>
              <span className="text-center">KG / LBS</span>
              <span className="text-center">REPS</span>
              <span className="text-center">PAUSE</span>
              <span></span>
            </div>
            {sets.map((set) => {
              const e1rm = setE1RM(set)
              const isPR = bestPrevE1RM > 0 && e1rm !== null && e1rm > bestPrevE1RM
              return (
                <div key={set.id} className="grid grid-cols-[52px_1fr_1fr_52px_24px] gap-2 items-center">
                  <span className="text-blue-400 text-sm font-bold tracking-wide leading-tight">
                    Set {set.set_number}
                    {isPR && (
                      <span className="block text-[10px] font-black tracking-widest text-amber-400">★ PR</span>
                    )}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={set.weight}
                    onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                    onBlur={() => saver.flush(set.id)}
                    placeholder="—"
                    className={`bg-[#131f35] border rounded-xl px-3 py-2.5 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors w-full ${
                      isPR ? 'border-amber-400/50' : 'border-blue-900/30'
                    }`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={set.reps}
                    onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                    onBlur={() => saver.flush(set.id)}
                    placeholder="—"
                    className={`bg-[#131f35] border rounded-xl px-3 py-2.5 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors w-full ${
                      isPR ? 'border-amber-400/50' : 'border-blue-900/30'
                    }`}
                  />
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={set.paused || false}
                      onChange={(e) => {
                        updateSet(set.id, 'paused', e.target.checked)
                        saver.flush(set.id)
                      }}
                      className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => setConfirmSetId(set.id)}
                    className="text-red-400/30 hover:text-red-400 text-xs flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add set button */}
        {isOpen && (
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={addSet}
              disabled={adding}
              className="w-full py-2.5 border border-dashed border-blue-700/30 rounded-xl text-blue-400/50 hover:text-blue-400 hover:border-blue-600/50 active:scale-[0.98] text-sm font-semibold transition-all disabled:opacity-40"
            >
              {adding ? 'Adding...' : '+ Add Set'}
            </button>
            {sets.length > 0 && onStartRest && (
              <div className="flex gap-2">
                {REST_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onStartRest(s)}
                    className="flex-1 py-2 bg-[#131f35] border border-blue-900/30 rounded-xl text-blue-300/60 hover:text-blue-200 hover:border-blue-700/60 active:scale-95 text-xs font-bold tracking-widest tabular-nums transition-all"
                  >
                    ⏱ {fmtRest(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showMenu && (
        <ExerciseMenu
          name={exercise.name}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onHistory={() => setShowHistory(true)}
          onRename={onRename}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={() => setConfirmExercise(true)}
          onClose={() => setShowMenu(false)}
        />
      )}

      {showHistory && (
        <ExerciseHistoryModal
          name={exercise.name}
          history={history}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Exercise delete confirmation */}
      {confirmExercise && (
        <DeleteModal
          tabName={exercise.name}
          message="All sets and saved history for this exercise will be permanently deleted."
          onConfirm={onDelete}
          onClose={() => setConfirmExercise(false)}
        />
      )}

      {/* Set delete confirmation */}
      {confirmSetId && (
        <DeleteModal
          tabName={confirmSetName}
          message="This set will be permanently deleted."
          onConfirm={() => deleteSet(confirmSetId)}
          onClose={() => setConfirmSetId(null)}
        />
      )}
    </>
  )
}
