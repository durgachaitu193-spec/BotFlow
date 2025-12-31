'use client'

import type { Agent } from '@/lib/agentsData'

interface AgentInfoProps {
  agent: Agent
}

export default function AgentInfo({ agent }: AgentInfoProps) {
  return (
    <div
      className='rounded-xl border border-white/5 bg-bg-card p-6'
      style={{
        background:
          'linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)',
        border: '1px solid rgba(0, 249, 207, 0.3)',
        backdropFilter: 'blur(92px)',
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className='mb-4 flex items-center gap-4'>
        <div className='h-16 w-16 overflow-hidden rounded-lg bg-bg-surface'>
          <img src={agent.image} alt={agent.name} className='h-full w-full object-cover' />
        </div>
        <div>
          <h3 className='font-bold text-lg text-white'>{agent.name}</h3>
          <p className='text-text-secondary text-xs'>
            Created by <span className='text-accent-primary'>{agent.creator}</span>
          </p>
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <h4 className='mb-2 font-semibold text-sm text-text-secondary uppercase tracking-wider'>
            Description
          </h4>
          <p className='text-sm text-text-muted leading-relaxed'>
            {agent.description || 'No description available.'}
          </p>
        </div>

        <div className='border-white/5 border-t pt-4'>
          <h4 className='mb-2 font-semibold text-sm text-text-secondary uppercase tracking-wider'>
            Agent Specs
          </h4>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div className='flex flex-col'>
              <span className='text-text-muted text-xs'>Model</span>
              <span className='font-medium text-white'>GPT-4 Turbo</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-text-muted text-xs'>Framework</span>
              <span className='font-medium text-white'>LangChain</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-text-muted text-xs'>Interval</span>
              <span className='font-medium text-white'>1m</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-text-muted text-xs'>Slippage</span>
              <span className='font-medium text-white'>0.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
