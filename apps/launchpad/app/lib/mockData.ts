import { agents } from '@/lib/agentsData'

export interface NodeData {
  id: string | number
  label: string
  group: 'agent'
  status: 'active' | 'inactive' | 'busy'
  value?: number // for size
  image?: string
  description?: string
  transactions?: number
  recentActivity?: {
    type: string
    time: string
    details: string
  }[]
  fdv?: string
  change?: string
}

export const generateNetworkData = (agentsList?: any[]) => {
  const nodes: any[] = []
  const edges: any[] = []

  const dataToUse = agentsList || agents

  // Use the centralized agents data
  dataToUse.forEach((agent) => {
    nodes.push({
      id: agent.id,
      label: agent.name,
      group: 'agent',
      status: agent.status || (Math.random() > 0.2 ? 'active' : 'busy'),
      value: 30,
      shape: 'circularImage',
      image: agent.image,
      description:
        agent.description ||
        'An AI brand ambassador and campaign orchestrator for crypto token projects.',
      transactions: agent.transactions,
      recentActivity: agent.recentActivity || [],
      fdv: agent.fdv || `$${(Math.random() * 20 + 5).toFixed(1)}M`,
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

  // Dense Mesh Connections (Agent-to-Agent)
  // Connect each agent to 2-5 other random agents
  const agentCount = dataToUse.length

  for (let i = 0; i < agentCount; i++) {
    const currentAgentId = dataToUse[i].id
    const connectionCount = Math.floor(Math.random() * 4) + 2

    for (let j = 0; j < connectionCount; j++) {
      const randomAgentIndex = Math.floor(Math.random() * agentCount)
      const otherAgentId = dataToUse[randomAgentIndex].id

      if (otherAgentId !== currentAgentId) {
        // Avoid duplicate edges
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
              color: '#4ade80', // Green lines
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

  return { nodes, edges }
}
