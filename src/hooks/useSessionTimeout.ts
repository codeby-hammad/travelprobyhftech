'use client'

import { useEffect, useRef, useCallback } from 'react'

const INACTIVE_TIMEOUT = 10 * 60 * 1000  // 10 minutes
const WARNING_DURATION = 60 * 1000        // 60 second warning before logout

type Options = {
  onWarning:  () => void   // show warning modal
  onLogout:   () => void   // actually log out
  isWarning:  boolean      // is the warning modal currently showing?
}

export function useSessionTimeout({ onWarning, onLogout, isWarning }: Options) {
  const inactiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (inactiveTimer.current) clearTimeout(inactiveTimer.current)
    if (logoutTimer.current)   clearTimeout(logoutTimer.current)
  }, [])

  const resetTimer = useCallback(() => {
    // Don't reset if warning is already showing — user must respond to it
    if (isWarning) return

    clearTimers()

    // Start inactivity countdown
    inactiveTimer.current = setTimeout(() => {
      onWarning()

      // After warning shown, start logout countdown
      logoutTimer.current = setTimeout(() => {
        onLogout()
      }, WARNING_DURATION)
    }, INACTIVE_TIMEOUT)
  }, [isWarning, onWarning, onLogout, clearTimers])

  // Attach activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer() // start timer on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimers()
    }
  }, [resetTimer, clearTimers])

  return { resetTimer, clearTimers }
}