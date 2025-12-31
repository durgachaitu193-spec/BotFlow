'use client'

import DashboardLayout from '@/components/DashboardLayout'
import LogsTable from '@/components/LogsTable'
import SpotlightAgent from '@/components/SpotlightAgent'
import TrendingAgents from '@/components/TrendingAgents'

export default function Home() {
  return (
    <DashboardLayout>
      <div className='relative isolate w-full'>
        {/* Background Sections */}
        <div className='-z-10 pointer-events-none absolute top-0 right-0 left-0 h-[800px] w-full'>
          <div className='relative h-full w-full'>
            <img
              src='/background/launchpadbackground1.png'
              alt=''
              className='absolute inset-0 h-full w-full object-cover'
            />
            <div
              className='absolute inset-0'
              style={{
                background: 'linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000000 100%)',
              }}
            />
          </div>
        </div>

        <div className='-z-10 pointer-events-none absolute top-[800px] right-0 left-0 h-[800px] w-full'>
          <div className='relative h-full w-full'>
            <img
              src='/background/launchpadbackground2.png'
              alt=''
              className='absolute inset-0 h-full w-full object-cover'
            />
            <div
              className='absolute inset-0'
              style={{
                background: 'linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000000 100%)',
              }}
            />
          </div>
        </div>

        {/* Top Section: Trending & Spotlight */}
        <div className='mb-6'>
          <TrendingAgents />
        </div>

        <div className='grid grid-cols-1'>
          <SpotlightAgent />
        </div>
        {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-1 space-y-6">
            <ExploreAgentsCTA />
            <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Top Gainers</h3>
              <div className="space-y-4">
                {agents
                  .filter(a => a.isPositive)
                  .sort((a, b) => parseFloat(b.change.replace('%', '').replace('+', '')) - parseFloat(a.change.replace('%', '').replace('+', '')))
                  .slice(0, 3)
                  .map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent-primary/20 overflow-hidden">
                          <img src={agent.image} alt={agent.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{agent.name}</div>
                          <div className="text-xs text-text-secondary">{agent.ticker}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-status-success">{agent.change}</div>
                        <div className="text-xs text-text-muted">{agent.price || "$0.00"}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div> */}
        <div className='mt-6 grid grid-cols-1'>
          {/* <div className="md:col-span-2 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">Live Agents</h3>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text-primary hover:bg-white/10 transition-colors"
              >
                Create Agent Token
              </button>
            </div>
            <LiveAgents limit={2} showHeader={false} />
          </div> */}
          {/* <div className="md:col-span-2 lg:col-span-1 flex flex-col">
            <div className="mb-6 h-8" />
            <div className="flex-1 rounded-2xl border border-white/5 bg-bg-card p-6 min-h-[300px]">
              <CandlestickChart />
            </div>
          </div> */}

          {/* <TrendingTemplates /> */}
        </div>
        <div className='grid grid-cols-1'>
          <LogsTable />
        </div>
      </div>
    </DashboardLayout>
  )
}
