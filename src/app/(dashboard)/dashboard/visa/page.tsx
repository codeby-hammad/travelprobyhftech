import { createClient }  from '@/lib/supabase/server'
import { formatDate }    from '@/lib/utils'
import Link              from 'next/link'
import { Plus, ShieldCheck, AlertCircle, Clock } from 'lucide-react'
import { Button }        from '@/components/ui/button'
import { Badge }         from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input }         from '@/components/ui/input'
import { Search }        from 'lucide-react'
import { Separator }     from '@/components/ui/separator'

function VisaStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'bg-amber-50   text-amber-700   border-amber-200',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected:  'bg-red-50     text-red-600     border-red-200',
    submitted: 'bg-blue-50    text-blue-700    border-blue-200',
    expired:   'bg-slate-100  text-slate-500   border-slate-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  )
}

export default async function VisaPage() {
  const supabase = await createClient()

  const [{ data: visas }, { data: alerts }] = await Promise.all([
    supabase
      .from('visa_applications')
      .select('*, client:clients(full_name, phone)')
      .order('created_at', { ascending: false }),
    supabase
      .from('visa_alerts')
      .select('*')
      .order('days_until_expiry', { ascending: true })
      .limit(5),
  ])

  const total    = visas?.length ?? 0
  const pending  = visas?.filter(v => v.status === 'pending').length  ?? 0
  const approved = visas?.filter(v => v.status === 'approved').length ?? 0
  const expiring = alerts?.length ?? 0

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Visa Tracker</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{total} applications</p>
        </div>
        <Link href="/dashboard/visa/new">
          <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
            <Plus size={12} /> New Application
          </Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: total,    color: 'text-slate-900'   },
          { label: 'Pending',  value: pending,  color: 'text-amber-600'   },
          { label: 'Approved', value: approved, color: 'text-emerald-600' },
          { label: 'Expiring', value: expiring, color: 'text-red-600'     },
        ].map(k => (
          <Card key={k.label} className="border-slate-100 shadow-none">
            <CardContent className="p-4">
              <p className="text-[12px] text-slate-500 font-medium mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color} tracking-tight`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiry alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span className="text-[13px] font-semibold text-red-700">
              {alerts.length} visa{alerts.length > 1 ? 's' : ''} expiring soon
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(alerts as any[]).map((a: any) => (
              <Link key={a.id} href={`/dashboard/visa/${a.id}`}>
                <Badge variant="outline" className="text-[11px] border-red-200 text-red-600 bg-white hover:bg-red-50 cursor-pointer gap-1">
                  <Clock size={9} />
                  {a.client_name} · {a.days_until_expiry}d left
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-100 shadow-none">
        <CardHeader className="px-5 py-3.5 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search applications..." className="pl-8 h-8 text-[13px] border-slate-200 bg-slate-50 focus:bg-white" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(!visas || visas.length === 0) ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={20} className="text-slate-400" />
              </div>
              <p className="text-[14px] font-medium text-slate-600 mb-1">No visa applications</p>
              <p className="text-[13px] text-slate-400 mb-4">Create your first visa application</p>
              <Link href="/dashboard/visa/new">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-[12px] gap-1.5">
                  <Plus size={12} /> New Application
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Client</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Visa Type</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Country</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Applied</p>
                <p className="col-span-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Expiry</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</p>
              </div>

              {visas.map((v: any, i: number) => {
                const daysLeft = v.expiry_date
                  ? Math.ceil((new Date(v.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null

                return (
                  <div key={v.id}>
                    <Link href={`/dashboard/visa/${v.id}`} className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-50/70 transition-colors items-center group">
                      <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-600 group-hover:bg-slate-200 transition-colors">
                          {v.client?.full_name?.charAt(0) ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">{v.client?.full_name ?? '—'}</p>
                          {v.client?.phone && <p className="text-[11px] text-slate-400">{v.client.phone}</p>}
                        </div>
                      </div>
                      <p className="col-span-2 text-[13px] text-slate-600 capitalize">{v.visa_type ?? '—'}</p>
                      <p className="col-span-2 text-[13px] text-slate-600">{v.country ?? '—'}</p>
                      <p className="col-span-2 text-[12px] text-slate-400">{formatDate(v.applied_date)}</p>
                      <div className="col-span-1">
                        {daysLeft !== null ? (
                          <span className={`text-[12px] font-semibold ${daysLeft <= 30 ? 'text-red-600' : daysLeft <= 90 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-300">—</span>
                        )}
                      </div>
                      <div className="col-span-2"><VisaStatusBadge status={v.status} /></div>
                    </Link>
                    {i < visas.length - 1 && <Separator className="mx-5 w-auto" />}
                  </div>
                )
              })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}