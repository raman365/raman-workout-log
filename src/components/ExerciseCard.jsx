import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ExerciseCard({ exercise, onDelete, onSetsChange }) {
  const [sets, setSets] = useState(exercise.sets || [])
  const [adding, setAdding] = useState(false)

  async function addSet() {
    setAdding(true)
    const setNumber = sets.length + 1
    const { data, error } = await supabase
      .from('sets')
      .insert({ exercise_id: exercise.id, set_number: setNumber, weight: '', reps: '' })
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
    // update set_numbers in DB
    for (const s of renumbered) {
      await supabase.from('sets').update({ set_number: s.set_number }).eq('id', s.id)
    }
  }

  return (
    <div className="bg-[#0d1526] border border-blue-900/30 rounded-2xl overflow-hidden">
      {/* Exercise header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-900/20">
        <span className="text-white font-bold text-base tracking-wide">{exercise.name}</span>
        <button
          onClick={onDelete}
          className="text-red-400/50 hover:text-red-400 transition-colors text-xs px-2 py-1"
        >
          Remove
        </button>
      </div>

      {/* Sets */}
      {sets.length > 0 && (
        <div className="px-4 pt-3 space-y-2">
          <div className="grid grid-cols-[56px_1fr_1fr_28px] gap-2 text-xs text-blue-300/40 font-semibold uppercase tracking-widest px-1">
            <span></span>
            <span className="text-center">KG / LBS</span>
            <span className="text-center">REPS</span>
            <span></span>
          </div>
          {sets.map((set) => (
            <div key={set.id} className="grid grid-cols-[56px_1fr_1fr_28px] gap-2 items-center">
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
              <button
                onClick={() => deleteSet(set.id)}
                className="text-red-400/30 hover:text-red-400 text-xs flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add set button */}
      <div className="px-4 py-3">
        <button
          onClick={addSet}
          disabled={adding}
          className="w-full py-2.5 border border-dashed border-blue-700/30 rounded-xl text-blue-400/50 hover:text-blue-400 hover:border-blue-600/50 active:scale-[0.98] text-sm font-semibold transition-all disabled:opacity-40"
        >
          {adding ? 'Adding...' : '+ Add Set'}
        </button>
      </div>
    </div>
  )
}
