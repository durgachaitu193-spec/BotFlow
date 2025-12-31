import DashboardLayout from '@/components/DashboardLayout'
import { getAgentById } from '@/actions/getAgents'
import AgentDetailClient from './AgentDetailClient'

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = await getAgentById(id)

  if (!agent) {
    return (
      <DashboardLayout>
        <div className='flex h-[50vh] items-center justify-center text-text-secondary'>
          Agent not found
        </div>
      </DashboardLayout>
    )
  }

  return <AgentDetailClient agent={agent} />
}
