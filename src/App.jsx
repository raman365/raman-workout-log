import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import DayPicker from './components/DayPicker'
import WorkoutDay from './components/WorkoutDay'
import AddTabModal from './components/AddTabModal'
import DeleteModal from './components/DeleteModal'
import OneRMModal from './components/OneRMModal'
import RestTimer from './components/RestTimer'

export default function App() {
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOneRM, setShowOneRM] = useState(false)
  const [rest, setRest] = useState(null)

  function startRest(seconds) {
    setRest({ endsAt: Date.now() + seconds * 1000, duration: seconds * 1000 })
  }

  useEffect(() => {
    fetchTabs()
  }, [])

  async function fetchTabs() {
    const { data, error } = await supabase
      .from('workout_tabs')
      .select('*')
      .order('position')
    if (!error && data) {
      setTabs(data)
      if (data.length > 0) setActiveTabId(data[0].id)
    }
    setLoading(false)
  }

  async function addTab(name) {
    const position = tabs.length
    const { data, error } = await supabase
      .from('workout_tabs')
      .insert({ name, position })
      .select()
      .single()
    if (!error) {
      setTabs((prev) => [...prev, data])
      setActiveTabId(data.id)
    }
    setShowAddModal(false)
  }

  async function deleteTab(id) {
    await supabase.from('workout_tabs').delete().eq('id', id)
    const remaining = tabs.filter((t) => t.id !== id)
    setTabs(remaining)
    if (activeTabId === id) setActiveTabId(remaining[0]?.id || null)
    setDeleteTarget(null)
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <div className="min-h-svh bg-[#070b14] flex flex-col">
      <Header onOpenCalc={() => setShowOneRM(true)} />
      <DayPicker
        tabs={tabs}
        activeTab={tabs.find((t) => t.id === activeTabId) || null}
        onSelect={setActiveTabId}
        onAdd={() => setShowAddModal(true)}
        onDelete={setDeleteTarget}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-blue-500/60 animate-pulse font-semibold tracking-widest text-xs">
            LOADING...
          </div>
        </div>
      ) : activeTab ? (
        <WorkoutDay key={activeTab.id} tab={activeTab} onStartRest={startRest} />
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-center px-8">
          <div className="text-5xl mb-2">💪</div>
          <p className="text-blue-200/50 font-bold text-lg tracking-wide">
            No workout days yet
          </p>
          <p className="text-blue-300/30 text-sm">
            Tap the <span className="text-blue-400">+</span> button above to add your first day.
          </p>
        </div>
      )}

      {showAddModal && (
        <AddTabModal
          onAdd={addTab}
          onClose={() => setShowAddModal(false)}
          existingNames={tabs.map((t) => t.name)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          tabName={deleteTarget.name}
          onConfirm={() => deleteTab(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showOneRM && <OneRMModal onClose={() => setShowOneRM(false)} />}

      {rest && (
        <RestTimer
          endsAt={rest.endsAt}
          duration={rest.duration}
          onClose={() => setRest(null)}
        />
      )}
    </div>
  )
}
