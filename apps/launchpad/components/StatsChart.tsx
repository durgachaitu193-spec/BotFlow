'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
]

export default function StatsChart() {
  return (
    <div className='flex h-full w-full flex-col rounded-2xl border border-white/5 bg-bg-card p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h3 className='font-semibold text-lg text-text-primary'>System Performance</h3>
          <p className='text-sm text-text-secondary'>Task execution rate over time</p>
        </div>
        <select className='rounded-lg border border-white/10 bg-bg-surface px-3 py-1.5 text-sm text-text-secondary focus:outline-none'>
          <option>Last 7 days</option>
          <option>Last 24 hours</option>
          <option>Last 30 days</option>
        </select>
      </div>

      <div className='min-h-0 w-full flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id='colorValue' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#F26522' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#F26522' stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='#333' vertical={false} />
            <XAxis
              dataKey='name'
              stroke='#6B7280'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='#6B7280'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#131316',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke='#F26522'
              strokeWidth={2}
              fillOpacity={1}
              fill='url(#colorValue)'
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
