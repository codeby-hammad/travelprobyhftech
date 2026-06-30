import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Calendar, Users, Package } from 'lucide-react'
import VisaSearch from '@/components/visa/VisaSearch'



export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: stats }, { data: recentBookings }] = await Promise.all([
    supabase.from('profiles').select('*, organization:organizations(*)').eq('id', user!.id).single(),
    supabase.from('dashboard_stats').select('*').eq('organization_id',
      (await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()).data?.organization_id
    ).single(),
    supabase.from('bookings')
      .select('*, client:clients(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const statusColors: Record<string, string> = {
    inquiry:   'bg-yellow-50 text-yellow-700',
    quoted:    'bg-blue-50   text-blue-700',
    confirmed: 'bg-green-50  text-green-700',
    cancelled: 'bg-red-50    text-red-700',
    completed: 'bg-gray-100  text-gray-600',
  }

  return (
    <div className="p-8">
      {/* Welcome */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{profile?.organization?.name}</p>
        </div>
        <Link href="/dashboard/bookings/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> New booking
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
  
        {[
          { label: 'Total bookings',   value: stats?.total_bookings     ?? 0,  icon: Calendar, color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Confirmed',        value: stats?.confirmed_bookings ?? 0,  icon: Calendar, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Total revenue',    value: formatCurrency(stats?.total_revenue ?? 0), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pending payment',  value: formatCurrency(stats?.pending_amount ?? 0), icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(stat => (
          
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              
              <stat.icon size={20} className={stat.color} />
              
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            
          </div> 
        ))}
      </div>
      


      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {(!recentBookings || recentBookings.length === 0) ? (
          <div className="text-center py-10 text-gray-400 text-sm">No bookings yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBookings.map((b: any) => (
              <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                <div>
                  <span className="font-mono text-xs text-blue-600 font-medium">{b.booking_ref}</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{b.client?.full_name}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[b.status]}`}>
                    {b.status}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatCurrency(b.total_amount, b.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}