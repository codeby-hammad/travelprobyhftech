import { createClient }  from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link              from 'next/link'
import { Plus, Calendar, Users } from 'lucide-react'
import { Button }        from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator }     from '@/components/ui/separator'
import BookingsSearchBar from '@/components/bookings/BookingsSearchBar'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    inquiry:   'bg-amber-50   text-amber-700   border-amber-200',
    quoted:    'bg-blue-50    text-blue-700    border-blue-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50     text-red-600     border-red-200',
    completed: 'bg-slate-100  text-slate-600   border-slate-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  )
}

const STATUS_FILTERS = ['All', 'Confirmed', 'Inquiry', 'Quoted', 'Completed', 'Cancelled']

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; groups?: string }>
}) {
  const { q, status, groups } = await searchParams
  const supabase = await createClient()

  const { data: allBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      client:clients(full_name),
      package:packages(name),
      group:group_bookings(id, group_name, group_type, total_pax)
    `)
    .order('created_at', { ascending: false })

  const total     = allBookings?.length ?? 0
  const confirmed = allBookings?.filter(b => b.status === 'confirmed').length ?? 0
  const inquiry   = allBookings?.filter(b => b.status === 'inquiry').length ?? 0
  const revenue   = allBookings?.reduce((s, b) => s + Number(b.total_amount ?? 0), 0) ?? 0
  const groupCount = allBookings?.filter(b => b.group).length ?? 0

  // Filter: groups-only toggle
  let bookings = allBookings ?? []
  const showGroupsOnly = groups === '1'
  if (showGroupsOnly) {
    bookings = bookings.filter(b => !!b.group)
  }

  // Filter by status
  if (status && status.toLowerCase() !== 'all') {
    bookings = bookings.filter(b => b.status?.toLowerCase() === status.toLowerCase())
  }

  // Filter by search — matches booking ref, client name, package name, or group name
  if (q) {
    const needle = q.toLowerCase()
    bookings = bookings.filter(b =>
      b.booking_ref?.toLowerCase().includes(needle) ||
      b.client?.full_name?.toLowerCase().includes(needle) ||
      b.package?.name?.toLowerCase().includes(needle) ||
      b.group?.group_name?.toLowerCase().includes(needle)
    )
  }

  const activeStatus = status ?? 'All'

  function buildHref(overrides: { status?: string; groups?: string }) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    const nextStatus = overrides.status ?? status
    const nextGroups = overrides.groups ?? groups
    if (nextStatus && nextStatus.toLowerCase() !== 'all') params.set('status', nextStatus.toLowerCase())
    if (nextGroups === '1') params.set('groups', '1')
    return `/dashboard/bookings${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bookings</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{total} total bookings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/groups/new">
            <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5">
              <Users size={12} /> New Group
            </Button>
          </Link>
          <Link href="/dashboard/bookings/new">
            <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
              <Plus size={12} /> New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total',     value: total,                   color: 'text-slate-900'   },
          { label: 'Confirmed', value: confirmed,               color: 'text-emerald-600' },
          { label: 'Inquiry',   value: inquiry,                 color: 'text-amber-600'   },
          { label: 'Groups',    value: groupCount,              color: 'text-indigo-600'  },
          { label: 'Revenue',   value: formatCurrency(revenue), color: 'text-blue-600'    },
        ].map(k => (
          <Card key={k.label} className="border-slate-100 shadow-none">
            <CardContent className="p-4">
              <p className="text-[12px] text-slate-500 font-medium mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color} tracking-tight`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-slate-100 shadow-none">
        <CardHeader className="px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1">
              <BookingsSearchBar />

              {/* Groups toggle — sits right next to search */}
              <Link
                href={buildHref({ groups: showGroupsOnly ? '' : '1' })}
                className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg font-medium border transition-colors shrink-0 ${
                  showGroupsOnly
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users size={12} /> Groups only
              </Link>
            </div>

            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map(s => {
                const isActive = activeStatus.toLowerCase() === s.toLowerCase()
                return (
                  <Link
                    key={s}
                    href={buildHref({ status: s.toLowerCase() === 'all' ? '' : s.toLowerCase() })}
                    className={`text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </Link>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} className="text-slate-400" />
              </div>
              <p className="text-[14px] font-medium text-slate-600 mb-1">
                {q || showGroupsOnly || (status && status !== 'all') ? 'No matching bookings' : 'No bookings yet'}
              </p>
              <p className="text-[13px] text-slate-400 mb-4">
                {q || showGroupsOnly || (status && status !== 'all')
                  ? 'Try a different search or filter'
                  : 'Create your first booking to get started'}
              </p>
              {!q && !showGroupsOnly && (!status || status === 'all') && (
                <Link href="/dashboard/bookings/new">
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-[12px] gap-1.5">
                    <Plus size={12} /> New Booking
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="col-span-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ref</p>
                <p className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Client</p>
                <p className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Package</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Travel Date</p>
                <p className="col-span-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">Amount</p>
              </div>

              {bookings.map((b: any, i: number) => (
                <div key={b.id}>
                  <Link href={`/dashboard/bookings/${b.id}`} className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-50/70 transition-colors items-center group">
                    <p className="col-span-1 font-mono text-[12px] text-blue-600 font-semibold">{b.booking_ref}</p>
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-600 group-hover:bg-slate-200 transition-colors">
                        {b.client?.full_name?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">{b.client?.full_name ?? '—'}</p>
                        {b.group && (
                          <p className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                            <Users size={9} /> {b.group.group_name} · {b.group.total_pax} pax
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="col-span-3 text-[13px] text-slate-500 truncate">{b.package?.name ?? 'Custom booking'}</p>
                    <p className="col-span-2 text-[13px] text-slate-500">{formatDate(b.travel_date)}</p>
                    <div className="col-span-1"><StatusBadge status={b.status} /></div>
                    <p className="col-span-2 text-[13px] font-bold text-slate-900 text-right">{formatCurrency(b.total_amount)}</p>
                  </Link>
                  {i < bookings.length - 1 && <Separator className="mx-5 w-auto" />}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}