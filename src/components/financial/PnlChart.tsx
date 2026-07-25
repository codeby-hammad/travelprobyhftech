'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type Props = {
  data: { month: string; income: number; expenses: number; profit: number }[]
  type?: 'pnl' | 'cash'
}

export default function PnlChart({ data, type = 'pnl' }: Props) {
  const hasData = data.some(d => d.income > 0 || d.expenses > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data yet
      </div>
    )
  }

  const fmt = (v: number) =>
    v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` :
    v >= 1000    ? `${(v / 1000).toFixed(0)}K`    :
                    v.toString()

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
        />
       <Tooltip
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : Number(value ?? 0)
            const label =
              name === 'income'   ? (type === 'cash' ? 'Cash in'  : 'Income')   :
              name === 'expenses' ? (type === 'cash' ? 'Cash out' : 'Expenses') :
                                     'Net profit'
            return [
              new Intl.NumberFormat('en-PK', {
                style:                 'currency',
                currency:              'PKR',
                minimumFractionDigits: 0,
              }).format(numValue),
              label,
            ]
          }}
          contentStyle={{
            borderRadius: '8px',
            border:       '1px solid #e5e7eb',
            fontSize:     '11px',
          }}
        />
        <Legend
          formatter={(value: string) =>
            value === 'income'   ? (type === 'cash' ? 'Cash in'  : 'Income')   :
            value === 'expenses' ? (type === 'cash' ? 'Cash out' : 'Expenses') :
                                    'Net profit'
          }
          wrapperStyle={{ fontSize: '11px' }}
        />
        <Bar dataKey="income"   fill="#22c55e" radius={[3,3,0,0]} opacity={0.85} />
        <Bar dataKey="expenses" fill="#f87171" radius={[3,3,0,0]} opacity={0.85} />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#3b82f6' }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}