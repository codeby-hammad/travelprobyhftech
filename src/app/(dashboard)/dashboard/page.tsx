import { createClient }   from '@/lib/supabase/server'
import { formatCurrency }  from '@/lib/utils'
import Link                from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }           from '@/components/ui/badge'
import { Button }          from '@/components/ui/button'
import { Separator }       from '@/components/ui/separator'
import {
  Calendar, Users, TrendingUp, CreditCard,
  AlertCircle, Plus, Inbox, ArrowUpRight,
  ArrowRight, Ticket, Package, DollarSign,
  FileText, BookOpen, ShieldCheck, UserCog,
  FileSignature, Zap,
} from 'lucide-react'

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, trend, href,
}: {
  label:   string
  value:   string | number
  sub?:    string
  icon:    any
  trend?:  'up' | 'down' | 'neutral'
  href?:   string
}) {
  const card = (
    <Card className="border-slate-100 shadow-none hover:shadow-sm transition-shadow duration-200 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-900 transition-colors duration-200">
            <Icon size={16} className="text-slate-600 group-hover:text-white transition-colors duration-200" />
          </div>
          {href && (
            <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
          )}
        </div>
        <p className="text-[13px] font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        {sub && (
          <p className={`text-[12px] mt-1.5 font-medium ${
            trend === 'up'   ? 'text-emerald-600' :
            trend === 'down' ? 'text-red-500'     : 'text-slate-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {sub}
          </p>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{card}</Link> : card
}

// ── Status Badge ──────────────────────────────────────────────────────────────
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

// ── Quick Action ──────────────────────────────────────────────────────────────
function QuickAction({ href, label, icon: Icon, color }: {
  href:  string
  label: string
  icon:  any
  color: string
}) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer group`}>
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon size={14} className="text-white" />
        </div>
        <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
        <ArrowRight size={12} className="text-slate-300 ml-auto group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*), role:staff_roles(name)')
    .eq('id', user!.id)
    .single()

  const orgId    = profile?.organization_id
  const isOwner  = profile?.is_owner
  const roleName = profile?.role?.name ?? (isOwner ? 'Owner' : 'Booking Agent')

  const isAccountant   = roleName === 'Accounts'
  const isTicketing    = roleName === 'Ticketing Staff'
  const isBookingAgent = roleName === 'Booking Agent'
  const isManager      = roleName === 'Manager' || roleName === 'Owner' || isOwner

  const today     = new Date().toISOString().slice(0, 10)
  const thisMonth = new Date().toISOString().slice(0, 7)

  // ── MANAGER data ────────────────────────────────────────────────────────────
  const [statsRes, recentBookingsRes, inquiriesRes, visaAlertsRes] =
    isManager
      ? await Promise.all([
          supabase.from('dashboard_stats').select('*').eq('organization_id', orgId).single(),
          supabase.from('bookings').select('*, client:clients(full_name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(6),
          supabase.from('booking_inquiries').select('id').eq('organization_id', orgId).eq('status', 'new'),
          supabase.from('visa_alerts').select('*').eq('organization_id', orgId).limit(4),
        ])
      : [{ data: null }, { data: [] }, { data: [] }, { data: [] }]

  // ── BOOKING AGENT data ───────────────────────────────────────────────────────
  const [myBookingsRes, myBookingsMonthRes, myRevenueRes, pendingRes, myClientsRes] =
    isBookingAgent
      ? await Promise.all([
          supabase.from('bookings').select('*, client:clients(full_name)').eq('organization_id', orgId).eq('agent_id', user!.id).order('created_at', { ascending: false }).limit(6),
          supabase.from('bookings').select('id, total_amount').eq('organization_id', orgId).eq('agent_id', user!.id).gte('created_at', `${thisMonth}-01`),
          supabase.from('bookings').select('total_amount').eq('organization_id', orgId).eq('agent_id', user!.id),
          supabase.from('bookings').select('id').eq('organization_id', orgId).eq('agent_id', user!.id).eq('status', 'inquiry'),
          supabase.from('bookings').select('client_id').eq('organization_id', orgId).eq('agent_id', user!.id),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  // ── TICKETING data ───────────────────────────────────────────────────────────
  const [batchesRes, todaySalesRes, recentSalesRes, batchSalesTodayRes, allDailySalesRes, allBatchSalesRes] =
    isTicketing
      ? await Promise.all([
          supabase.from('ticket_batch_summary').select('*').eq('organization_id', orgId).limit(5),
          supabase.from('daily_ticket_sales').select('id, sold_price').eq('organization_id', orgId).eq('created_by', user!.id).gte('sale_date', today),
          supabase.from('daily_ticket_sales').select('id, buyer_name, receipt_number, sold_price, sale_date, route_from, route_to').eq('organization_id', orgId).eq('created_by', user!.id).order('created_at', { ascending: false }).limit(8),
          supabase.from('ticket_seats').select('id, sold_price').eq('organization_id', orgId).eq('created_by', user!.id).eq('status', 'sold').gte('sold_date', today),
          supabase.from('daily_ticket_sales').select('sold_price').eq('organization_id', orgId).eq('created_by', user!.id),
          supabase.from('ticket_seats').select('sold_price').eq('organization_id', orgId).eq('created_by', user!.id).eq('status', 'sold'),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  // ── ACCOUNTS data ────────────────────────────────────────────────────────────
  const [paymentsRes, paymentsMonthRes, supplierRes, overdueRes, invoicesRes] =
    isAccountant
      ? await Promise.all([
          supabase.from('payments').select('amount, paid_at, payment_method').eq('organization_id', orgId).eq('status', 'completed').order('paid_at', { ascending: false }).limit(6),
          supabase.from('payments').select('amount').eq('organization_id', orgId).eq('status', 'completed').gte('paid_at', `${thisMonth}-01`),
          supabase.from('supplier_payables').select('*').eq('organization_id', orgId).limit(5),
          supabase.from('bookings').select('id, booking_ref, total_amount, paid_amount, client:clients(full_name)').eq('organization_id', orgId).filter('paid_amount', 'lt', 'total_amount').order('created_at', { ascending: false }).limit(6),
          supabase.from('invoices').select('id').eq('organization_id', orgId).eq('status', 'unpaid'),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  // ── Compute ──────────────────────────────────────────────────────────────────
  const stats          = statsRes?.data
  const recentBookings = recentBookingsRes?.data  ?? []
  const newInquiries   = inquiriesRes?.data?.length ?? 0
  const visaAlerts     = visaAlertsRes?.data       ?? []

  const myBookings      = myBookingsRes?.data      ?? []
  const myBookingsMonth = myBookingsMonthRes?.data  ?? []
  const myRevenueAll    = myRevenueRes?.data        ?? []
  const pendingCount    = pendingRes?.data?.length  ?? 0
  const myClientsRaw    = myClientsRes?.data        ?? []
  const myUniqueClients = new Set((myClientsRaw as any[]).map((b: any) => b.client_id)).size
  const myTotalRevenue  = (myRevenueAll as any[]).reduce((s, b: any) => s + Number(b.total_amount ?? 0), 0)
  const myMonthRevenue  = (myBookingsMonth as any[]).reduce((s, b: any) => s + Number(b.total_amount ?? 0), 0)

  const batches          = batchesRes?.data         ?? []
  const todaySales       = todaySalesRes?.data      ?? []
  const recentSales      = recentSalesRes?.data     ?? []
  const batchSalesToday  = batchSalesTodayRes?.data ?? []
  const allDailySales    = allDailySalesRes?.data   ?? []
  const allBatchSales    = allBatchSalesRes?.data   ?? []
  const totalTicketsToday = todaySales.length + batchSalesToday.length
  const todayRevenue =
    (todaySales as any[]).reduce((s, t: any) => s + Number(t.sold_price ?? 0), 0) +
    (batchSalesToday as any[]).reduce((s, t: any) => s + Number(t.sold_price ?? 0), 0)
  const myTotalTicketRevenue =
    (allDailySales as any[]).reduce((s, t: any) => s + Number(t.sold_price ?? 0), 0) +
    (allBatchSales as any[]).reduce((s, t: any) => s + Number(t.sold_price ?? 0), 0)

  const payments      = paymentsRes?.data      ?? []
  const paymentsMonth = paymentsMonthRes?.data  ?? []
  const supplierOwed  = supplierRes?.data       ?? []
  const overdueList   = overdueRes?.data        ?? []
  const unpaidInvoices = invoicesRes?.data?.length ?? 0
  const totalCollectedMonth = (paymentsMonth as any[]).reduce((s, p: any) => s + Number(p.amount ?? 0), 0)
  const totalOwed           = (supplierOwed as any[]).reduce((s, p: any) => s + Number(p.outstanding_amount ?? 0), 0)
  const totalOverdue        = (overdueList as any[]).reduce((s, b: any) => s + (Number(b.total_amount) - Number(b.paid_amount)), 0)

  const firstName  = profile?.full_name?.split(' ')[0]
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const greeting   = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  // ════════════════════════════════════════════════════════════════════
  // MANAGER / OWNER
  // ════════════════════════════════════════════════════════════════════
  if (isManager) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {profile?.organization?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {newInquiries > 0 && (
              <Link href="/dashboard/inquiries">
                <Button variant="outline" size="sm" className="h-8 text-[12px] border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 gap-1.5">
                  <Inbox size={12} />
                  {newInquiries} new {newInquiries === 1 ? 'inquiry' : 'inquiries'}
                </Button>
              </Link>
            )}
            <Link href="/dashboard/bookings/new">
              <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
                <Plus size={12} />
                New Booking
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Bookings"   value={stats?.total_bookings     ?? 0}                  icon={Calendar}   sub="All time"      trend="neutral" href="/dashboard/bookings" />
          <StatCard label="Confirmed"        value={stats?.confirmed_bookings ?? 0}                  icon={Calendar}   sub="Active"         trend="up"      href="/dashboard/bookings" />
          <StatCard label="Total Revenue"    value={formatCurrency(stats?.total_revenue  ?? 0)}      icon={TrendingUp} sub="All time"       trend="up"      href="/dashboard/financial" />
          <StatCard label="Pending Payment"  value={formatCurrency(stats?.pending_amount ?? 0)}      icon={CreditCard} sub="Needs follow-up" trend="down"   href="/dashboard/ledger" />
        </div>

        {/* Visa alerts */}
        {visaAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-[13px] font-semibold text-red-700">
                {visaAlerts.length} visa{visaAlerts.length > 1 ? 's' : ''} expiring soon
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(visaAlerts as any[]).map((v: any) => (
                <Link key={v.id} href={`/dashboard/visa/${v.id}`}>
                  <Badge variant="outline" className="text-[11px] border-red-200 text-red-600 bg-white hover:bg-red-50 cursor-pointer">
                    {v.client_name} · {v.days_until_expiry}d
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent bookings */}
          <div className="lg:col-span-2">
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-900">Recent Bookings</CardTitle>
                  <Link href="/dashboard/bookings" className="text-[12px] text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors">
                    View all <ArrowRight size={11} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-[13px]">No bookings yet</div>
                ) : (
                  <div>
                    {(recentBookings as any[]).map((b: any, i: number) => (
                      <div key={b.id}>
                        <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/70 transition-colors group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-bold text-slate-600 group-hover:bg-slate-200 transition-colors">
                              {b.client?.full_name?.charAt(0) ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 truncate">{b.client?.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{b.booking_ref}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={b.status} />
                            <p className="text-[13px] font-bold text-slate-900 tabular-nums">
                              {formatCurrency(b.total_amount)}
                            </p>
                          </div>
                        </Link>
                        {i < recentBookings.length - 1 && <Separator className="mx-5 w-auto" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-semibold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                <QuickAction href="/dashboard/bookings/new"  label="New Booking"    icon={Calendar}      color="bg-blue-500"    />
                <QuickAction href="/dashboard/clients/new"   label="Add Client"     icon={Users}         color="bg-violet-500"  />
                <QuickAction href="/dashboard/sell-ticket"   label="Sell Ticket"    icon={Ticket}        color="bg-amber-500"   />
                <QuickAction href="/dashboard/quotations/new" label="New Quotation" icon={FileSignature}  color="bg-emerald-500" />
                <QuickAction href="/dashboard/visa/new"      label="Visa App"       icon={ShieldCheck}   color="bg-rose-500"    />
                <QuickAction href="/dashboard/invoices/new"  label="New Invoice"    icon={FileText}      color="bg-slate-700"   />
              </CardContent>
            </Card>

            {/* Mini stats */}
            <Card className="border-slate-100 shadow-none">
              <CardContent className="p-4 space-y-3">
                {[
                  { label: 'Inquiries pending',  value: newInquiries,  href: '/dashboard/inquiries',  color: 'text-amber-600'   },
                  { label: 'Visa alerts',        value: visaAlerts.length, href: '/dashboard/visa',   color: 'text-red-600'     },
                ].map(item => (
                  <Link key={item.label} href={item.href} className="flex items-center justify-between group">
                    <span className="text-[12px] text-slate-500 group-hover:text-slate-700 transition-colors">{item.label}</span>
                    <span className={`text-[13px] font-bold ${item.color}`}>{item.value}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // BOOKING AGENT
  // ════════════════════════════════════════════════════════════════════
  if (isBookingAgent) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{greeting}, {firstName} 👋</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Your personal booking performance</p>
          </div>
          <Link href="/dashboard/bookings/new">
            <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
              <Plus size={12} /> New Booking
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="My Bookings"         value={myBookings.length}          icon={Calendar}   sub="All time"      trend="neutral" />
          <StatCard label="My Clients"          value={myUniqueClients}            icon={Users}      sub="Unique"        trend="neutral" />
          <StatCard label={`Revenue ${monthLabel}`} value={formatCurrency(myMonthRevenue)} icon={TrendingUp} sub="This month" trend="up" />
          <StatCard label="Total Revenue"       value={formatCurrency(myTotalRevenue)} icon={DollarSign} sub="All time"  trend="up"     />
        </div>

        {pendingCount > 0 && (
          <Link href="/dashboard/bookings">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-5 flex items-center justify-between hover:bg-amber-100/50 transition-colors">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600" />
                <span className="text-[13px] font-medium text-amber-800">
                  {pendingCount} booking{pendingCount > 1 ? 's' : ''} waiting for follow-up
                </span>
              </div>
              <ArrowRight size={13} className="text-amber-600" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-900">My Recent Bookings</CardTitle>
                  <Link href="/dashboard/bookings" className="text-[12px] text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1">
                    View all <ArrowRight size={11} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {myBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-[13px]">No bookings yet — create your first!</div>
                ) : (
                  (myBookings as any[]).map((b: any, i: number) => (
                    <div key={b.id}>
                      <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-bold text-slate-600">
                            {b.client?.full_name?.charAt(0) ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{b.client?.full_name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{b.booking_ref}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={b.status} />
                          <p className="text-[13px] font-bold text-slate-900">{formatCurrency(b.total_amount)}</p>
                        </div>
                      </Link>
                      {i < myBookings.length - 1 && <Separator className="mx-5 w-auto" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-semibold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                <QuickAction href="/dashboard/bookings/new"   label="New Booking"   icon={Calendar}      color="bg-blue-500"    />
                <QuickAction href="/dashboard/clients/new"    label="Add Client"    icon={Users}         color="bg-violet-500"  />
                <QuickAction href="/dashboard/quotations/new" label="New Quote"     icon={FileSignature} color="bg-emerald-500" />
                <QuickAction href="/dashboard/visa/new"       label="Visa App"      icon={ShieldCheck}   color="bg-rose-500"    />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // TICKETING STAFF
  // ════════════════════════════════════════════════════════════════════
  if (isTicketing) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{greeting}, {firstName} ✈️</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Your ticketing performance</p>
          </div>
          <Link href="/dashboard/sell-ticket">
            <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
              <Zap size={12} /> Sell Ticket
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="My Tickets Today"   value={totalTicketsToday}                   icon={Ticket}     sub="Today only"   trend="neutral" />
          <StatCard label="Revenue Today"      value={formatCurrency(todayRevenue)}        icon={TrendingUp} sub="Today"        trend="up"      />
          <StatCard label="Total Revenue"      value={formatCurrency(myTotalTicketRevenue)} icon={DollarSign} sub="All time"    trend="up"      />
          <StatCard label="Active Batches"     value={batches.length}                      icon={Package}    sub="In stock"     trend="neutral" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-semibold text-slate-900">My Recent Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentSales.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-[13px]">No sales yet — sell your first ticket!</div>
                ) : (
                  (recentSales as any[]).map((s: any, i: number) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <Ticket size={13} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{s.buyer_name ?? 'Walk-in'}</p>
                            <p className="text-[11px] text-slate-400">
                              {s.receipt_number}{s.route_from && s.route_to ? ` · ${s.route_from} → ${s.route_to}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-bold text-slate-900">{formatCurrency(s.sold_price)}</p>
                          <p className="text-[11px] text-slate-400">{s.sale_date}</p>
                        </div>
                      </div>
                      {i < recentSales.length - 1 && <Separator className="mx-5 w-auto" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-900">Batch Stock</CardTitle>
                  <Link href="/dashboard/inventory" className="text-[12px] text-slate-500 hover:text-slate-900 flex items-center gap-1">
                    All <ArrowRight size={11} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {batches.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-[13px]">No batches</p>
                ) : (
                  (batches as any[]).map((b: any, i: number) => (
                    <div key={b.id}>
                      <div className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-mono text-blue-600 font-semibold">{b.batch_number}</p>
                          <Badge variant="outline" className={`text-[10px] ${Number(b.available_seats) < 5 ? 'border-red-200 text-red-600 bg-red-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
                            {b.available_seats} seats
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{b.departure_city} → {b.arrival_city}</p>
                      </div>
                      {i < batches.length - 1 && <Separator className="mx-5 w-auto" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-none">
              <CardContent className="p-3 space-y-1.5">
                <QuickAction href="/dashboard/sell-ticket" label="Sell Ticket Now"  icon={Zap}     color="bg-amber-500"  />
                <QuickAction href="/dashboard/inventory"   label="View Batch Stock" icon={Package} color="bg-slate-700"  />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // ACCOUNTS
  // ════════════════════════════════════════════════════════════════════
  if (isAccountant) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{greeting}, {firstName} 📊</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Financial overview · {monthLabel}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label={`Collected — ${monthLabel}`} value={formatCurrency(totalCollectedMonth)} icon={CreditCard}  sub="This month"  trend="up"      />
          <StatCard label="Owed to Suppliers"           value={formatCurrency(totalOwed)}           icon={AlertCircle} sub="Outstanding" trend="down"    />
          <StatCard label="Client Balances Due"         value={formatCurrency(totalOverdue)}        icon={BookOpen}    sub="Overdue"     trend="down"    />
          <StatCard label="Unpaid Invoices"             value={unpaidInvoices}                      icon={FileText}    sub="Need action" trend="neutral" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {/* Outstanding balances */}
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-900">Outstanding Client Balances</CardTitle>
                  <Link href="/dashboard/ledger" className="text-[12px] text-slate-500 hover:text-slate-900 flex items-center gap-1">
                    Ledger <ArrowRight size={11} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {overdueList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-[13px]">All balances clear ✓</div>
                ) : (
                  (overdueList as any[]).map((b: any, i: number) => (
                    <div key={b.id}>
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-600">
                            {b.client?.full_name?.charAt(0) ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{b.client?.full_name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{b.booking_ref}</p>
                          </div>
                        </div>
                        <p className="text-[13px] font-bold text-red-600 shrink-0">
                          {formatCurrency(Number(b.total_amount) - Number(b.paid_amount))}
                        </p>
                      </div>
                      {i < overdueList.length - 1 && <Separator className="mx-5 w-auto" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent payments */}
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-semibold text-slate-900">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-[13px]">No payments yet</div>
                ) : (
                  (payments as any[]).map((p: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-slate-900 capitalize">{p.payment_method ?? 'Payment'}</p>
                          <p className="text-[11px] text-slate-400">
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                        </div>
                        <p className="text-[13px] font-bold text-emerald-600">{formatCurrency(p.amount)}</p>
                      </div>
                      {i < payments.length - 1 && <Separator className="mx-5 w-auto" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Supplier payables */}
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="px-5 py-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-900">Supplier Payables</CardTitle>
                  <Link href="/dashboard/supplier-payments" className="text-[12px] text-slate-500 hover:text-slate-900 flex items-center gap-1">
                    All <ArrowRight size={11} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {supplierOwed.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-[13px]">No outstanding</p>
                ) : (
                  (supplierOwed as any[]).map((s: any, i: number) => (
                    <div key={s.supplier_id}>
                      <div className="flex items-center justify-between px-5 py-3">
                        <p className="text-[13px] font-medium text-slate-700 truncate">{s.supplier_name}</p>
                        <p className="text-[13px] font-bold text-red-600 shrink-0 ml-2">{formatCurrency(s.outstanding_amount)}</p>
                      </div>
                      {i < supplierOwed.length - 1 && <Separator className="mx-5 w-auto" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="border-slate-100 shadow-none">
              <CardContent className="p-3 space-y-1.5">
                <QuickAction href="/dashboard/ledger"            label="Ledger/Khata"     icon={BookOpen}   color="bg-slate-700"   />
                <QuickAction href="/dashboard/financial"         label="Financial Reports" icon={TrendingUp} color="bg-blue-500"    />
                <QuickAction href="/dashboard/supplier-payments" label="Supplier Payments" icon={CreditCard} color="bg-violet-500"  />
                <QuickAction href="/dashboard/invoices"          label="Invoices"          icon={FileText}   color="bg-emerald-500" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ── Fallback ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserCog size={28} className="text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">Welcome, {firstName}!</h1>
        <p className="text-[13px] text-slate-500">No role assigned yet. Contact your manager to get access.</p>
      </div>
    </div>
  )
}