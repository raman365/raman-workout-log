import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ExerciseCard from './ExerciseCard'

export default function WorkoutDay({ tab, onStartRest }) {
  const [exercises, setExercises] = useState([])
  const [openId, setOpenId] = useState(null)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [justFinished, setJustFinished] = useState(false)
  const [historyTick, setHistoryTick] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setOpenId(null)
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

  async function finishWorkout() {
    setFinishing(true)
    const today = new Date().toISOString().slice(0, 10)
    const exerciseIds = exercises.map((e) => e.id)

    if (exerciseIds.length > 0) {
      await supabase
        .from('session_logs')
        .delete()
        .in('exercise_id', exerciseIds)
        .eq('session_date', today)
    }

    const rows = exercises.flatMap((ex) =>
      (ex.sets || [])
        .filter((s) => s.weight && s.reps)
        .map((s) => ({
          exercise_id: ex.id,
          session_date: today,
          set_number: s.set_number,
          weight: s.weight,
          reps: s.reps,
          paused: s.paused || false,
        }))
    )

    if (rows.length > 0) {
      await supabase.from('session_logs').insert(rows)
    }

    setHistoryTick((t) => t + 1)
    setFinishing(false)
    setJustFinished(true)
    setTimeout(() => setJustFinished(false), 2200)
  }

  const hasLoggableSets = exercises.some((ex) =>
    (ex.sets || []).some((s) => s.weight && s.reps)
  )

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
          isOpen={openId === exercise.id}
          onToggle={() => setOpenId((prev) => (prev === exercise.id ? null : exercise.id))}
          onDelete={() => deleteExercise(exercise.id)}
          onSetsChange={(sets) => handleSetsChange(exercise.id, sets)}
          historyTick={historyTick}
          onStartRest={onStartRest}
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

      {/* Finish workout button */}
      {hasLoggableSets && (
        <button
          onClick={finishWorkout}
          disabled={finishing || justFinished}
          className={`w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase transition-all border ${
            justFinished
              ? 'bg-green-600/20 border-green-500/40 text-green-300'
              : 'bg-[#0d1526] border-blue-700/40 text-blue-300 hover:border-blue-500 hover:text-blue-200 active:scale-[0.98]'
          } disabled:opacity-60`}
        >
          {finishing ? 'Saving...' : justFinished ? '✓ Session Saved' : 'Finish Workout'}
        </button>
      )}
    </div>
  )
}
