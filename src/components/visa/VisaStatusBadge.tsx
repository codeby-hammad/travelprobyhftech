import type { VisaStatus } from '@/types'

const styles: Record<VisaStatus, string> = {
  not_applied:          'bg-gray-100    text-gray-600',
  documents_collecting: 'bg-yellow-50  text-yellow-700',
  applied:              'bg-blue-50    text-blue-700',
  processing:           'bg-purple-50  text-purple-700',
  approved:             'bg-green-50   text-green-700',
  rejected:             'bg-red-50     text-red-700',
  expired:              'bg-orange-50  text-orange-700',
}

const labels: Record<VisaStatus, string> = {
  not_applied:          'Not applied',
  documents_collecting: 'Collecting docs',
  applied:              'Applied',
  processing:           'Processing',
  approved:             'Approved ✓',
  rejected:             'Rejected ✗',
  expired:              'Expired',
}

export default function VisaStatusBadge({ status }: { status: VisaStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}