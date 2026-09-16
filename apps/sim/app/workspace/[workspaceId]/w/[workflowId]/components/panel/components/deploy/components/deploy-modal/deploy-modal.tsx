'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@botflow/ui'
import { createLogger } from '@botflow/logger'
import clsx from 'clsx'
import { Button } from '@/components/emcn'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTabs,
  ModalTabsContent,
  ModalTabsList,
  ModalTabsTrigger,
} from '@/components/emcn/components/modal/modal'
import { type AgentMetadata, buildAgentMetadata } from '@/lib/contracts/agentMetadata'
import {
  registerAgent,
  updateAgentMetadata,
  updateDeploymentState,
} from '@/lib/contracts/agentRegistry'
import { getEnv } from '@/lib/core/config/env'
import { getInputFormatExample as getInputFormatExampleUtil } from '@/lib/workflows/operations/deployment-utils'
import type { WorkflowDeploymentVersionResponse } from '@/lib/workflows/persistence/utils'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import type { WorkflowState } from '@/stores/workflows/workflow/types'
import { AgentInfo } from './components/agent-info'
import { ApiDeploy } from './components/api/api'
import { ChatDeploy, type ExistingChat } from './components/chat/chat'
import { GeneralDeploy } from './components/general/general'
import { TemplateDeploy } from './components/template/template'
import { TokenDeploy } from './components/token/token'

const logger = createLogger('DeployModal')

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string | null
  isDeployed: boolean
  needsRedeployment: boolean
  setNeedsRedeployment: (value: boolean) => void
  deployedState: WorkflowState
  isLoadingDeployedState: boolean
  refetchDeployedState: () => Promise<void>
}

interface WorkflowDeploymentInfo {
  isDeployed: boolean
  deployedAt?: string
  apiKey: string
  endpoint: string
  exampleCommand: string
  needsRedeployment: boolean
}

type TabView = 'general' | 'api' | 'chat' | 'template' | 'agent' | 'token'

export function DeployModal({
  open,
  onOpenChange,
  workflowId,
  isDeployed: isDeployedProp,
  needsRedeployment,
  setNeedsRedeployment,
  deployedState,
  isLoadingDeployedState,
  refetchDeployedState,
}: DeployModalProps) {
  const deploymentStatus = useWorkflowRegistry((state) =>
    state.getWorkflowDeploymentStatus(workflowId)
  )
  const isDeployed = deploymentStatus?.isDeployed ?? isDeployedProp
  const setDeploymentStatus = useWorkflowRegistry((state) => state.setDeploymentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingAgentOnChain, setIsUpdatingAgentOnChain] = useState(false)
  // const [isUndeploying, setIsUndeploying] = useState(false)
  const [deploymentInfo, setDeploymentInfo] = useState<WorkflowDeploymentInfo | null>(null)
  const [agentRegistrationError, setAgentRegistrationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const workflowMetadata = useWorkflowRegistry((state) =>
    workflowId ? state.workflows[workflowId] : undefined
  )
  const workflowWorkspaceId = workflowMetadata?.workspaceId ?? null
  const [activeTab, setActiveTab] = useState<TabView>('general')
  const [chatSubmitting, setChatSubmitting] = useState(false)
  const [apiDeployError, setApiDeployError] = useState<string | null>(null)
  const [chatExists, setChatExists] = useState(false)
  const [isChatFormValid, setIsChatFormValid] = useState(false)
  const [selectedStreamingOutputs, setSelectedStreamingOutputs] = useState<string[]>([])

  const [versions, setVersions] = useState<WorkflowDeploymentVersionResponse[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  // const [showUndeployConfirm, setShowUndeployConfirm] = useState(false)
  const [templateFormValid, setTemplateFormValid] = useState(false)
  const [templateSubmitting, setTemplateSubmitting] = useState(false)
  const [hasExistingTemplate, setHasExistingTemplate] = useState(false)
  const [templateStatus, setTemplateStatus] = useState<{
    status: 'pending' | 'approved' | 'rejected' | null
    views?: number
    stars?: number
  } | null>(null)
  const [tokenSubmitting, setTokenSubmitting] = useState(false)

  const [existingChat, setExistingChat] = useState<ExistingChat | null>(null)
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  // Agent registration state
  const { user, authenticated } = usePrivy()
  const { wallets, ready: walletsReady } = useWallets()
  const [isRegisteringAgent, setIsRegisteringAgent] = useState(false)
  const [agentData, setAgentData] = useState<{
    agentId: string
    agentDID: string
    transactionHash: string
    metadata: AgentMetadata
  } | null>(null)
  const [pendingTokenImage, setPendingTokenImage] = useState<File | null>(null)

  const getApiKeyLabel = (value?: string | null) => {
    if (value && value.trim().length > 0) {
      return value
    }
    return workflowWorkspaceId ? 'Workspace API keys' : 'Personal API keys'
  }

  const getApiHeaderPlaceholder = () =>
    workflowWorkspaceId ? 'YOUR_WORKSPACE_API_KEY' : 'YOUR_PERSONAL_API_KEY'

  const getInputFormatExample = (includeStreaming = false) => {
    return getInputFormatExampleUtil(includeStreaming, selectedStreamingOutputs)
  }

  const fetchChatDeploymentInfo = useCallback(async () => {
    if (!workflowId) return

    try {
      setIsLoadingChat(true)
      const response = await fetch(`/api/workflows/${workflowId}/chat/status`)

      if (response.ok) {
        const data = await response.json()
        if (data.isDeployed && data.deployment) {
          const detailResponse = await fetch(`/api/chat/manage/${data.deployment.id}`)
          if (detailResponse.ok) {
            const chatDetail = await detailResponse.json()
            setExistingChat(chatDetail)
            setChatExists(true)
          } else {
            setExistingChat(null)
            setChatExists(false)
          }
        } else {
          setExistingChat(null)
          setChatExists(false)
        }
      } else {
        setExistingChat(null)
        setChatExists(false)
      }
    } catch (error) {
      logger.error('Error fetching chat deployment info:', { error })
      setExistingChat(null)
      setChatExists(false)
    } finally {
      setIsLoadingChat(false)
    }
  }, [workflowId])

  const fetchExistingAgent = useCallback(async () => {
    if (!workflowId) return

    try {
      const response = await fetch(`/api/agents?workflowId=${workflowId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.agents && data.agents.length > 0) {
          const agent = data.agents[0]
          setAgentData({
            agentId: agent.agentId,
            agentDID: agent.agentDID,
            transactionHash: agent.transactionHash,
            metadata: agent.metadata,
          })
          logger.info('Loaded existing agent data', { agentId: agent.agentId })
        } else {
          setAgentData(null)
        }
      }
    } catch (error) {
      logger.error('Error fetching existing agent:', error)
      setAgentData(null)
    }
  }, [workflowId])

  const fetchVersions = useCallback(async () => {
    if (!workflowId) return
    try {
      const res = await fetch(`/api/workflows/${workflowId}/deployments`)
      if (res.ok) {
        const data = await res.json()
        setVersions(Array.isArray(data.versions) ? data.versions : [])
      } else {
        setVersions([])
      }
    } catch {
      setVersions([])
    }
  }, [workflowId])

  useEffect(() => {
    if (open && workflowId) {
      setActiveTab('general')
      fetchChatDeploymentInfo()
      fetchVersions()
      fetchExistingAgent()
    }
  }, [open, workflowId, fetchChatDeploymentInfo, fetchVersions, fetchExistingAgent])

  useEffect(() => {
    async function fetchDeploymentInfo() {
      if (!open || !workflowId || !isDeployed) {
        setDeploymentInfo(null)
        setIsLoading(false)
        return
      }

      if (deploymentInfo?.isDeployed && !needsRedeployment) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const response = await fetch(`/api/workflows/${workflowId}/deploy`)

        if (!response.ok) {
          throw new Error('Failed to fetch deployment information')
        }

        const data = await response.json()
        const endpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
        const inputFormatExample = getInputFormatExample(selectedStreamingOutputs.length > 0)
        const placeholderKey = workflowWorkspaceId ? 'YOUR_WORKSPACE_API_KEY' : 'YOUR_API_KEY'

        setDeploymentInfo({
          isDeployed: data.isDeployed,
          deployedAt: data.deployedAt,
          apiKey: data.apiKey || placeholderKey,
          endpoint,
          exampleCommand: `curl -X POST -H "X-API-Key: ${placeholderKey}" -H "Content-Type: application/json"${inputFormatExample} ${endpoint}`,
          needsRedeployment,
        })
      } catch (error) {
        logger.error('Error fetching deployment info:', { error })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeploymentInfo()
  }, [open, workflowId, isDeployed, needsRedeployment, deploymentInfo?.isDeployed])

  const onDeploy = async () => {
    setApiDeployError(null)
    setAgentRegistrationError(null)

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployChatEnabled: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deploy workflow')
      }

      const responseData = await response.json()

      const isDeployedStatus = responseData.isDeployed ?? false
      const deployedAtTime = responseData.deployedAt ? new Date(responseData.deployedAt) : undefined
      const apiKeyLabel = getApiKeyLabel(responseData.apiKey)

      setDeploymentStatus(workflowId, isDeployedStatus, deployedAtTime, apiKeyLabel)

      setNeedsRedeployment(false)
      if (workflowId) {
        useWorkflowRegistry.getState().setWorkflowNeedsRedeployment(workflowId, false)
      }

      await refetchDeployedState()
      await fetchVersions()

      // Get deployment info for agent registration
      let currentApiEndpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
      const deploymentInfoResponse = await fetch(`/api/workflows/${workflowId}/deploy`)
      if (deploymentInfoResponse.ok) {
        const deploymentData = await deploymentInfoResponse.json()
        const apiEndpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
        const inputFormatExample = getInputFormatExample(selectedStreamingOutputs.length > 0)
        const placeholderKey = getApiHeaderPlaceholder()

        currentApiEndpoint = apiEndpoint

        setDeploymentInfo({
          isDeployed: deploymentData.isDeployed,
          deployedAt: deploymentData.deployedAt,
          apiKey: getApiKeyLabel(deploymentData.apiKey),
          endpoint: apiEndpoint,
          exampleCommand: `curl -X POST -H "X-API-Key: ${placeholderKey}" -H "Content-Type: application/json"${inputFormatExample} ${apiEndpoint}`,
          needsRedeployment: false,
        })
      }

      setApiDeployError(null)

      // Register or update agent on-chain after successful deployment
      // This ensures agents are registered by default, not just when chat is launched
      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100))

      try {
        setIsRegisteringAgent(true)
        logger.info('Starting agent registration after API deployment', { workflowId })

        // Force a small delay to ensure wallets are ready
        if (!walletsReady) {
          for (let i = 0; i < 10; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            if (walletsReady && wallets && wallets.length > 0) {
              break
            }
          }
        }

        const agentResult = await registerOrUpdateAgentForDeployment()

        if (agentResult) {
          logger.info('Agent registered/updated successfully after deployment', {
            agentId: agentResult.agentId,
          })
          // Refresh agent data to show in UI
          await fetchExistingAgent()
          setAgentRegistrationError(null)
        } else {
          const errorMsg = 'Agent registration skipped: Wallet not connected or provider unavailable. Please ensure your wallet is connected to register the agent on-chain.'
          logger.warn('Agent registration returned no result - wallet may not be connected or agent already exists')
          setAgentRegistrationError(errorMsg)
        }
      } catch (agentError: any) {
        logger.error('Error registering/updating agent after deployment:', agentError)
        setAgentRegistrationError(`Agent registration failed: ${agentError.message || 'Unknown error'}`)
        // Log the error but don't block deployment
        // User can manually register agent later if needed
      } finally {
        setIsRegisteringAgent(false)
      }
    } catch (error: unknown) {
      logger.error('Error deploying workflow:', { error })
      const errorMessage = error instanceof Error ? error.message : 'Failed to deploy workflow'
      setApiDeployError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (open && workflowId) {
      setVersionsLoading(true)
      fetchVersions().finally(() => setVersionsLoading(false))
    }
  }, [open, workflowId, fetchVersions])

  useEffect(() => {
    if (!open || selectedStreamingOutputs.length === 0) return

    const blocks = Object.values(useWorkflowStore.getState().blocks)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

    const validOutputs = selectedStreamingOutputs.filter((outputId) => {
      if (UUID_REGEX.test(outputId)) {
        const underscoreIndex = outputId.indexOf('_')
        if (underscoreIndex === -1) return false

        const blockId = outputId.substring(0, underscoreIndex)
        const block = blocks.find((b) => b.id === blockId)
        return !!block
      }

      const parts = outputId.split('.')
      if (parts.length >= 2) {
        const blockName = parts[0]
        const block = blocks.find(
          (b) => b.name?.toLowerCase().replace(/\s+/g, '') === blockName.toLowerCase()
        )
        return !!block
      }

      return true
    })

    if (validOutputs.length !== selectedStreamingOutputs.length) {
      setSelectedStreamingOutputs(validOutputs)
    }
  }, [open, selectedStreamingOutputs, setSelectedStreamingOutputs])

  useEffect(() => {
    const handleOpenDeployModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: TabView }>
      onOpenChange(true)
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab)
      }
    }

    window.addEventListener('open-deploy-modal', handleOpenDeployModal)

    return () => {
      window.removeEventListener('open-deploy-modal', handleOpenDeployModal)
    }
  }, [onOpenChange])

  const handlePromoteToLive = useCallback(
    async (version: number) => {
      if (!workflowId) return

      // Optimistically update versions to show the new active version immediately
      const previousVersions = [...versions]
      setVersions((prev) =>
        prev.map((v) => ({
          ...v,
          isActive: v.version === version,
        }))
      )

      try {
        const response = await fetch(
          `/api/workflows/${workflowId}/deployments/${version}/activate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to promote version')
        }

        const responseData = await response.json()

        const deployedAtTime = responseData.deployedAt
          ? new Date(responseData.deployedAt)
          : undefined
        const apiKeyLabel = getApiKeyLabel(responseData.apiKey)

        setDeploymentStatus(workflowId, true, deployedAtTime, apiKeyLabel)

        // Refresh deployed state in background (no loading flash)
        refetchDeployedState()
        fetchVersions()

        const deploymentInfoResponse = await fetch(`/api/workflows/${workflowId}/deploy`)
        if (deploymentInfoResponse.ok) {
          const deploymentData = await deploymentInfoResponse.json()
          const apiEndpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
          const inputFormatExample = getInputFormatExample(selectedStreamingOutputs.length > 0)
          const placeholderKey = getApiHeaderPlaceholder()

          setDeploymentInfo({
            isDeployed: deploymentData.isDeployed,
            deployedAt: deploymentData.deployedAt,
            apiKey: getApiKeyLabel(deploymentData.apiKey),
            endpoint: apiEndpoint,
            exampleCommand: `curl -X POST -H "X-API-Key: ${placeholderKey}" -H "Content-Type: application/json"${inputFormatExample} ${apiEndpoint}`,
            needsRedeployment: false,
          })
        }

        // Update deployment state on-chain ONLY after successful promotion
        // Only proceed if deployment was successful
        if (responseData.isDeployed !== false) {
          setIsUpdatingAgentOnChain(true)
          try {
            // Check if agent exists for this workflow
            const agentResponse = await fetch(`/api/agents?workflowId=${workflowId}`)
            if (agentResponse.ok) {
              const agentsData = await agentResponse.json()
              if (agentsData.agents && agentsData.agents.length > 0) {
                const existingAgent = agentsData.agents[0]
                const walletAddress = wallets?.[0]?.address

                if (walletAddress && existingAgent.agentId) {
                  let provider: any = null
                  try {
                    if (wallets && wallets.length > 0) {
                      provider = await wallets[0].getEthereumProvider()
                    }
                  } catch (error) {
                    logger.error('Error getting wallet provider:', error)
                    return // Exit early if we can't get provider
                  }

                  if (provider) {
                    // Get current workflow state
                    const workflowState = useWorkflowStore.getState().getWorkflowState()
                    const deploymentStateJson = JSON.stringify({
                      blocks: workflowState.blocks,
                      edges: workflowState.edges,
                      loops: workflowState.loops,
                      parallels: workflowState.parallels,
                    })

                    try {
                      const deploymentUpdateResult = await updateDeploymentState(
                        walletAddress,
                        existingAgent.agentId,
                        deploymentStateJson,
                        provider
                      )

                      if (deploymentUpdateResult) {
                        logger.info('Deployment state updated on-chain after promote to live', {
                          txHash: deploymentUpdateResult.txHash,
                          agentId: existingAgent.agentId,
                          version,
                        })
                      } else {
                        logger.warn('Deployment state update returned no result')
                      }
                    } catch (onChainUpdateError) {
                      logger.error(
                        'Error updating deployment state on-chain after promote to live:',
                        onChainUpdateError
                      )
                      // Don't throw - workflow promotion succeeded, on-chain update is non-critical
                    }
                  } else {
                    logger.warn('No provider available for on-chain deployment state update')
                  }
                } else {
                  logger.debug(
                    'No wallet address or agent ID, skipping on-chain deployment state update'
                  )
                }
              }
            }
          } catch (onChainError) {
            logger.error(
              'Error checking for agent or updating deployment state on-chain:',
              onChainError
            )
            // Don't throw - workflow promotion succeeded, on-chain update is non-critical
          } finally {
            setIsUpdatingAgentOnChain(false)
          }
        } else {
          logger.warn('Deployment not successful, skipping on-chain deployment state update')
        }
      } catch (error) {
        // Rollback optimistic update on error
        setVersions(previousVersions)
        throw error
      }
    },
    [workflowId, versions, refetchDeployedState, fetchVersions, selectedStreamingOutputs, wallets]
  )

  /* const handleUndeploy = async () => {
    try {
      setIsUndeploying(true)

      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to undeploy workflow')
      }

      setDeploymentStatus(workflowId, false)
      setChatExists(false)
      setShowUndeployConfirm(false)
      onOpenChange(false)
    } catch (error: unknown) {
      logger.error('Error undeploying workflow:', { error })
    } finally {
      setIsUndeploying(false)
    }
  } */

  const handleRedeploy = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/workflows/${workflowId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployChatEnabled: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to redeploy workflow')
      }

      const { isDeployed: newDeployStatus, deployedAt, apiKey } = await response.json()

      // Only proceed if deployment was successful
      if (!newDeployStatus) {
        throw new Error('Deployment was not successful')
      }

      // We know we will attempt an on-chain update for the agent after this point,
      // so flip the on-chain loading state *before* we clear the needsRedeployment flag
      // to avoid a visual gap where the button briefly shows "Up to date".
      setIsUpdatingAgentOnChain(true)

      setDeploymentStatus(
        workflowId,
        newDeployStatus,
        deployedAt ? new Date(deployedAt) : undefined,
        getApiKeyLabel(apiKey)
      )

      setNeedsRedeployment(false)
      if (workflowId) {
        useWorkflowRegistry.getState().setWorkflowNeedsRedeployment(workflowId, false)
      }

      await refetchDeployedState()
      await fetchVersions()

      setDeploymentInfo((prev) => (prev ? { ...prev, needsRedeployment: false } : prev))

      // Update deployment state on-chain ONLY after successful deployment
      if (workflowId && newDeployStatus) {
        try {
          // Check if agent exists for this workflow
          const agentResponse = await fetch(`/api/agents?workflowId=${workflowId}`)
          if (agentResponse.ok) {
            const agentsData = await agentResponse.json()
            if (agentsData.agents && agentsData.agents.length > 0) {
              const existingAgent = agentsData.agents[0]
              const walletAddress = wallets?.[0]?.address

              if (walletAddress && existingAgent.agentId) {
                let provider: any = null
                try {
                  if (wallets && wallets.length > 0) {
                    provider = await wallets[0].getEthereumProvider()
                  }
                } catch (error) {
                  logger.error('Error getting wallet provider:', error)
                  return // Exit early if we can't get provider
                }

                if (provider) {
                  // Get current workflow state
                  const workflowState = useWorkflowStore.getState().getWorkflowState()
                  const deploymentStateJson = JSON.stringify({
                    blocks: workflowState.blocks,
                    edges: workflowState.edges,
                    loops: workflowState.loops,
                    parallels: workflowState.parallels,
                  })

                  try {
                    const deploymentUpdateResult = await updateDeploymentState(
                      walletAddress,
                      existingAgent.agentId,
                      deploymentStateJson,
                      provider
                    )

                    if (deploymentUpdateResult) {
                      logger.info('Deployment state updated on-chain after redeploy', {
                        txHash: deploymentUpdateResult.txHash,
                        agentId: existingAgent.agentId,
                      })
                    } else {
                      logger.warn('Deployment state update returned no result')
                    }
                  } catch (onChainUpdateError) {
                    logger.error(
                      'Error updating deployment state on-chain after redeploy:',
                      onChainUpdateError
                    )
                    // Don't throw - workflow deployment succeeded, on-chain update is non-critical
                  }
                } else {
                  logger.warn('No provider available for on-chain deployment state update')
                }
              } else {
                logger.debug(
                  'No wallet address or agent ID, skipping on-chain deployment state update'
                )
              }
            }
          }
        } catch (onChainError) {
          logger.error(
            'Error checking for agent or updating deployment state on-chain:',
            onChainError
          )
          // Don't throw - workflow deployment succeeded, on-chain update is non-critical
        } finally {
          setIsUpdatingAgentOnChain(false)
        }
      } else {
        // If no existing agent, register one now
        try {
          await registerOrUpdateAgentForDeployment()
        } catch (agentError) {
          logger.error('Error registering agent after redeploy:', agentError)
          // Don't throw - deployment succeeded, agent registration is non-critical
        }
      }
    } catch (error: unknown) {
      logger.error('Error redeploying workflow:', { error })
      // Re-throw to show error to user
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsSubmitting(false)
    setChatSubmitting(false)
    onOpenChange(false)
  }

  const handlePostDeploymentUpdate = async () => {
    if (!workflowId) return

    setDeploymentStatus(workflowId, true, new Date(), getApiKeyLabel())

    const deploymentInfoResponse = await fetch(`/api/workflows/${workflowId}/deploy`)
    if (deploymentInfoResponse.ok) {
      const deploymentData = await deploymentInfoResponse.json()
      const apiEndpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`
      const inputFormatExample = getInputFormatExample(selectedStreamingOutputs.length > 0)

      const placeholderKey = getApiHeaderPlaceholder()

      setDeploymentInfo({
        isDeployed: deploymentData.isDeployed,
        deployedAt: deploymentData.deployedAt,
        apiKey: getApiKeyLabel(deploymentData.apiKey),
        endpoint: apiEndpoint,
        exampleCommand: `curl -X POST -H "X-API-Key: ${placeholderKey}" -H "Content-Type: application/json"${inputFormatExample} ${apiEndpoint}`,
        needsRedeployment: false,
      })
    }

    await refetchDeployedState()
    await fetchVersions()
    useWorkflowRegistry.getState().setWorkflowNeedsRedeployment(workflowId, false)
  }

  /**
   * Register or update agent on-chain during API deployment
   * This ensures agents are registered by default, not just when chat is launched
   */
  const registerOrUpdateAgentForDeployment = async () => {
    if (!workflowId) {
      logger.warn('Cannot register agent: missing workflowId')
      return null
    }

    // Get wallet address - try multiple sources
    let walletAddress: string | undefined = undefined

    // First try wallets array
    if (wallets && wallets.length > 0 && wallets[0]?.address) {
      walletAddress = wallets[0].address
    }

    // Fallback to user.wallet.address if wallets array is empty
    if (!walletAddress && user?.wallet?.address) {
      walletAddress = typeof user.wallet.address === 'string'
        ? user.wallet.address
        : (user.wallet.address as any)?.address
    }

    if (!walletAddress) {
      // Deployment itself is allowed to continue, but nothing reaches the chain
      // from here: no registration, no deployment-state update, no wallet prompt.
      logger.error(
        'Skipping all on-chain work: no wallet address. Deployment will continue, but the ' +
          'agent will not be registered or updated on-chain.',
        { walletsReady, walletCount: wallets?.length ?? 0, hasUserWallet: !!user?.wallet }
      )
      return null
    }

    // Get provider from wallets array - we need the actual wallet object to get provider
    let provider: any = null
    let walletToUse = wallets?.[0]

    // If wallets array is empty but we have wallet address from user, wait a bit for wallets to populate
    if (!walletToUse && walletAddress && walletsReady) {
      // Wait up to 2 seconds for wallets to populate
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
      // Nothing on-chain can happen without a provider, and we return before
      // the agent lookup below, so this is the end of the road for this click.
      logger.error(
        'Skipping all on-chain work: no wallet provider. The wallet is not connected, ' +
          'so no transaction will be proposed and no wallet prompt will appear.',
        { walletAddress, walletsReady, walletCount: wallets?.length ?? 0 }
      )
      return null
    }

    try {
      // Check if agent already exists for this workflow
      const existingAgentResponse = await fetch(`/api/agents?workflowId=${workflowId}`)
      let existingAgent: any = null

      if (existingAgentResponse.ok) {
        const agentsData = await existingAgentResponse.json()
        if (agentsData.agents && agentsData.agents.length > 0) {
          existingAgent = agentsData.agents[0]
          logger.info('Found existing agent, will update deployment state', {
            agentId: existingAgent.agentId,
          })
        } else {
          logger.info('No agent registered for this workflow yet; will register a new one')
        }
      } else {
        // Previously indistinguishable from "no agent exists": a 401 here meant
        // the update branch was skipped with no wallet prompt and no error.
        logger.error(
          'Could not look up the existing agent; treating this workflow as unregistered. ' +
            'If an agent does exist on-chain, its deployment state will NOT be updated.',
          { status: existingAgentResponse.status, workflowId }
        )
      }

      // Get current workflow state for deployment state
      const workflowState = useWorkflowStore.getState().getWorkflowState()
      const deploymentStateJson = JSON.stringify({
        blocks: workflowState.blocks,
        edges: workflowState.edges,
        loops: workflowState.loops,
        parallels: workflowState.parallels,
      })

      // Get API endpoint - construct it directly since we know the workflowId
      const apiEndpoint = `${getEnv('NEXT_PUBLIC_APP_URL')}/api/workflows/${workflowId}/execute`

      if (existingAgent) {
        // UPDATE existing agent - update deployment state on-chain
        logger.info('Updating existing agent deployment state')

        try {
          const deploymentUpdateResult = await updateDeploymentState(
            walletAddress,
            existingAgent.agentId,
            deploymentStateJson,
            provider
          )

          if (deploymentUpdateResult) {
            logger.info('Agent deployment state updated on-chain', {
              txHash: deploymentUpdateResult.txHash,
              agentId: existingAgent.agentId,
            })
          }

          // Update metadata with API endpoint if not already set
          const metadata: AgentMetadata = {
            ...existingAgent.metadata,
            apiEndpoint,
          }

          // Update metadata on-chain if API endpoint changed
          if (existingAgent.metadata.apiEndpoint !== apiEndpoint) {
            try {
              const updateResult = await updateAgentMetadata(
                walletAddress,
                existingAgent.agentId,
                buildAgentMetadata(metadata),
                provider
              )

              if (updateResult) {
                logger.info('Agent metadata updated on-chain with API endpoint', {
                  txHash: updateResult.txHash,
                })
              }
            } catch (metadataError) {
              logger.error('Error updating agent metadata on-chain:', metadataError)
              // Continue - deployment state update succeeded
            }
          }

          // Update in database
          await fetch(`/api/agents?agentId=${existingAgent.agentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metadata,
            }),
          })

          setAgentData({
            agentId: existingAgent.agentId,
            agentDID: existingAgent.agentDID,
            transactionHash: existingAgent.transactionHash,
            metadata,
          })

          return {
            agentId: existingAgent.agentId,
            agentDID: existingAgent.agentDID,
            transactionHash: existingAgent.transactionHash,
            metadata,
          }
        } catch (updateError) {
          logger.error('Error updating agent deployment state:', updateError)
          // Don't throw - deployment succeeded, on-chain update is non-critical
          return null
        }
      } else {
        // REGISTER new agent on-chain with API deployment info
        logger.info('No existing agent found, registering new agent with API deployment info')

        // Build metadata with API info only (no chat or token info yet)
        const metadata: AgentMetadata = {
          workflowId,
          workflowName: workflowMetadata?.name,
          deployedAt: new Date().toISOString(),
          apiEndpoint,
        }

        // Register agent on-chain (no token info)
        logger.info('Registering new agent on-chain', {
          workflowId,
          apiEndpoint,
        })

        const registerResult = await registerAgent(
          walletAddress,
          buildAgentMetadata(metadata),
          provider,
          undefined, // chain (uses default)
          '', // tokenName - empty for now
          '', // tokenSymbol - empty for now
          '', // tokenIpfsHash - empty for now
          deploymentStateJson
        )

        if (!registerResult) {
          const errorMsg = 'Agent registration failed: no result returned from contract'
          logger.error(errorMsg)
          throw new Error(errorMsg)
        }

        logger.info('Agent registered successfully on-chain', {
          agentId: registerResult.agentId.toString(),
          agentDID: registerResult.agentDID,
          txHash: registerResult.txHash,
        })

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

        const result = {
          agentId: registerResult.agentId.toString(),
          agentDID: registerResult.agentDID,
          transactionHash: registerResult.txHash,
          metadata,
        }

        setAgentData(result)
        return result
      }
    } catch (error: any) {
      logger.error('Error in agent registration/update:', error)
      // Don't throw - deployment succeeded, agent registration is non-critical
      return null
    }
  }

  const registerAgentAfterDeployment = async (chatFormData: {
    identifier: string
    title: string
    description: string
    authType: string
    chatId: string
  }) => {
    if (!workflowId) {
      logger.warn('Cannot register agent: missing workflowId')
      return null
    }

    setIsRegisteringAgent(true)

    try {
      // 1. Check if agent already exists for this workflow
      // Agent should exist from API deployment, but we handle the case where it doesn't
      const existingAgentResponse = await fetch(`/api/agents?workflowId=${workflowId}`)
      let existingAgent: any = null

      if (existingAgentResponse.ok) {
        const agentsData = await existingAgentResponse.json()
        if (agentsData.agents && agentsData.agents.length > 0) {
          existingAgent = agentsData.agents[0]
          logger.info('Found existing agent, will update with chat details', {
            agentId: existingAgent.agentId,
          })
        }
      }

      if (!existingAgent) {
        // Agent should have been registered during API deployment
        // But if it doesn't exist, register it now with chat info
        logger.warn('Agent not found, registering new agent with chat info')
      }

      // 2. Build updated metadata with BOTH API and chat info
      const metadata: AgentMetadata = existingAgent
        ? {
          // Preserve ALL existing metadata
          ...existingAgent.metadata,
          // Update chat-related fields
          chatIdentifier: chatFormData.identifier,
          chatTitle: chatFormData.title,
          chatDescription: chatFormData.description,
          chatAuthType: chatFormData.authType as any,
          chatUrl: `${window.location.origin}/chat/${chatFormData.identifier}`,
        }
        : {
          // New agent - build complete metadata (shouldn't happen if API was deployed)
          workflowId,
          workflowName: workflowMetadata?.name,
          deployedAt: new Date().toISOString(),
          // API info
          apiEndpoint: deploymentInfo?.endpoint,
          // Chat info
          chatIdentifier: chatFormData.identifier,
          chatTitle: chatFormData.title,
          chatDescription: chatFormData.description,
          chatAuthType: chatFormData.authType as any,
          chatUrl: `${window.location.origin}/chat/${chatFormData.identifier}`,
        }

      if (existingAgent) {
        // UPDATE existing agent metadata with chat details
        logger.info('Updating existing agent metadata with chat details')

        // Get wallet provider for on-chain update
        const walletAddress = wallets?.[0]?.address
        if (!walletAddress) {
          logger.warn('Cannot update agent: no wallet address')
          throw new Error('Wallet address required for agent update')
        }

        let provider: any = null
        try {
          if (wallets && wallets.length > 0) {
            provider = await wallets[0].getEthereumProvider()
          }
        } catch (error) {
          logger.error('Error getting wallet provider:', error)
          throw error
        }

        if (!provider) {
          logger.warn('Cannot update agent: no wallet provider')
          throw new Error('Wallet provider required for agent update')
        }

        // Update metadata on-chain
        try {
          const updateResult = await updateAgentMetadata(
            walletAddress,
            existingAgent.agentId,
            buildAgentMetadata(metadata),
            provider
          )

          if (updateResult) {
            logger.info('Agent metadata updated on-chain with chat details', {
              txHash: updateResult.txHash,
            })
          }

          // Note: Deployment state is NOT updated here - it should only be updated when
          // the workflow itself changes (during API deployment/redeployment), not when
          // chat is deployed. Chat deployment only updates metadata.
        } catch (onChainError) {
          logger.error('Error updating agent metadata on-chain:', onChainError)
          // Continue with database update even if on-chain update fails
        }

        // Update in database
        const updateResponse = await fetch(`/api/agents?agentId=${existingAgent.agentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: chatFormData.chatId,
            metadata,
          }),
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update agent metadata')
        }

        const updateResult = await updateResponse.json()
        logger.info('Agent metadata updated successfully with chat details')

        const result = {
          agentId: existingAgent.agentId,
          agentDID: existingAgent.agentDID,
          transactionHash: existingAgent.transactionHash,
          metadata,
        }

        setAgentData(result)
        return result
      }
      // REGISTER new agent on-chain (shouldn't happen if API was deployed, but handle it)
      logger.info('No existing agent found, registering new agent with chat info')

      const walletAddress = wallets?.[0]?.address
      if (!walletAddress) {
        logger.warn('Cannot register agent: no wallet address')
        return null
      }

      let provider: any = null
      try {
        if (wallets && wallets.length > 0) {
          provider = await wallets[0].getEthereumProvider()
        }
      } catch (error) {
        logger.error('Error getting wallet provider:', error)
        return null
      }

      if (!provider) {
        logger.warn('Cannot register agent: no wallet provider')
        return null
      }

      // Get current workflow state for deployment state
      const workflowState = useWorkflowStore.getState().getWorkflowState()
      const deploymentStateJson = JSON.stringify({
        blocks: workflowState.blocks,
        edges: workflowState.edges,
        loops: workflowState.loops,
        parallels: workflowState.parallels,
      })

      // Register agent on-chain (no token info - token creation is separate)
      const registerResult = await registerAgent(
        walletAddress,
        buildAgentMetadata(metadata),
        provider,
        undefined, // chain (uses default)
        '', // tokenName - empty (token creation is separate)
        '', // tokenSymbol - empty (token creation is separate)
        '', // tokenIpfsHash - empty (token creation is separate)
        deploymentStateJson
      )

      if (!registerResult) {
        logger.error('Agent registration failed: no result returned')
        return null
      }

      // Update metadata with token address
      if (registerResult.tokenAddress) {
        metadata.tokenAddress = registerResult.tokenAddress
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
          chatId: chatFormData.chatId,
          metadata,
          transactionHash: registerResult.txHash,
        }),
      })

      logger.info('Agent registered and stored successfully', {
        agentId: registerResult.agentId.toString(),
      })

      const result = {
        agentId: registerResult.agentId.toString(),
        agentDID: registerResult.agentDID,
        transactionHash: registerResult.txHash,
        metadata,
      }

      setAgentData(result)
      return result
    } catch (error: any) {
      logger.error('Error in agent registration/update:', error)
      throw error
    } finally {
      setIsRegisteringAgent(false)
    }
  }

  const handleChatFormSubmit = () => {
    const form = document.getElementById('chat-deploy-form') as HTMLFormElement
    if (form) {
      const updateTrigger = form.querySelector('[data-update-trigger]') as HTMLButtonElement
      if (updateTrigger) {
        updateTrigger.click()
      } else {
        form.requestSubmit()
      }
    }
  }

  const handleChatDelete = () => {
    const form = document.getElementById('chat-deploy-form') as HTMLFormElement
    if (form) {
      const deleteButton = form.querySelector('[data-delete-trigger]') as HTMLButtonElement
      if (deleteButton) {
        deleteButton.click()
      }
    }
  }

  const handleTemplateFormSubmit = useCallback(() => {
    const form = document.getElementById('template-deploy-form') as HTMLFormElement
    form?.requestSubmit()
  }, [])

  const handleTemplateDelete = useCallback(() => {
    const form = document.getElementById('template-deploy-form')
    const deleteTrigger = form?.querySelector('[data-template-delete-trigger]') as HTMLButtonElement
    deleteTrigger?.click()
  }, [])

  return (
    <>
      <Modal open={open} onOpenChange={handleCloseModal}>
        <ModalContent className='h-[76vh] w-[660px]'>
          <ModalHeader>Deploy Workflow</ModalHeader>

          <ModalTabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabView)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <ModalTabsList activeValue={activeTab}>
              <ModalTabsTrigger value='general'>General</ModalTabsTrigger>
              <ModalTabsTrigger value='api'>API</ModalTabsTrigger>
              <ModalTabsTrigger value='chat'>Chat</ModalTabsTrigger>
              <ModalTabsTrigger value='template'>Template</ModalTabsTrigger>
              <ModalTabsTrigger value='agent'>Agent</ModalTabsTrigger>
              <ModalTabsTrigger value='token'>Token</ModalTabsTrigger>
            </ModalTabsList>

            <ModalBody className='min-h-0 flex-1'>
              <ModalTabsContent value='general'>
                <GeneralDeploy
                  workflowId={workflowId}
                  deployedState={deployedState}
                  isLoadingDeployedState={isLoadingDeployedState}
                  versions={versions}
                  versionsLoading={versionsLoading}
                  onPromoteToLive={handlePromoteToLive}
                  onLoadDeploymentComplete={handleCloseModal}
                  fetchVersions={fetchVersions}
                />
              </ModalTabsContent>

              <ModalTabsContent value='api'>
                <ApiDeploy
                  workflowId={workflowId}
                  deploymentInfo={deploymentInfo}
                  isLoading={isLoading}
                  needsRedeployment={needsRedeployment}
                  apiDeployError={apiDeployError || agentRegistrationError}
                  getInputFormatExample={getInputFormatExample}
                  selectedStreamingOutputs={selectedStreamingOutputs}
                  onSelectedStreamingOutputsChange={setSelectedStreamingOutputs}
                />
              </ModalTabsContent>

              <ModalTabsContent value='chat'>
                <ChatDeploy
                  workflowId={workflowId || ''}
                  deploymentInfo={deploymentInfo}
                  existingChat={existingChat}
                  isLoadingChat={isLoadingChat}
                  onRefetchChat={fetchChatDeploymentInfo}
                  onChatExistsChange={setChatExists}
                  chatSubmitting={chatSubmitting}
                  setChatSubmitting={setChatSubmitting}
                  onValidationChange={setIsChatFormValid}
                  onDeploymentComplete={handleCloseModal}
                  onDeployed={async (chatData) => {
                    await handlePostDeploymentUpdate()
                    // Update agent metadata with chat details after chat deployment
                    try {
                      await registerAgentAfterDeployment(chatData)
                      // Switch to agent tab to show registration result
                      setActiveTab('agent')
                    } catch (error) {
                      logger.error('Error during agent update:', error)
                    }
                  }}
                  onVersionActivated={() => { }}
                />
              </ModalTabsContent>

              <ModalTabsContent value='template'>
                {workflowId && (
                  <TemplateDeploy
                    workflowId={workflowId}
                    onDeploymentComplete={handleCloseModal}
                    onValidationChange={setTemplateFormValid}
                    onSubmittingChange={setTemplateSubmitting}
                    onExistingTemplateChange={setHasExistingTemplate}
                    onTemplateStatusChange={setTemplateStatus}
                  />
                )}
              </ModalTabsContent>

              <ModalTabsContent value='agent'>
                {agentData ? (
                  <AgentInfo
                    agentId={agentData.agentId}
                    agentDID={agentData.agentDID}
                    transactionHash={agentData.transactionHash}
                    metadata={agentData.metadata}
                  />
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    {isRegisteringAgent ? (
                      <>
                        <div className='mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                        <p className='text-muted-foreground text-sm'>
                          Registering agent on-chain...
                        </p>
                      </>
                    ) : (
                      <p className='text-muted-foreground text-sm'>
                        No agent registered yet. Deploy API to register an agent.
                      </p>
                    )}
                  </div>
                )}
              </ModalTabsContent>

              <ModalTabsContent value='token'>
                {workflowId && (
                  <TokenDeploy
                    workflowId={workflowId}
                    agentData={agentData}
                    isSubmitting={tokenSubmitting}
                    setIsSubmitting={setTokenSubmitting}
                    onTokenCreated={async () => {
                      // Refresh agent data after token creation
                      await fetchExistingAgent()
                      setActiveTab('agent')
                    }}
                  />
                )}
              </ModalTabsContent>
            </ModalBody>
          </ModalTabs>

          {activeTab === 'general' && (
            <GeneralFooter
              isDeployed={isDeployed}
              needsRedeployment={needsRedeployment}
              isSubmitting={isSubmitting}
              isUpdatingAgentOnChain={isUpdatingAgentOnChain}
              // isUndeploying={isUndeploying}
              onDeploy={onDeploy}
              onRedeploy={handleRedeploy}
            // onUndeploy={() => setShowUndeployConfirm(true)}
            />
          )}
          {activeTab === 'chat' && (
            <ModalFooter className='items-center'>
              <div className='flex gap-2'>
                {chatExists && (
                  <Button
                    type='button'
                    variant='default'
                    onClick={handleChatDelete}
                    disabled={chatSubmitting || isRegisteringAgent}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type='button'
                  variant='primary'
                  onClick={handleChatFormSubmit}
                  disabled={!isChatFormValid || chatSubmitting || isRegisteringAgent}
                >
                  {chatSubmitting ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                      {chatExists ? 'Updating...' : 'Deploying...'}
                    </>
                  ) : isRegisteringAgent ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                      {agentData ? 'Updating Agent...' : 'Registering Agent...'}
                    </>
                  ) : (
                    <>{chatExists ? 'Update' : 'Deploy'}</>
                  )}
                </Button>
              </div>
            </ModalFooter>
          )}
          {activeTab === 'template' && (
            <ModalFooter
              className={`items-center ${hasExistingTemplate && templateStatus ? 'justify-between' : ''}`}
            >
              {hasExistingTemplate && templateStatus && (
                <TemplateStatusBadge
                  status={templateStatus.status}
                  views={templateStatus.views}
                  stars={templateStatus.stars}
                />
              )}
              <div className='flex gap-2'>
                {hasExistingTemplate && (
                  <Button
                    type='button'
                    variant='default'
                    onClick={handleTemplateDelete}
                    disabled={templateSubmitting}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type='button'
                  variant='primary'
                  onClick={handleTemplateFormSubmit}
                  disabled={templateSubmitting || !templateFormValid}
                >
                  {templateSubmitting
                    ? hasExistingTemplate
                      ? 'Updating...'
                      : 'Publishing...'
                    : hasExistingTemplate
                      ? 'Update Template'
                      : 'Publish Template'}
                </Button>
              </div>
            </ModalFooter>
          )}
          {activeTab === 'token' && (
            <ModalFooter>
              <Button
                type='submit'
                form='token-deploy-form'
                variant='primary'
                disabled={!agentData || tokenSubmitting || Boolean(agentData?.metadata?.tokenAddress)}
              >
                {tokenSubmitting ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Creating Token...
                  </>
                ) : (
                  'Create Token'
                )}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* <Modal open={showUndeployConfirm} onOpenChange={setShowUndeployConfirm}>
        <ModalContent className='w-[400px]'>
          <ModalHeader>Undeploy API</ModalHeader>
          <ModalBody>
            <p className='text-[12px] text-[var(--text-tertiary)]'>
              Are you sure you want to undeploy this workflow?{' '}
              <span className='text-[var(--text-error)]'>
                This will remove the API endpoint and make it unavailable to external users.
              </span>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='default'
              onClick={() => setShowUndeployConfirm(false)}
              disabled={isUndeploying}
            >
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={handleUndeploy}
              disabled={isUndeploying}
              className='bg-[var(--text-error)] text-[13px] text-white hover:bg-[var(--text-error)]'
            >
              {isUndeploying ? 'Undeploying...' : 'Undeploy'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal> */}
    </>
  )
}

interface StatusBadgeProps {
  isWarning: boolean
}

function StatusBadge({ isWarning }: StatusBadgeProps) {
  const label = isWarning ? 'Update deployment' : 'Live'

  return (
    <div
      className={clsx(
        'flex h-[24px] items-center justify-start gap-[8px] rounded-[6px] border px-[9px]',
        isWarning ? 'border-[#A16207] bg-[#452C0F]' : 'border-[#22703D] bg-[#14291B]'
      )}
    >
      <div
        className='h-[6px] w-[6px] rounded-[2px]'
        style={{
          backgroundColor: isWarning ? '#EAB308' : '#4ADE80',
        }}
      />
      <span
        className='font-medium text-[11.5px]'
        style={{
          color: isWarning ? '#EAB308' : '#86EFAC',
        }}
      >
        {label}
      </span>
    </div>
  )
}

interface TemplateStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | null
  views?: number
  stars?: number
}

function TemplateStatusBadge({ views, stars }: TemplateStatusBadgeProps) {
  const label = 'Live'

  const statsText =
    views !== undefined && views > 0
      ? `${views} views${stars !== undefined && stars > 0 ? ` • ${stars} stars` : ''}`
      : null

  return (
    <div
      className={clsx(
        'flex h-[24px] items-center justify-start gap-[8px] rounded-[6px] border border-[#22703D] bg-[#14291B] px-[9px]'
      )}
    >
      <div className='h-[6px] w-[6px] rounded-[2px] bg-[#4ADE80]' />
      <span className='font-medium text-[#86EFAC] text-[11.5px]'>{label}</span>
      {statsText && <span className='font-medium text-[#86EFAC] text-[11.5px]'>• {statsText}</span>}
    </div>
  )
}

interface GeneralFooterProps {
  isDeployed?: boolean
  needsRedeployment: boolean
  isSubmitting: boolean
  isUpdatingAgentOnChain: boolean
  // isUndeploying: boolean
  onDeploy: () => Promise<void>
  onRedeploy: () => Promise<void>
  // onUndeploy: () => void
}

function GeneralFooter({
  isDeployed,
  needsRedeployment,
  isSubmitting,
  isUpdatingAgentOnChain,
  // isUndeploying,
  onDeploy,
  onRedeploy,
  // onUndeploy,
}: GeneralFooterProps) {
  if (!isDeployed) {
    return (
      <ModalFooter>
        <Button variant='primary' onClick={onDeploy} disabled={isSubmitting}>
          {isSubmitting ? 'Deploying...' : 'Deploy API'}
        </Button>
      </ModalFooter>
    )
  }

  return (
    <ModalFooter className='items-center justify-between'>
      <StatusBadge isWarning={needsRedeployment} />
      <div className='flex items-center gap-2'>
        {/* <Button variant='default' onClick={onUndeploy} disabled={isUndeploying || isSubmitting}>
          {isUndeploying ? 'Undeploying...' : 'Undeploy'}
        </Button> */}
        {needsRedeployment || isUpdatingAgentOnChain ? (
          <Button
            variant='primary'
            onClick={onRedeploy}
            disabled={isSubmitting || isUpdatingAgentOnChain /* || isUndeploying */}
          >
            {isSubmitting
              ? 'Updating deployment...'
              : isUpdatingAgentOnChain
                ? 'Updating agent on-chain...'
                : 'Update'}
          </Button>
        ) : (
          <Button variant='secondary' disabled>
            Up to date
          </Button>
        )}
      </div>
    </ModalFooter>
  )
}
