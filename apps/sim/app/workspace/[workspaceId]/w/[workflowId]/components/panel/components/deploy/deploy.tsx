'use client'

import { useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button, Rocket, Tooltip } from '@/components/emcn'
import { DeployModal } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/panel/components/deploy/components/deploy-modal/deploy-modal'
import { X402PaywallDialog } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/panel/components/deploy/components/x402-paywall-dialog'
import {
  useChangeDetection,
  useDeployedState,
  useDeployment,
} from '@/app/workspace/[workspaceId]/w/[workflowId]/components/panel/components/deploy/hooks'
import { useCurrentWorkflow } from '@/app/workspace/[workspaceId]/w/[workflowId]/hooks/use-current-workflow'
import type { WorkspaceUserPermissions } from '@/hooks/use-user-permissions'
import { useUserProfile } from '@/hooks/queries/user-profile'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { createLogger } from '@sim/logger'

const logger = createLogger('Deploy')

interface DeployProps {
  activeWorkflowId: string | null
  userPermissions: WorkspaceUserPermissions
  className?: string
}

/**
 * Deploy component that handles workflow deployment
 * Manages deployed state, change detection, and deployment operations
 */
export function Deploy({ activeWorkflowId, userPermissions, className }: DeployProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const hydrationPhase = useWorkflowRegistry((state) => state.hydration.phase)
  const isRegistryLoading =
    hydrationPhase === 'idle' ||
    hydrationPhase === 'metadata-loading' ||
    hydrationPhase === 'state-loading'
  const { hasBlocks } = useCurrentWorkflow()
  const workflowMetadata = useWorkflowRegistry((state) =>
    activeWorkflowId ? state.workflows[activeWorkflowId] : undefined
  )

  // Get deployment status from registry
  const deploymentStatus = useWorkflowRegistry((state) =>
    state.getWorkflowDeploymentStatus(activeWorkflowId)
  )
  const isDeployed = deploymentStatus?.isDeployed || false

  // Fetch and manage deployed state
  const { deployedState, isLoadingDeployedState, refetchDeployedState } = useDeployedState({
    workflowId: activeWorkflowId,
    isDeployed,
    isRegistryLoading,
  })

  // Detect changes between current and deployed state
  const { changeDetected, setChangeDetected } = useChangeDetection({
    workflowId: activeWorkflowId,
    deployedState,
    isLoadingDeployedState,
  })

  // Handle deployment operations
  const { isDeploying, handleDeployClick } = useDeployment({
    workflowId: activeWorkflowId,
    isDeployed,
    refetchDeployedState,
  })

  // Fetch user profile for verification check
  const { data: profile } = useUserProfile()
  const isVerified = !!profile?.userDID

  const isEmpty = !hasBlocks()
  const canDeploy = userPermissions.canAdmin
  const isDisabled = isDeploying || !canDeploy || isEmpty || !isVerified

  /**
   * Handle deploy button click - check payment status first
   */
  /**
   * Handle deploy button click - check payment status first
   */
  const onDeployClick = useCallback(async () => {
    if (!canDeploy || !activeWorkflowId || !isVerified) return

    // Check if payment is required and not yet completed
    const paymentPaid = workflowMetadata?.deploymentPaymentPaid ?? false

    if (!paymentPaid && !isDeployed) {
      // Show X402 paywall for first-time deployment
      setIsPaywallOpen(true)
      return
    }

    // Payment already completed or workflow already deployed, proceed normally
    const result = await handleDeployClick()
    if (result.shouldOpenModal) {
      setIsModalOpen(true)
    }
  }, [canDeploy, activeWorkflowId, handleDeployClick, workflowMetadata, isDeployed, isVerified])

  /**
   * Handle successful X402 payment
   */
  const handlePaymentSuccess = useCallback(
    async (paymentTxHash?: string) => {
      if (!activeWorkflowId) return

      try {
        // Record payment in database
        const response = await fetch(`/api/workflows/${activeWorkflowId}/deployment-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentTxHash }),
        })

        if (!response.ok) {
          throw new Error('Failed to record payment')
        }

        // Close paywall and proceed with deployment
        setIsPaywallOpen(false)

        // Trigger deployment
        const result = await handleDeployClick()
        if (result.shouldOpenModal) {
          setIsModalOpen(true)
        }
      } catch (error) {
        logger.error('Error recording payment:', error)
        // Still close paywall but show error in modal
        setIsPaywallOpen(false)
      }
    },
    [activeWorkflowId, handleDeployClick]
  )

  const refetchWithErrorHandling = async () => {
    if (!activeWorkflowId) return

    try {
      await refetchDeployedState()
    } catch (error) {
      // Error already logged in hook
    }
  }

  /**
   * Get tooltip text based on current state
   */
  const getTooltipText = () => {
    if (!isVerified) {
      return 'You must verify your identity in Settings > General to deploy agents'
    }
    if (isEmpty) {
      return 'Cannot deploy an empty workflow'
    }
    // ... rest of logic
    if (!canDeploy) {
      return 'Admin permissions required'
    }
    if (isDeploying) {
      return 'Deploying...'
    }
    if (changeDetected) {
      return 'Update deployment'
    }
    if (isDeployed) {
      return 'Active deployment'
    }
    return 'Deploy workflow'
  }

  return (
    <>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span>
            <Button
              className='h-[32px] gap-[8px] px-[10px]'
              variant='active'
              onClick={onDeployClick}
              disabled={isDisabled}
            >
              {isDeploying ? (
                <Loader2 className='h-[13px] w-[13px] animate-spin' />
              ) : (
                <Rocket className='h-[13px] w-[13px]' />
              )}
              {changeDetected ? 'Update' : isDeployed ? 'Active' : 'Deploy'}
            </Button>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>{getTooltipText()}</Tooltip.Content>
      </Tooltip.Root>

      <X402PaywallDialog
        open={isPaywallOpen}
        onOpenChange={setIsPaywallOpen}
        onSuccess={handlePaymentSuccess}
      />

      <DeployModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workflowId={activeWorkflowId}
        isDeployed={isDeployed}
        needsRedeployment={changeDetected}
        setNeedsRedeployment={setChangeDetected}
        deployedState={deployedState!}
        isLoadingDeployedState={isLoadingDeployedState}
        refetchDeployedState={refetchWithErrorHandling}
      />
    </>
  )
}
