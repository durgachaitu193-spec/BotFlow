import { useCallback, useState } from 'react'
import { usePrivy, useWallets } from '@botflow/ui'
import { createLogger } from '@botflow/logger'
import { type AgentMetadata, buildAgentMetadata } from '@/lib/contracts/agentMetadata'
import {
  registerAgent,
  updateAgentMetadata,
  updateDeploymentState,
} from '@/lib/contracts/agentRegistry'
import { getEnv } from '@/lib/core/config/env'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

const logger = createLogger('useDeployment')

interface UseDeploymentProps {
  workflowId: string | null
  isDeployed: boolean
  refetchDeployedState: () => Promise<void>
}

/**
 * Hook to manage deployment operations (deploy, undeploy, redeploy)
 */
export function useDeployment({
  workflowId,
  isDeployed,
  refetchDeployedState,
}: UseDeploymentProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const setDeploymentStatus = useWorkflowRegistry((state) => state.setDeploymentStatus)
  const { wallets, ready: walletsReady } = useWallets()
  const { user } = usePrivy()
  const workflowMetadata = useWorkflowRegistry((state) =>
    workflowId ? state.workflows[workflowId] : undefined
  )

  /**
   * Handle initial deployment and open modal
   */
  const handleDeployClick = useCallback(async () => {
    if (!workflowId) return { success: false, shouldOpenModal: false }

    // If undeployed, deploy first then open modal
    if (!isDeployed) {
      setIsDeploying(true)
      try {
        const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deployChatEnabled: false,
          }),
        })

        if (response.ok) {
          const responseData = await response.json()
          const isDeployedStatus = responseData.isDeployed ?? false
          const deployedAtTime = responseData.deployedAt
            ? new Date(responseData.deployedAt)
            : undefined
          setDeploymentStatus(
            workflowId,
            isDeployedStatus,
            deployedAtTime,
            responseData.apiKey || ''
          )
          await refetchDeployedState()

          // Register or update agent on-chain after successful deployment
          // This ensures agents are registered by default when API is deployed
          try {
            await registerOrUpdateAgentAfterDeployment(workflowId)
          } catch (agentError: any) {
            // Log error but don't block deployment - agent registration is non-critical
            logger.error('Error registering agent after deployment:', agentError)
          }

          return { success: true, shouldOpenModal: true }
        }
        return { success: false, shouldOpenModal: true }
      } catch (error) {
        logger.error('Error deploying workflow:', error)
        return { success: false, shouldOpenModal: true }
      } finally {
        setIsDeploying(false)
      }
    }

    // If already deployed, just signal to open modal
    return { success: true, shouldOpenModal: true }
  }, [workflowId, isDeployed, refetchDeployedState, setDeploymentStatus, wallets, walletsReady, user, workflowMetadata])

  /**
   * Register or update agent on-chain after successful API deployment
   */
  const registerOrUpdateAgentAfterDeployment = useCallback(
    async (workflowId: string) => {
      if (!workflowId) {
        logger.warn('Cannot register agent: missing workflowId')
        return null
      }

      // Get wallet address
      let walletAddress: string | undefined = undefined
      if (wallets && wallets.length > 0 && wallets[0]?.address) {
        walletAddress = wallets[0].address
      }
      if (!walletAddress && user?.wallet?.address) {
        walletAddress =
          typeof user.wallet.address === 'string'
            ? user.wallet.address
            : (user.wallet.address as any)?.address
      }

      if (!walletAddress) {
        logger.warn('Cannot register agent: no wallet address - wallet may not be connected')
        return null
      }

      // Get provider
      let provider: any = null
      let walletToUse = wallets?.[0]

      if (!walletToUse && walletAddress && walletsReady) {
        // Wait for wallets to populate
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          if (wallets && wallets.length > 0) {
            walletToUse = wallets[0]
            break
          }
        }
      }

      try {
        if (walletToUse) {
          provider = await walletToUse.getEthereumProvider()
        }
      } catch (error) {
        logger.error('Error getting wallet provider:', error)
        return null
      }

      if (!provider) {
        logger.warn('Cannot register agent: no wallet provider - wallet may not be connected')
        return null
      }

      try {
        // Check if agent already exists
        const existingAgentResponse = await fetch(`/api/agents?workflowId=${workflowId}`)
        let existingAgent: any = null

        if (existingAgentResponse.ok) {
          const agentsData = await existingAgentResponse.json()
          if (agentsData.agents && agentsData.agents.length > 0) {
            existingAgent = agentsData.agents[0]
          }
        }

        // Get workflow state for deployment state
        const workflowState = useWorkflowStore.getState().getWorkflowState()
        const deploymentStateJson = JSON.stringify({
          blocks: workflowState.blocks,
          edges: workflowState.edges,
          loops: workflowState.loops,
          parallels: workflowState.parallels,
        })

        const apiEndpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`

        if (existingAgent) {
          // Update existing agent
          logger.info('Updating existing agent deployment state', {
            agentId: existingAgent.agentId,
          })

          await updateDeploymentState(
            walletAddress,
            existingAgent.agentId,
            deploymentStateJson,
            provider
          )

          const metadata: AgentMetadata = {
            ...existingAgent.metadata,
            apiEndpoint,
          }

          if (existingAgent.metadata.apiEndpoint !== apiEndpoint) {
            await updateAgentMetadata(
              walletAddress,
              existingAgent.agentId,
              buildAgentMetadata(metadata),
              provider
            )
          }

          // Update in database
          await fetch(`/api/agents?agentId=${existingAgent.agentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata }),
          })

          return {
            agentId: existingAgent.agentId,
            agentDID: existingAgent.agentDID,
            transactionHash: existingAgent.transactionHash,
            metadata,
          }
        } else {
          // Register new agent
          logger.info('Registering new agent on-chain', { workflowId, apiEndpoint })

          const metadata: AgentMetadata = {
            workflowId,
            workflowName: workflowMetadata?.name,
            deployedAt: new Date().toISOString(),
            apiEndpoint,
          }

          const registerResult = await registerAgent(
            walletAddress,
            buildAgentMetadata(metadata),
            provider,
            undefined,
            '',
            '',
            '',
            deploymentStateJson
          )

          if (!registerResult) {
            throw new Error('Agent registration failed: no result returned from contract')
          }

          // Get user DID
          let userDID: string | undefined
          try {
            const profileResponse = await fetch('/api/users/me/profile')
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              userDID = profileData.user?.userDID
            }
          } catch (error) {
            logger.warn('Could not fetch user DID', error)
          }

          // Store in database
          await fetch('/api/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowId,
              agentId: registerResult.agentId.toString(),
              agentWallet: registerResult.agentWallet,
              agentDID: registerResult.agentDID,
              ownerWallet: walletAddress,
              userDID,
              metadata,
              transactionHash: registerResult.txHash,
            }),
          })

          logger.info('Agent registered and stored successfully', {
            agentId: registerResult.agentId.toString(),
          })

          return {
            agentId: registerResult.agentId.toString(),
            agentDID: registerResult.agentDID,
            transactionHash: registerResult.txHash,
            metadata,
          }
        }
      } catch (error: any) {
        logger.error('Error in agent registration/update:', error)
        throw error
      }
    },
    [wallets, walletsReady, user, workflowMetadata]
  )

  return {
    isDeploying,
    handleDeployClick,
  }
}
