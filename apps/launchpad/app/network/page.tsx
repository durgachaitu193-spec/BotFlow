'use client'

import { useEffect, useState } from 'react'
import { DataSet } from 'vis-data'
import DashboardLayout from '@/components/DashboardLayout'
import NetworkGraph from '@/components/NetworkGraph'
import { getAgents } from '@/actions/getAgents'

export default function NetworkPage() {
  const [networkData, setNetworkData] = useState<{
    nodes: any
    edges: any
  } | null>(null)

  useEffect(() => {
    const fetchAndGenerateData = async () => {
      try {
        const agents = await getAgents()

        const nodes: any[] = []
        const edges: any[] = []

        agents.forEach((agent) => {
          nodes.push({
            id: agent.id,
            label: agent.name,
            group: 'agent',
            status: 'active',
            value: 30,
            shape: 'circularImage',
            image: agent.image,
            description:
              agent.description ||
              'An AI brand ambassador and campaign orchestrator for crypto token projects.',
            transactions: agent.transactions,
            recentActivity: agent.recentActivity,
            fdv: agent.fdv,
            change: agent.change,
            color: {
              border: '#4ade80',
              background: '#000000',
              highlight: { border: '#ffffff', background: '#000000' },
            },
            borderWidth: 2,
            borderWidthSelected: 4,
            font: {
              size: 12,
              color: '#ffffff',
              face: 'Inter',
              strokeWidth: 3,
              strokeColor: '#000000',
              vadjust: 5,
            },
            shadow: {
              enabled: true,
              color: '#4ade80', // Green glow
              size: 15,
              x: 0,
              y: 0,
            },
          })
        })

        // Generate edges
        const agentCount = agents.length
        for (let i = 0; i < agentCount; i++) {
          const currentAgentId = agents[i].id
          const connectionCount = Math.floor(Math.random() * 4) + 2

          for (let j = 0; j < connectionCount; j++) {
            const randomAgentIndex = Math.floor(Math.random() * agentCount)
            const otherAgentId = agents[randomAgentIndex].id

            if (otherAgentId !== currentAgentId) {
              const existingEdge = edges.find(
                (e) =>
                  (e.from === currentAgentId && e.to === otherAgentId) ||
                  (e.from === otherAgentId && e.to === currentAgentId)
              )

              if (!existingEdge) {
                edges.push({
                  from: currentAgentId,
                  to: otherAgentId,
                  width: 1,
                  color: {
                    color: '#4ade80',
                    opacity: 0.2,
                  },
                  shadow: {
                    enabled: true,
                    color: '#4ade80',
                    size: 2,
                    x: 0,
                    y: 0,
                  },
                })
              }
            }
          }
        }

        setNetworkData({
          nodes: new DataSet(nodes),
          edges: new DataSet(edges),
        })
      } catch (error) {
        console.error('Failed to fetch agents for network', error)
      }
    }

    fetchAndGenerateData()
  }, [])

  return (
    <DashboardLayout>
      <div className='mx-auto w-full max-w-[1400px] p-6'>
        <div className='mb-8'>
          <h1 className='mb-2 font-bold text-2xl text-white'>Network View</h1>
          <p className='text-gray-400'>
            Visualize the relationships between agents, users, and the protocol.
          </p>
        </div>
        <div className='mx-auto w-full max-w-[1400px] flex-1 p-6'>
          {networkData ? (
            <div className='h-[75vh] w-full'>
              <NetworkGraph data={networkData} />
            </div>
          ) : (
            <div className='flex h-[75vh] w-full items-center justify-center text-white text-xl'>
              Loading network...
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
