'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import AgentInfo from '@/components/AgentInfo'
import CandlestickChart from '@/components/CandlestickChart'
import Comments from '@/components/Comments'
import DashboardLayout from '@/components/DashboardLayout'
import HoldersList from '@/components/HoldersList'
import TradeForm from '@/components/TradeForm'
import TransactionList from '@/components/TransactionList'
import type { Agent } from '@/lib/agentsData'

interface AgentDetailClientProps {
  agent: Agent
}

export default function AgentDetailClient({ agent }: AgentDetailClientProps) {
  if (!agent) {
    return (
      <DashboardLayout>
        <div className='flex h-[50vh] items-center justify-center text-text-secondary'>
          Agent not found
        </div>
      </DashboardLayout>
    )
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Address copied to clipboard')
  }

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Top Bar Info */}
        <div className='flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-bg-card p-4'>
          <div className='flex items-center gap-4'>
            <div className='h-14 w-14 overflow-hidden rounded-lg bg-bg-surface border border-white/10'>
              <img src={agent.image} alt='Agent Avatar' className='h-full w-full object-cover' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold text-white'>{agent.name}</h1>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <span className='font-bold text-white'>{agent.ticker}</span>
                <span className='rounded bg-white/5 px-1.5 py-0.5 text-xs text-text-secondary'>
                  {agent.contractAddress || 'CSrw...pump'}
                </span>
                <Copy
                  className='h-3 w-3 cursor-pointer text-text-muted hover:text-white'
                  onClick={() => handleCopy(agent.contractAddress || '')}
                />
              </div>
              <div className='mt-1 flex flex-col gap-1 text-xs text-text-muted'>
                <div className='flex items-center gap-2'>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.creator}`}
                    alt='Creator'
                    className='h-4 w-4 rounded-full'
                  />
                  <span>{agent.creator}</span>
                </div>
                <span>{agent.timeAgo}</span>
                <span className='flex items-center gap-2'>
                  {agent.chatUrl} <ExternalLink className='h-4 w-4' />
                  <Copy
                    className='h-3 w-3 cursor-pointer text-text-muted hover:text-white'
                    onClick={() => handleCopy(agent.chatUrl || '')}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            <a
              href={`https://testnet.bscscan.com/address/${agent.contractAddress}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-bold text-bg-deep hover:bg-accent-primary/90'
            >
              <ExternalLink className='h-4 w-4' />
              View Token (On Chain)
            </a>
            {/* <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10">
              <Star className="h-5 w-5" />
            </button> */}
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Left Column: Chart & Comments */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Market Stats Bar */}
            <div className='flex flex-wrap items-end gap-8'>
              <div>
                <div className='text-xs text-text-muted mb-1'>Market Cap</div>
                <div className='text-2xl font-bold text-white'>{agent.marketCap}</div>
                <div
                  className={`text-xs ${agent.change.startsWith('+') ? 'text-status-success' : 'text-status-error'}`}
                >
                  {agent.change} 24hr
                </div>
              </div>
              <div className='flex-1 h-2 rounded-full bg-bg-surface overflow-hidden self-center max-w-xs'>
                <div className='h-full w-[40%] bg-gradient-to-r from-status-success to-accent-primary' />
              </div>
              <div className='text-sm font-bold text-white self-center'>ATH {agent.fdv}</div>
            </div>

            {/* Chart */}
            <div
              className='h-[500px] rounded-xl bg-bg-card p-1 overflow-hidden'
              style={{
                background:
                  'linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)',
                border: '1px solid rgba(0, 249, 207, 0.3)',
                backdropFilter: 'blur(92px)',
                boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
              }}
            >
              <CandlestickChart id={agent.id.toString()} />
            </div>

            {/* Recent Activity */}
            <TransactionList tokenId={agent.id.toString()} />

            {/* Comments */}
            <Comments agentId={agent.id.toString()} />
          </div>

          {/* Right Column: Trade & Info */}
          <div className='space-y-6'>
            <TradeForm agent={agent} />

            {/* Bonding Curve Progress */}
            <div className='rounded-xl border border-white/5 bg-bg-card p-6'>
              <div className='mb-2 flex justify-between items-center'>
                <h3 className='text-sm font-semibold text-white'>Bonding Curve Progress</h3>
                <span className='text-sm font-bold text-accent-primary'>100.0%</span>
              </div>
              <div className='mb-4 h-3 w-full overflow-hidden rounded-full bg-bg-surface'>
                <div className='h-full w-full rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' />
              </div>
              <p className='text-xs text-text-muted'>Coin has graduated!</p>
            </div>

            {/* Chat Section - Only for chat agents */}
            {agent.deploymentType === 'chat' && agent.chatUrl && (
              <div className='bg-[#0D1117] border border-[#30363D] rounded-xl p-6 mb-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-[#161B22]'>
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div>
                      <h3 className='font-bold text-lg text-white'>{agent.name} chat</h3>
                      <p className='text-[#8B949E] text-sm'>{agent.holders || 0} members</p>
                    </div>
                  </div>
                  <a
                    href={agent.chatUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='px-6 py-2 bg-[#1F242C] hover:bg-[#2D333B] text-white rounded-lg font-medium transition-colors'
                  >
                    Join chat
                  </a>
                </div>
              </div>
            )}
            <AgentInfo agent={agent} />

            <HoldersList tokenId={agent.id.toString()} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
