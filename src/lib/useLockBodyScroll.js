import { useEffect } from 'react'

// Locks scrolling on the page behind a modal/overlay while it is mounted,
// so the background doesn't drift when you scroll inside the modal.
export function useLockBodyScroll() {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])
}
