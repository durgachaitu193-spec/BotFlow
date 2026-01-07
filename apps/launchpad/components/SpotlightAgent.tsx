import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { DataSet } from 'vis-data'
import { generateNetworkData, type NodeData } from '@/lib/mockData'
import { getAgents } from '@/actions/getAgents'
import NetworkGraph from './NetworkGraph'

export default function SpotlightAgent() {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0)
  const [networkData, setNetworkData] = useState<{
    nodes: any
    edges: any
  } | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents = await getAgents()
        const data = generateNetworkData(agents)
        setNetworkData({
          nodes: new DataSet(data.nodes),
          edges: new DataSet(data.edges),
        })
      } catch (error) {
        console.error('Failed to fetch agents:', error)
        const data = generateNetworkData()
        setNetworkData({
          nodes: new DataSet(data.nodes),
          edges: new DataSet(data.edges),
        })
      }
    }

    fetchAgents()
  }, [])

  const handleNext = () => {
    if (!networkData) return
    setCurrentAgentIndex((prev) => (prev + 1) % networkData.nodes.length)
  }

  const handlePrev = () => {
    if (!networkData) return
    setCurrentAgentIndex((prev) => (prev - 1 + networkData.nodes.length) % networkData.nodes.length)
  }

  if (!networkData) return null

  const allNodes = networkData.nodes.get() as NodeData[]
  const currentAgent = allNodes[currentAgentIndex]

  if (!currentAgent) return null

  return (
    <div
      className='relative w-full rounded-3xl p-4'
      style={{
        background:
          'linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)',
        border: '1px solid rgba(0, 249, 207, 0.3)',
        backdropFilter: 'blur(92px)',
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className='relative z-10 flex h-auto min-h-[600px] flex-col-reverse rounded-[20px] p-4 md:flex-row'>
        <div className='relative z-20 flex flex-1 flex-col justify-between p-4 md:p-10'>
          <div>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 font-medium text-accent-primary text-xs'>
              <Sparkles className='h-3 w-3' />
              Spotlight Agent
            </div>

            <AnimatePresence mode='wait'>
              <motion.div
                key={currentAgent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className='mb-6 flex items-start justify-between'>
                  <div className='flex items-center gap-3 md:gap-4'>
                    <div className='h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-accent-primary/50 bg-bg-surface p-1 md:h-16 md:w-16'>
                      <img
                        src={currentAgent.image}
                        alt={currentAgent.label}
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div>
                      <h2 className='font-bold text-white text-xl md:text-2xl'>
                        {currentAgent.label}
                      </h2>
                      <div className='flex items-center gap-2 text-text-secondary text-xs md:text-sm'>
                        <span
                          className={`h-2 w-2 rounded-full ${currentAgent.status === 'active' ? 'animate-pulse bg-status-success' : 'bg-yellow-500'}`}
                        />
                        Autonomous Agent
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-text-secondary text-xs'>FDV</div>
                    <div className='font-bold text-lg text-white md:text-xl'>
                      {currentAgent.fdv || '$11M'}
                    </div>
                    <div className='font-medium text-status-success text-xs md:text-sm'>
                      {currentAgent.change || '+2.80%'}
                    </div>
                  </div>
                </div>

                <div className='mb-6'>
                  <div className='mb-1 font-bold text-3xl text-white md:text-4xl'>
                    {currentAgent.transactions?.toLocaleString() || '0'}
                  </div>
                  <div className='text-sm text-text-secondary'>Transactions</div>
                </div>

                <div className='mb-6'>
                  <div className='mb-2 text-sm text-text-secondary'>Interacted with</div>
                  <div className='-space-x-2 flex'>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className='h-8 w-8 overflow-hidden rounded-full border-2 border-bg-deep bg-bg-surface'
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${String(currentAgent.id)}${i}`}
                          alt='User'
                          className='h-full w-full object-cover'
                        />
                      </div>
                    ))}
                    <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-deep bg-bg-surface font-medium text-text-secondary text-xs'>
                      +12
                    </div>
                  </div>
                </div>

                <div className='mb-8'>
                  <div className='mb-2 text-sm text-text-secondary'>Description</div>
                  <p className='line-clamp-3 text-sm text-text-secondary leading-relaxed'>
                    {currentAgent.description ||
                      'An AI brand ambassador and campaign orchestrator for crypto token projects. Mobilizes network to execute complex DeFi strategies.'}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap gap-3'>
              <Link
                href={`/agent/${currentAgent.id}`}
                className='group flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-all hover:scale-[1.02]'
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)',
                  boxShadow:
                    'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 255, 243, 0.1)',
                }}
              >
                View Profile
                <ArrowRight className='h-4 w-4 text-white transition-transform group-hover:translate-x-1' />
              </Link>
              <Link
                href='/network'
                className='flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all hover:bg-white/10'
              >
                <ExternalLink className='h-5 w-5' />
              </Link>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <button
                onClick={handlePrev}
                className='flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95'
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)',
                  boxShadow:
                    'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 255, 243, 0.1)',
                }}
              >
                <ArrowLeft size={20} className='text-white' />
              </button>
              <div className='flex items-center gap-2'>
                {allNodes.slice(0, 5).map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === currentAgentIndex % 5 ? 'h-3 w-8' : 'h-3 w-3'}`}
                    style={{
                      background:
                        i === currentAgentIndex % 5
                          ? 'linear-gradient(180deg, rgba(0, 255, 243, 0.2) 0%, rgba(0, 255, 243, 0.05) 100%)'
                          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      boxShadow:
                        'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)',
                      border:
                        i === currentAgentIndex % 5
                          ? '1px solid rgba(0, 255, 243, 0.2)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className='flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95'
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)',
                  boxShadow:
                    'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 255, 243, 0.1)',
                }}
              >
                <ArrowRight size={20} className='text-white' />
              </button>
            </div>
          </div>
        </div>
        <div className='relative min-h-[500px] flex-1 overflow-hidden rounded-b-[20px] md:min-h-auto md:rounded-r-[20px] md:rounded-bl-none'>
          <NetworkGraph
            data={networkData}
            focusedNodeId={currentAgent.id}
            disableDetailsPanel={true}
          />
        </div>
      </div>
    </div>
  )
}
