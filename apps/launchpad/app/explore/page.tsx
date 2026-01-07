import { getAgents } from '@/actions/getAgents'
import ExploreClient from './ExploreClient'

export default async function ExplorePage() {
  const agents = await getAgents()

  return <ExploreClient initialAgents={agents} />
}
