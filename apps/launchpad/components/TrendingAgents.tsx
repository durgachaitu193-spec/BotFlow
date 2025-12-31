'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Agent } from '@/lib/agentsData'
import { getAgents } from '@/actions/getAgents'

export default function TrendingAgents() {
  const [trendingAgents, setTrendingAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await getAgents()
        // For now, just take the first 4 agents as "trending"
        setTrendingAgents(data.slice(0, 4))
      } catch (error) {
        console.error('Failed to fetch trending agents', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

  if (isLoading) {
    return (
      <div className='w-full overflow-hidden'>
        <div className='mb-4 flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-accent-primary' />
          <h3 className='font-semibold text-lg text-text-primary'>Trending Agents</h3>
        </div>
        <div className='scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='h-[100px] min-w-[240px] animate-pulse rounded-xl border border-white/5 bg-bg-card'
            />
          ))}
        </div>
      </div>
    )
  }

  if (trendingAgents.length === 0) return null

  return (
    <div className='w-full overflow-hidden'>
      <div className='mb-4 flex items-center gap-2'>
        <TrendingUp className='h-5 w-5 text-accent-primary' />
        <h3 className='font-semibold text-lg text-text-primary'>Trending Agents</h3>
      </div>

      <div className='scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0'>
        {trendingAgents.map((agent, index) => (
          <Link href={`/agent/${agent.id}`} key={agent.id} className='block'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className='min-w-[240px] cursor-pointer rounded-xl border border-white/5 bg-bg-card p-4 transition-all hover:border-accent-primary/50 hover:shadow-glow-primary'
            >
              <div className='mb-3 flex items-center gap-3'>
                <div className='h-10 w-10 rounded-lg bg-bg-surface p-0.5'>
                  <img
                    src={agent.image}
                    alt={agent.name}
                    className='h-full w-full rounded-[8px] bg-bg-deep object-cover'
                  />
                </div>
                <div>
                  <div className='font-bold text-text-primary'>{agent.ticker}</div>
                  <div className='text-text-secondary text-xs'>{agent.name}</div>
                </div>
              </div>

              <div className='flex items-end justify-between'>
                <div>
                  <div className='text-text-muted text-xs'>Price</div>
                  <div className='font-medium font-mono text-text-primary'>{agent.price}</div>
                </div>
                <div
                  className={`flex items-center font-medium text-xs ${agent.change.startsWith('+') ? 'text-status-success' : 'text-status-error'}`}
                >
                  {agent.change.startsWith('+') ? (
                    <ArrowUpRight className='mr-1 h-3 w-3' />
                  ) : (
                    <ArrowDownRight className='mr-1 h-3 w-3' />
                  )}
                  {agent.change}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}
