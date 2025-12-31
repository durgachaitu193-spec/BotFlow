'use client'

import { useEffect, useRef, useState } from 'react'
import { Activity, Bot, X } from 'lucide-react'
import Link from 'next/link'
import { DataSet } from 'vis-data'
import { Network } from 'vis-network'

type NodeType = 'agent'

interface NodeData {
  id: string | number
  label: string
  group: NodeType
  status: 'active' | 'inactive' | 'busy'
  value?: number
  image?: string
  transactions?: number
  recentActivity?: {
    type: string
    time: string
    details: string
  }[]
}

import { generateNetworkData } from '@/lib/mockData'

interface NetworkGraphProps {
  data?: { nodes: any; edges: any }
  focusedNodeId?: string | number | null
  disableDetailsPanel?: boolean
}

const NetworkGraph = (props: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const { nodes: initialNodes, edges: initialEdges } = props.data || generateNetworkData()

  // Calculate initial active agents count
  const initialActiveAgents = props.data?.nodes ? props.data.nodes.length : initialNodes.length

  const [stats, setStats] = useState({
    tps: 3420,
    activeAgents: initialActiveAgents,
    load: 52,
  })

  useEffect(() => {
    if (!containerRef.current) return

    const nodes = props.data?.nodes || new DataSet(initialNodes)
    const edges = props.data?.edges || new DataSet(initialEdges)

    const options: any = {
      nodes: {
        borderWidth: 2,
        size: 30,
        font: {
          color: '#ffffff',
          size: 12,
          face: 'Inter',
        },
      },
      edges: {
        smooth: {
          type: 'continuous',
          forceDirection: 'none',
          roundness: 0.5,
        },
        width: 2,
        selectionWidth: 4,
        hoverWidth: 3,
        color: {
          inherit: false,
          opacity: 0.5,
        },
      },
      physics: {
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 25,
          onlyDynamicEdges: false,
          fit: true,
        },
        barnesHut: {
          gravitationalConstant: -30000,
          centralGravity: 0.3,
          springLength: 120,
          springConstant: 0.04,
          damping: 0.3,
          avoidOverlap: 1,
        },
        minVelocity: 0.75,
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        zoomView: true,
        dragView: true,
      },
    }

    const network = new Network(containerRef.current, { nodes, edges }, options)
    networkRef.current = network

    network.on('click', (params) => {
      if (props.disableDetailsPanel) return

      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        const nodeData = (nodes instanceof DataSet
          ? nodes.get(nodeId)
          : nodes.find((n: any) => n.id === nodeId)) as unknown as NodeData
        if (nodeData) {
          setSelectedNode({
            id: nodeData.id,
            label: nodeData.label,
            group: nodeData.group,
            status: nodeData.status || (Math.random() > 0.2 ? 'active' : 'busy'),
            image: nodeData.image,
            transactions: nodeData.transactions,
            recentActivity: nodeData.recentActivity,
          })
        }
      } else {
        setSelectedNode(null)
      }
    })

    const interval = setInterval(() => {
      setStats((prev) => ({
        tps: prev.tps + Math.floor(Math.random() * 50) - 25,
        activeAgents: prev.activeAgents, // Keep the count stable
        load: Math.min(100, Math.max(0, prev.load + Math.floor(Math.random() * 5) - 2)),
      }))
    }, 800)

    return () => {
      clearInterval(interval)
      network.destroy()
    }
  }, [props.data]) // Add props.data dependency

  // Update active agents when data changes
  useEffect(() => {
    if (props.data?.nodes) {
      setStats((prev) => ({
        ...prev,
        activeAgents: props.data!.nodes.length,
      }))
    }
  }, [props.data])

  useEffect(() => {
    if (props.focusedNodeId && networkRef.current) {
      networkRef.current.focus(props.focusedNodeId, {
        scale: 1.5,
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad',
        },
      })

      if (!props.disableDetailsPanel) {
        const nodes = props.data?.nodes || new DataSet(initialNodes)
        const nodeData = (nodes instanceof DataSet
          ? nodes.get(props.focusedNodeId)
          : nodes.find((n: any) => n.id === props.focusedNodeId)) as unknown as NodeData
        if (nodeData) {
          setSelectedNode(nodeData)
        }
      }
    }
  }, [props.focusedNodeId])

  return (
    <div className='relative h-[75vh] w-full overflow-hidden rounded-xl border border-white/10 bg-[#030014] shadow-[0_0_50px_rgba(74,222,128,0.1)]'>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.05)_1px,transparent_1px)] bg-[size:50px_50px]' />
      <div className='pointer-events-none absolute inset-0 bg-radial-gradient from-green-500/5 via-transparent to-[#030014]' />
      <div ref={containerRef} className='absolute inset-0' />
      <div className='absolute top-6 left-6 z-10 flex gap-4'>
        {/* <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-4 min-w-[140px] shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-green-400" />
                        <div className="text-green-200/60 text-[10px] uppercase tracking-wider font-semibold">Network TPS</div>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono tracking-tight drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">{stats.tps.toLocaleString()}</div>
                </div> */}
        <div className='min-w-[140px] rounded-xl border border-green-500/20 bg-black/40 p-4 shadow-[0_0_15px_rgba(74,222,128,0.1)] backdrop-blur-xl'>
          <div className='mb-2 flex items-center gap-2'>
            <Bot size={14} className='text-green-400' />
            <div className='font-semibold text-[10px] text-green-200/60 uppercase tracking-wider'>
              Active Agents
            </div>
          </div>
          <div className='font-bold font-mono text-2xl text-white tracking-tight drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]'>
            {stats.activeAgents}
          </div>
        </div>
        {/* <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[140px] shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className="text-green-400" />
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Network Load</div>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono tracking-tight">{stats.load}%</div>
                </div> */}
      </div>
      <div className='absolute bottom-6 left-6 z-10 rounded-xl border border-white/10 bg-black/60 p-4 shadow-lg backdrop-blur-xl'>
        <h3 className='mb-3 font-bold text-[10px] text-white/60 uppercase tracking-wider'>
          Network Entities
        </h3>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-3'>
            <div className='h-3 w-3 rounded-full border-2 border-green-500 bg-black shadow-[0_0_10px_#4ade80]' />
            <span className='font-medium text-green-100 text-xs'>AI Agent</span>
          </div>
        </div>
      </div>
      <div
        className={`cubic-bezier(0.4, 0, 0.2, 1) absolute top-6 right-6 bottom-6 z-20 w-80 transform rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
          selectedNode ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
        }`}
      >
        {selectedNode && (
          <div className='flex h-full flex-col p-6'>
            <div className='mb-8 flex items-start justify-between'>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <img
                    src={selectedNode.image}
                    alt={selectedNode.label}
                    className='h-12 w-12 rounded-full border-2 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.5)]'
                  />
                  <div
                    className={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-black ${selectedNode.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                </div>
                <div>
                  <h2 className='font-bold text-white text-xl tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'>
                    {selectedNode.label}
                  </h2>
                  <span className='mt-1 inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 font-bold text-[10px] text-green-300 uppercase tracking-wider shadow-[0_0_10px_rgba(74,222,128,0.2)]'>
                    AI Agent
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className='rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white'
              >
                <X size={20} />
              </button>
            </div>

            <div className='custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2'>
              {/* Status Section */}
              <div className='rounded-xl border border-white/5 bg-white/5 p-4'>
                <div className='mb-3 flex items-center gap-3'>
                  <Activity size={16} className='text-white/60' />
                  <span className='font-bold text-white/60 text-xs uppercase tracking-wider'>
                    Status
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${selectedNode.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500'}`}
                    />
                    {selectedNode.status === 'active' && (
                      <div className='absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-green-500 opacity-75' />
                    )}
                  </div>
                  <span className='font-medium text-sm text-white capitalize'>
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              {/* Metrics Section */}
              <div className='space-y-4'>
                <h3 className='font-bold text-[10px] text-white/40 uppercase tracking-wider'>
                  Performance Metrics
                </h3>

                <div className='grid grid-cols-2 gap-3'>
                  {/* <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-white/40 mb-1">Uptime</div>
                                        <div className="text-sm text-white font-mono font-medium">99.9%</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-white/40 mb-1">Latency</div>
                                        <div className="text-sm text-white font-mono font-medium">{Math.floor(Math.random() * 50 + 10)}ms</div>
                                    </div> */}
                  <div className='col-span-2 rounded-lg border border-white/5 bg-white/5 p-3'>
                    <div className='mb-1 text-white/40 text-xs'>Transactions</div>
                    <div className='font-medium font-mono text-sm text-white'>
                      {selectedNode.transactions?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>
              <div className='space-y-4'>
                <h3 className='font-bold text-[10px] text-white/40 uppercase tracking-wider'>
                  Recent Activity
                </h3>
                <div className='relative space-y-0'>
                  <div className='absolute top-2 bottom-2 left-1.5 w-px bg-white/10' />

                  {selectedNode.recentActivity && selectedNode.recentActivity.length > 0 ? (
                    selectedNode.recentActivity.map((activity, i) => (
                      <div key={i} className='group relative py-2 pl-6'>
                        <div className='absolute top-3 left-0 z-10 h-3 w-3 rounded-full border border-white/20 bg-[#0a0a0a] transition-colors group-hover:border-white/40' />
                        <div className='flex flex-col gap-0.5'>
                          <span className='font-mono text-[10px] text-white/40'>
                            {activity.time}
                          </span>
                          <span className='text-gray-300 text-xs'>{activity.details}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='py-2 pl-6 text-white/40 text-xs'>No recent activity</div>
                  )}
                </div>
              </div>
            </div>

            <div className='mt-6 border-white/10 border-t pt-6'>
              <Link href={`/agent/${selectedNode.id}`} className='block w-full'>
                <button className='w-full rounded-xl bg-white py-3 font-bold text-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors hover:bg-gray-200'>
                  View Full Details
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkGraph
