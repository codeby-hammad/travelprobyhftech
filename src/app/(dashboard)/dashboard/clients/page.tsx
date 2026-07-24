import { createClient }  from '@/lib/supabase/server'
import { formatDate }    from '@/lib/utils'
import Link              from 'next/link'
import { Plus, Search, Users, Phone, Globe } from 'lucide-react'
import { Button }        from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input }         from '@/components/ui/input'
import { Separator }     from '@/components/ui/separator'
import { Badge }         from '@/components/ui/badge'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  const total = clients?.length ?? 0

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{total} clients in your CRM</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
            <Plus size={12} /> Add Client
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card className="border-slate-100 shadow-none">
        <CardHeader className="px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search clients..." className="pl-8 h-8 text-[13px] border-slate-200 bg-slate-50 focus:bg-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(!clients || clients.length === 0) ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-slate-400" />
              </div>
              <p className="text-[14px] font-medium text-slate-600 mb-1">No clients yet</p>
              <p className="text-[13px] text-slate-400 mb-4">Add your first client to get started</p>
              <Link href="/dashboard/clients/new">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-[12px] gap-1.5">
                  <Plus size={12} /> Add Client
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Name</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                <p className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Nationality</p>
                <p className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Added</p>
              </div>

              {clients.map((c: any, i: number) => (
                <div key={c.id}>
                  <Link href={`/dashboard/clients/${c.id}`} className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-slate-50/70 transition-colors items-center group">
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold text-white group-hover:bg-slate-700 transition-colors">
                        {c.full_name?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{c.full_name}</p>
                        {c.passport_number && (
                          <p className="text-[11px] text-slate-400 font-mono">{c.passport_number}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      {c.phone && <Phone size={11} className="text-slate-400 shrink-0" />}
                      <p className="text-[13px] text-slate-500 truncate">{c.phone ?? '—'}</p>
                    </div>
                    <p className="col-span-3 text-[13px] text-slate-500 truncate">{c.email ?? '—'}</p>
                    <div className="col-span-2">
                      {c.nationality ? (
                        <Badge variant="outline" className="text-[11px] border-slate-200 text-slate-600 bg-slate-50 font-medium">
                          {c.nationality}
                        </Badge>
                      ) : (
                        <span className="text-[13px] text-slate-300">—</span>
                      )}
                    </div>
                    <p className="col-span-2 text-[12px] text-slate-400">{formatDate(c.created_at)}</p>
                  </Link>
                  {i < clients.length - 1 && <Separator className="mx-5 w-auto" />}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}