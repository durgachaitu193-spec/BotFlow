import { createLogger } from '@sim/logger'
import type { WorkflowState } from '@/stores/workflows/workflow/types'
import { updateDeploymentState } from './agentRegistry'

const logger = createLogger('DeploymentStateUtils')

/**
 * Update deployment state on-chain for an agent associated with a workflow
 * This should be called after workflow state is saved to keep on-chain state in sync
 *
 * @param workflowId - The workflow ID
 * @param workflowState - The current workflow state
 * @param agentId - The agent ID (on-chain agent ID)
 * @param walletAddress - The user's wallet address
 * @param provider - Ethereum provider (from Privy wallet)
 * @returns True if update was successful or skipped, false if failed
 */
export async function updateWorkflowDeploymentStateOnChain(
  workflowId: string,
  workflowState: WorkflowState,
  agentId: string,
  walletAddress: string,
  provider: any
): Promise<boolean> {
  try {
    if (!agentId || !walletAddress || !provider) {
      logger.debug('Skipping on-chain deployment state update - missing required parameters', {
        workflowId,
        hasAgentId: !!agentId,
        hasWallet: !!walletAddress,
        hasProvider: !!provider,
      })
      return true // Not an error, just skipped
    }

    // Serialize workflow state to JSON (same format as stored in database)
    const deploymentStateJson = JSON.stringify({
      blocks: workflowState.blocks,
      edges: workflowState.edges,
      loops: workflowState.loops,
      parallels: workflowState.parallels,
    })

    logger.info('Updating deployment state on-chain', {
      workflowId,
      agentId,
      deploymentStateSize: deploymentStateJson.length,
    })

    const result = await updateDeploymentState(
      walletAddress,
      agentId,
      deploymentStateJson,
      provider
    )

    if (result) {
      logger.info('Successfully updated deployment state on-chain', {
        workflowId,
        agentId,
        txHash: result.txHash,
      })
      return true
    }

    logger.warn('Failed to update deployment state on-chain - no result returned', {
      workflowId,
      agentId,
    })
    return false
  } catch (error) {
    logger.error('Error updating deployment state on-chain', {
      workflowId,
      agentId,
      error,
    })
    // Don't throw - this is a non-critical operation
    return false
  }
}

/**
 * Helper to get agent ID for a workflow from the database
 * This can be used to check if a workflow has an associated agent before updating on-chain
 *
 * @param workflowId - The workflow ID
 * @returns The agent ID if found, null otherwise
 */
export async function getAgentIdForWorkflow(workflowId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/agents?workflowId=${workflowId}`)
    if (!response.ok) {
      logger.debug('Failed to fetch agent for workflow', { workflowId })
      return null
    }

    const data = await response.json()
    if (data.agents && data.agents.length > 0) {
      return data.agents[0].agentId
    }

    return null
  } catch (error) {
    logger.error('Error fetching agent for workflow', { workflowId, error })
    return null
  }
}
