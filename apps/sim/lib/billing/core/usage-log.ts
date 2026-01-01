import { createLogger } from '@sim/logger'

const logger = createLogger('UsageLog')

interface LogUsageBatchParams {
    userId: string
    workspaceId?: string
    workflowId: string
    executionId?: string
    baseExecutionCharge: number
    models?: Record<string, any>
}

/**
 * Logs usage entries for auditing (batch insert for performance)
 * NOTE: This is a stub implementation to fix build failures caused by the missing file.
 * The original implementation was lost or moved and needs to be restored.
 */
export async function logWorkflowUsageBatch(params: LogUsageBatchParams): Promise<void> {
    logger.debug('logWorkflowUsageBatch called (stub)', {
        userId: params.userId,
        workflowId: params.workflowId,
        executionId: params.executionId,
    })
    // TODO: Restore actual database logging logic here
}
