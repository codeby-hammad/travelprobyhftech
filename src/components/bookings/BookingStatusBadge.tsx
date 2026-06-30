import type { BookingStatus } from '@/types'

const styles: Record<BookingStatus, string> = {
  inquiry:   'bg-yellow-50 text-yellow-700',
  quoted:    'bg-blue-50   text-blue-700',
  confirmed: 'bg-green-50  text-green-700',
  cancelled: 'bg-red-50    text-red-700',
  completed: 'bg-gray-100  text-gray-600',
}

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}