'use client'

import type React from 'react'
import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { MessageSquare, Zap } from 'lucide-react'
import Link from 'next/link'
import type { Agent } from '@/lib/agentsData'

interface AgentCardProps {
  agent: Agent
  index: number
}

const ROTATION_RANGE = 20
const HALF_ROTATION_RANGE = ROTATION_RANGE / 2

export default function AgentCard({ agent, index }: AgentCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const xSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(ySpring, [-0.5, 0.5], [ROTATION_RANGE, -ROTATION_RANGE])
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-ROTATION_RANGE, ROTATION_RANGE])

  const shineX = useTransform(xSpring, [-0.5, 0.5], ['0%', '100%'])
  const shineY = useTransform(ySpring, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const mouseX = (e.clientX - rect.left) / width - 0.5
    const mouseY = (e.clientY - rect.top) / height - 0.5

    x.set(mouseX)
    y.set(mouseY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      style={{
        perspective: 1000,
      }}
      className='h-full'
    >
      <Link href={`/agent/${agent.id}`}>
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className='group relative h-full cursor-pointer rounded-2xl border border-white/5 bg-bg-card p-4 transition-all hover:border-accent-primary/50 hover:shadow-glow-primary'
        >
          <motion.div
            style={{
              background: useMotionTemplate`radial-gradient(
                circle at ${shineX} ${shineY},
                rgba(255, 255, 255, 0.15),
                transparent 80%
              )`,
            }}
            className='pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          />
          <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
          {index % 4 === 0 && (
            <div
              className='translate-z-20 absolute top-4 right-4 z-20 transform-gpu'
              style={{ transform: 'translateZ(20px)' }}
            >
              <div className='flex items-center gap-1 rounded-full bg-status-success/20 px-2 py-1 font-medium text-status-success text-xs backdrop-blur-md'>
                <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-status-success' />
                LIVE
              </div>
            </div>
          )}

          <div
            className='relative z-10 flex h-full transform-gpu flex-col'
            style={{ transform: 'translateZ(10px)' }}
          >
            <div className='mb-3 flex gap-4'>
              <motion.div
                className='h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-bg-surface p-1 shadow-lg'
                style={{ transform: 'translateZ(30px)' }}
              >
                <img
                  src={agent.image}
                  alt={agent.name}
                  className='h-full w-full rounded-lg bg-bg-deep object-cover'
                />
              </motion.div>
              <div className='min-w-0 flex-1' style={{ transform: 'translateZ(20px)' }}>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h3 className='truncate font-bold text-lg text-text-primary leading-tight'>
                      {agent.name}
                    </h3>
                    <div className='mt-1 flex items-center gap-2'>
                      <span className='rounded bg-accent-primary/10 px-1.5 py-0.5 font-bold text-accent-primary text-xs'>
                        ${agent.ticker}
                      </span>
                      <span className='text-text-muted text-xs'>{agent.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <div className='mt-2 flex items-center gap-2 text-text-secondary text-xs'>
                  <span className='truncate'>by {agent.creator}</span>
                </div>
              </div>
            </div>
            {agent.description && (
              <p
                className='mb-4 line-clamp-2 text-text-muted text-xs leading-relaxed'
                style={{ transform: 'translateZ(15px)' }}
              >
                {agent.description}
              </p>
            )}

            <div className='mt-auto space-y-3' style={{ transform: 'translateZ(25px)' }}>
              <div className='flex items-center justify-between rounded-lg bg-bg-surface/50 p-2.5 shadow-inner'>
                <div>
                  <div className='font-medium text-[10px] text-text-muted uppercase tracking-wider'>
                    Market Cap
                  </div>
                  <div className='font-bold font-mono text-sm text-text-primary'>
                    {agent.marketCap}
                  </div>
                </div>
                <div
                  className={`text-right ${agent.isPositive ? 'text-status-success' : 'text-status-error'}`}
                >
                  <div className='font-medium text-[10px] text-text-muted uppercase tracking-wider opacity-0'>
                    Change
                  </div>
                  <div className='flex items-center justify-end gap-1 rounded bg-current/10 px-2 py-0.5 font-bold text-sm'>
                    {agent.change}
                  </div>
                </div>
              </div>
              <div className='grid translate-y-2 grid-cols-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'>
                <button className='flex items-center justify-center gap-1.5 rounded-lg bg-accent-primary/10 py-2 font-bold text-accent-primary text-xs shadow-lg transition-colors hover:bg-accent-primary hover:text-bg-deep hover:shadow-accent-primary/25'>
                  <Zap className='h-3.5 w-3.5' />
                  Quick Buy
                </button>
                <div className='flex items-center justify-center gap-1.5 rounded-lg bg-bg-surface py-2 font-medium text-text-secondary text-xs shadow-lg'>
                  <MessageSquare className='h-3.5 w-3.5' />
                  Replies
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
