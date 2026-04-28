import { useState } from 'react'
import { supabase } from '../lib/supabase'
import DeleteModal from './DeleteModal'

export default function ExerciseCard({ exercise, isOpen, onToggle, onDelete, onSetsChange }) {
  const [sets, setSets] = useState(exercise.sets || [])
  const [adding, setAdding] = useState(false)
  const [confirmExercise, setConfirmExercise] = useState(false)
  const [confirmSetId, setConfirmSetId] = useState(null)

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

  async function updateSet(setId, field, value) {
    await supabase.from('sets').update({ [field]: value }).eq('id', setId)
    const newSets = sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s))
    setSets(newSets)
    onSetsChange(newSets)
  }

  async function deleteSet(setId) {
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
          <div className="flex items-center gap-2">
            <span className={`text-blue-400/60 text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-white font-bold text-base tracking-wide">{exercise.name}</span>
            {!isOpen && sets.length > 0 && (
              <span className="text-blue-400/40 text-xs font-semibold">{sets.length} set{sets.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmExercise(true) }}
            className="text-red-400/50 hover:text-red-400 transition-colors text-xs px-2 py-1"
          >
            Remove
          </button>
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
            {sets.map((set) => (
              <div key={set.id} className="grid grid-cols-[52px_1fr_1fr_52px_24px] gap-2 items-center">
                <span className="text-blue-400 text-sm font-bold tracking-wide">
                  Set {set.set_number}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                  placeholder="—"
                  className="bg-[#131f35] border border-blue-900/30 rounded-xl px-3 py-2.5 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors w-full"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                  placeholder="—"
                  className="bg-[#131f35] border border-blue-900/30 rounded-xl px-3 py-2.5 text-white text-center text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-[#1a2a45] transition-colors w-full"
                />
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={set.paused || false}
                    onChange={(e) => updateSet(set.id, 'paused', e.target.checked)}
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
            ))}
          </div>
        )}

        {/* Add set button */}
        {isOpen && (
          <div className="px-4 py-3">
            <button
              onClick={addSet}
              disabled={adding}
              className="w-full py-2.5 border border-dashed border-blue-700/30 rounded-xl text-blue-400/50 hover:text-blue-400 hover:border-blue-600/50 active:scale-[0.98] text-sm font-semibold transition-all disabled:opacity-40"
            >
              {adding ? 'Adding...' : '+ Add Set'}
            </button>
          </div>
        )}
      </div>

      {/* Exercise delete confirmation */}
      {confirmExercise && (
        <DeleteModal
          tabName={exercise.name}
          message="All sets for this exercise will be permanently deleted."
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
