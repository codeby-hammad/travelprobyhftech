import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import NewSubAgentForm from '@/components/inventory/NewSubAgentForm'

export default async function SubAgentsPage() {
  const supabase = await createClient()
  const { data: agents } = await supabase
    .from('sub_agents')
    .select('*')
    .order('name')

  const totalOutstanding = agents?.reduce(
    (s, a) => s + Number(a.current_balance), 0
  ) ?? 0

  const nearLimit = agents?.filter(a =>
    Number(a.credit_limit) > 0 &&
    (Number(a.current_balance) / Number(a.credit_limit)) > 0.8
  ) ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Agents</h1>
          <p className="text-gray-500 text-sm mt-1">
            {agents?.length ?? 0} sub-agents •{' '}
            PKR {totalOutstanding.toLocaleString()} outstanding
          </p>
        </div>
        <Link href="/dashboard/subagents/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Add sub-agent
        </Link>
      </div>

      {nearLimit.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-orange-600" />
            <p className="font-semibold text-orange-800 text-sm">
              {nearLimit.length} agent(s) near credit limit
            </p>
          </div>
          {nearLimit.map(a => (
            <p key={a.id} className="text-sm text-orange-700">
              • {a.name} — {formatCurrency(a.current_balance)} / {formatCurrency(a.credit_limit)} used
            </p>
          ))}
        </div>
      )}

      {(!agents || agents.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No sub-agents yet</p>
          <Link href="/dashboard/subagents/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            <Plus size={15} /> Add sub-agent
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents?.map(agent => {
          const usedPct = Number(agent.credit_limit) > 0
            ? Math.round((Number(agent.current_balance) / Number(agent.credit_limit)) * 100)
            : 0

          return (
            <div key={agent.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  {agent.contact_person && (
                    <p className="text-xs text-gray-400">{agent.contact_person}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  agent.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {agent.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {agent.city && (
                <p className="text-xs text-gray-500 mb-3">📍 {agent.city}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Outstanding</span>
                  <span className={`font-bold ${
                    Number(agent.current_balance) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(agent.current_balance)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Credit limit</span>
                  <span className="font-medium">{formatCurrency(agent.credit_limit)}</span>
                </div>
                {agent.discount_percent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-purple-600 font-medium">{agent.discount_percent}%</span>
                  </div>
                )}
              </div>

              {Number(agent.credit_limit) > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usedPct > 80 ? 'bg-red-500' :
                        usedPct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usedPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {usedPct}% credit used
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}