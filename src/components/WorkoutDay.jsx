import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ExerciseCard from './ExerciseCard'

export default function WorkoutDay({ tab }) {
  const [exercises, setExercises] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    fetchExercises()
  }, [tab.id])

  async function fetchExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*, sets(*)')
      .eq('tab_id', tab.id)
      .order('position')

    if (!error) {
      const sorted = data.map((ex) => ({
        ...ex,
        sets: (ex.sets || []).sort((a, b) => a.set_number - b.set_number),
      }))
      setExercises(sorted)
    }
    setLoading(false)
  }

  async function addExercise() {
    const name = newName.trim()
    if (!name) return
    const position = exercises.length
    const { data, error } = await supabase
      .from('exercises')
      .insert({ tab_id: tab.id, name, position })
      .select()
      .single()
    if (!error) {
      setExercises((prev) => [...prev, { ...data, sets: [] }])
      setNewName('')
    }
  }

  async function deleteExercise(exerciseId) {
    await supabase.from('exercises').delete().eq('id', exerciseId)
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId))
  }

  function handleSetsChange(exerciseId, sets) {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, sets } : e))
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-blue-500 animate-pulse font-semibold tracking-widest text-sm">
          LOADING...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe space-y-4">
      {exercises.length === 0 && (
        <div className="text-center py-12 text-blue-300/30 font-semibold">
          No exercises yet — add one below.
        </div>
      )}

      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onDelete={() => deleteExercise(exercise.id)}
          onSetsChange={(sets) => handleSetsChange(exercise.id, sets)}
        />
      ))}

      {/* Add exercise input */}
      <div className="flex gap-2 pt-2">
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addExercise()}
          placeholder="Exercise name..."
          className="flex-1 bg-[#0d1526] border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-blue-300/20 focus:outline-none focus:border-blue-500 font-semibold text-sm transition-colors"
        />
        <button
          onClick={addExercise}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-600/20"
        >
          ADD
        </button>
      </div>
    </div>
  )
}
