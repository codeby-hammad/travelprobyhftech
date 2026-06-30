'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import SendNotificationModal from './SendNotificationModal'

type Props = {
  booking: any
  client:  any
}

export default function NotificationButton({ booking, client }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
      >
        <Bell size={15} /> Notify client
      </button>

      {open && (
        <SendNotificationModal
          booking={booking}
          client={client}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}