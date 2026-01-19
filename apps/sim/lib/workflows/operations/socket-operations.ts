import { createLogger } from '@wazabi/logger'
import { useOperationQueueStore } from '@/stores/operation-queue/store'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

const logger = createLogger('WorkflowSocketOperations')

async function resolveUserId(): Promise<string> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    })
    if (response.ok) {
      const sessionData = await response.json()
      const userId = sessionData?.user?.id
      if (userId) {
        return userId
      }
    }
  } catch (error) {
    logger.warn('Failed to resolve session user id for workflow operation', { error })
  }

  return 'unknown'
}

interface EnqueueWorkflowOperationArgs {
  operation: string
  target: string
  payload: any
  workflowId: string
  immediate?: boolean
  operationId?: string
}

/**
 * Queues a workflow socket operation so it flows through the standard operation queue,
 * ensuring consistent retries, confirmations, and telemetry.
 */
export async function enqueueWorkflowOperation({
  operation,
  target,
  payload,
  workflowId,
  immediate = false,
  operationId,
}: EnqueueWorkflowOperationArgs): Promise<string> {
  const userId = await resolveUserId()
  const opId = operationId ?? crypto.randomUUID()

  useOperationQueueStore.getState().addToQueue({
    id: opId,
    operation: {
      operation,
      target,
      payload,
    },
    workflowId,
    userId,
  })

  logger.debug('Queued workflow operation', {
    workflowId,
    operation,
    target,
    operationId: opId,
    immediate,
  })

  return opId
}

interface EnqueueReplaceStateArgs {
  workflowId: string
  state: WorkflowState
  immediate?: boolean
  operationId?: string
}

/**
 * Convenience wrapper for broadcasting a full workflow state replacement via the queue.
 */
export async function enqueueReplaceWorkflowState({
  workflowId,
  state,
  immediate,
  operationId,
}: EnqueueReplaceStateArgs): Promise<string> {
  return enqueueWorkflowOperation({
    workflowId,
    operation: 'replace-state',
    target: 'workflow',
    payload: { state },
    immediate,
    operationId,
  })
}
import {
  BLOCKS_OPERATIONS,
  EDGES_OPERATIONS,
  OPERATION_TARGETS,
} from '@/socket/constants'

/**
 * Helper to chunk an array into smaller arrays of a specific size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

interface EnqueueBatchAddBlocksArgs {
  workflowId: string
  blocks: any[]
  edges?: any[]
  loops?: Record<string, any>
  parallels?: Record<string, any>
  subBlockValues?: Record<string, any>
  userId: string
}

/**
 * Enqueues a large batch-add-blocks operation by splitting it into smaller chunks
 * to prevent server timeouts and ensure scalability.
 */
export async function enqueueChunkedBatchAddBlocks({
  workflowId,
  blocks,
  edges = [],
  loops = {},
  parallels = {},
  subBlockValues = {},
  userId,
}: EnqueueBatchAddBlocksArgs): Promise<void> {
  const BLOCK_CHUNK_SIZE = 20

  logger.info(`Enqueueing chunked batch add: ${blocks.length} blocks, ${edges.length} edges`, {
    workflowId,
  })

  // If small enough, just send one operation
  if (blocks.length <= BLOCK_CHUNK_SIZE) {
    useOperationQueueStore.getState().addToQueue({
      id: crypto.randomUUID(),
      operation: {
        operation: BLOCKS_OPERATIONS.BATCH_ADD_BLOCKS,
        target: OPERATION_TARGETS.BLOCKS,
        payload: {
          blocks,
          edges,
          loops,
          parallels,
          subBlockValues,
        },
      },
      workflowId,
      userId,
    })
    return
  }

  // Split blocks into chunks
  const blockChunks = chunkArray(blocks, BLOCK_CHUNK_SIZE)

  blockChunks.forEach((chunk, index) => {
    // For each chunk, identify which loops/parallels/subBlockValues belong to these blocks
    const chunkBlockIds = new Set(chunk.map((b) => b.id))

    const chunkLoops: Record<string, any> = {}
    const chunkParallels: Record<string, any> = {}
    const chunkSubBlockValues: Record<string, any> = {}

    // Filter loops/parallels that are in this chunk
    chunk.forEach((block) => {
      if (loops[block.id]) chunkLoops[block.id] = loops[block.id]
      if (parallels[block.id]) chunkParallels[block.id] = parallels[block.id]
      if (subBlockValues[block.id]) chunkSubBlockValues[block.id] = subBlockValues[block.id]
    })

    // Add this chunk of blocks
    // Note: We do NOT add edges yet, as edges might connect to blocks in later chunks
    useOperationQueueStore.getState().addToQueue({
      id: crypto.randomUUID(),
      operation: {
        operation: BLOCKS_OPERATIONS.BATCH_ADD_BLOCKS,
        target: OPERATION_TARGETS.BLOCKS,
        payload: {
          blocks: chunk,
          edges: [], // Edges sent separately after all blocks
          loops: chunkLoops,
          parallels: chunkParallels,
          subBlockValues: chunkSubBlockValues,
        },
      },
      workflowId,
      userId,
    })
  })

  // Finally, add all edges in a separate batch
  // Edges are lightweight but require endpoints to exist
  if (edges.length > 0) {
    const EDGE_CHUNK_SIZE = 100 // Edges are smaller, can handle more
    const edgeChunks = chunkArray(edges, EDGE_CHUNK_SIZE)

    edgeChunks.forEach((edgeChunk) => {
      useOperationQueueStore.getState().addToQueue({
        id: crypto.randomUUID(),
        operation: {
          operation: EDGES_OPERATIONS.BATCH_ADD_EDGES,
          target: OPERATION_TARGETS.EDGES,
          payload: {
            edges: edgeChunk,
          },
        },
        workflowId,
        userId,
      })
    })
  }
}
