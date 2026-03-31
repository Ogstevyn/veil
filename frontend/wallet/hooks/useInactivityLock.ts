import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { txActive } from '@/lib/txState'

const LOCK_TIMEOUT_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const

export function useInactivityLock() {
  const router   = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lock = useCallback(() => {
    // Never interrupt an in-flight transaction — reschedule and check again
    if (txActive()) {
      timerRef.current = setTimeout(lock, 35_000)
      return
    }
    sessionStorage.clear()
    router.replace('/lock')
  }, [router])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(lock, LOCK_TIMEOUT_MS)
  }, [lock])

  useEffect(() => {
    resetTimer()
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [resetTimer])
}
