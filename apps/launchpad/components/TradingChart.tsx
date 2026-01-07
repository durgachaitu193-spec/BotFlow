'use client'

import { useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const generateTradingData = (days: number) => {
  const data = []
  let basePrice = 1.24

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * 0.15
    basePrice = Math.max(0.5, basePrice + change)
    const volume = Math.random() * 5000000 + 1000000

    data.push({
      time: i,
      price: Number.parseFloat(basePrice.toFixed(4)),
      volume: Number.parseFloat(volume.toFixed(0)),
      high: Number.parseFloat((basePrice * 1.02).toFixed(4)),
      low: Number.parseFloat((basePrice * 0.98).toFixed(4)),
    })
  }

  return data
}

const timeframes = [
  { label: '1H', days: 24 },
  { label: '1D', days: 48 },
  { label: '1W', days: 168 },
  { label: '1M', days: 720 },
  { label: 'ALL', days: 365 },
]

export default function TradingChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [data] = useState(() => generateTradingData(48))

  const formatXAxis = (value: number) => {
    const hours = value % 24
    return `${hours}:00`
  }

  const formatPrice = (value: number) => `$${value.toFixed(2)}`
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  const maxVolume = Math.max(...data.map((d) => d.volume))
  const minPrice = Math.min(...data.map((d) => d.low))
  const maxPrice = Math.max(...data.map((d) => d.high))

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4 flex justify-end gap-2'>
        {timeframes.map((tf) => (
          <button
            key={tf.label}
            onClick={() => setSelectedTimeframe(tf.label)}
            className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
              selectedTimeframe === tf.label
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'bg-bg-surface text-text-secondary hover:bg-white/5 hover:text-white'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div className='min-h-0 w-full flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id='colorPrice' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#F26522' stopOpacity={0.4} />
                <stop offset='95%' stopColor='#F26522' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='colorVolume' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#10B981' stopOpacity={0.6} />
                <stop offset='95%' stopColor='#10B981' stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray='3 3' stroke='#1F2937' vertical={false} opacity={0.3} />

            <XAxis
              dataKey='time'
              stroke='#6B7280'
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              interval='preserveStartEnd'
            />
            <YAxis
              yAxisId='price'
              stroke='#6B7280'
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatPrice}
              domain={[minPrice * 0.98, maxPrice * 1.02]}
            />
            <YAxis
              yAxisId='volume'
              orientation='right'
              stroke='#6B7280'
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatVolume}
              domain={[0, maxVolume * 2]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0F1419',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px',
              }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              labelStyle={{
                color: '#9CA3AF',
                fontSize: '11px',
                marginBottom: '4px',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'price') return [formatPrice(value), 'Price']
                if (name === 'volume') return [formatVolume(value), 'Volume']
                return [value, name]
              }}
            />
            <Bar
              yAxisId='volume'
              dataKey='volume'
              fill='url(#colorVolume)'
              radius={[4, 4, 0, 0]}
              opacity={0.5}
            />
            <Area
              yAxisId='price'
              type='monotone'
              dataKey='price'
              stroke='#F26522'
              strokeWidth={2}
              fillOpacity={1}
              fill='url(#colorPrice)'
            />
            <ReferenceLine
              yAxisId='price'
              y={data[data.length - 1]?.price}
              stroke='#F26522'
              strokeDasharray='3 3'
              opacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className='mt-4 grid grid-cols-4 gap-4 rounded-xl bg-bg-surface/50 p-4'>
        <div>
          <div className='mb-1 text-text-muted text-xs'>High</div>
          <div className='font-semibold text-sm text-status-success'>{formatPrice(maxPrice)}</div>
        </div>
        <div>
          <div className='mb-1 text-text-muted text-xs'>Low</div>
          <div className='font-semibold text-sm text-status-error'>{formatPrice(minPrice)}</div>
        </div>
        <div>
          <div className='mb-1 text-text-muted text-xs'>Volume</div>
          <div className='font-semibold text-sm text-white'>
            {formatVolume(data.reduce((sum, d) => sum + d.volume, 0))}
          </div>
        </div>
        <div>
          <div className='mb-1 text-text-muted text-xs'>Avg Price</div>
          <div className='font-semibold text-sm text-white'>
            {formatPrice(data.reduce((sum, d) => sum + d.price, 0) / data.length)}
          </div>
        </div>
      </div>
    </div>
  )
}
