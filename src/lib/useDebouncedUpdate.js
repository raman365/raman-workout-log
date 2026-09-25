import { useEffect, useMemo, useRef } from 'react'
import { supabase } from './supabase'

// Batches rapid edits to a row (e.g. typing "102.5") into one update per
// pause, and runs updates one at a time so a slow connection can't apply
// them out of order. Anything pending is flushed when the app is hidden or
// the component unmounts, so switching days / closing the app loses nothing.
export function useDebouncedUpdate(table, delay = 500) {
  const pending = useRef(new Map())
  const chain = useRef(Promise.resolve())

  const saver = useMemo(() => {
    function flush(id) {
      const p = pending.current.get(id)
      if (!p) return
      clearTimeout(p.timer)
      pending.current.delete(id)
      chain.current = chain.current
        .then(() => supabase.from(table).update(p.patch).eq('id', id))
        .catch(() => {})
    }

    return {
      queue(id, patch) {
        const p = pending.current.get(id) ?? { patch: {} }
        clearTimeout(p.timer)
        p.patch = { ...p.patch, ...patch }
        p.timer = setTimeout(() => flush(id), delay)
        pending.current.set(id, p)
      },
      flush,
      flushAll() {
        for (const id of [...pending.current.keys()]) flush(id)
      },
      cancel(id) {
        clearTimeout(pending.current.get(id)?.timer)
        pending.current.delete(id)
      },
    }
  }, [table, delay])

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && saver.flushAll()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', saver.flushAll)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', saver.flushAll)
      saver.flushAll()
    }
  }, [saver])

  return saver
}
