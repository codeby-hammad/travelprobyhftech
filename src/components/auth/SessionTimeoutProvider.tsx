'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import SessionTimeoutModal from './SessionTimeoutModal'

export default function SessionTimeoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router   = useRouter()
  const supabase = createClient()
  const [isWarning, setIsWarning] = useState(false)

  const handleLogout = useCallback(async () => {
    setIsWarning(false)
    await supabase.auth.signOut()
    router.push('/login?reason=timeout')
    router.refresh()
  }, [supabase, router])

  const handleWarning = useCallback(() => {
    setIsWarning(true)
  }, [])

  const { resetTimer, clearTimers } = useSessionTimeout({
    onWarning: handleWarning,
    onLogout:  handleLogout,
    isWarning,
  })

  const handleStayLoggedIn = useCallback(() => {
    setIsWarning(false)
    clearTimers()
    resetTimer()
  }, [clearTimers, resetTimer])

  return (
    <>
      {children}
      <SessionTimeoutModal
        isOpen={isWarning}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />
    </>
  )
}