import { db } from '@botflow/db'
import { agent } from '@botflow/db/schema'
import { createLogger } from '@botflow/logger'
import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { generateRequestId } from '@/lib/core/utils/request'

const logger = createLogger('AgentsAPI')

const CreateAgentSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  agentWallet: z.string().min(1, 'Agent wallet is required'),
  ownerWallet: z.string().min(1, 'Owner wallet is required'),
  userDID: z.string().optional(),
  agentDID: z.string().optional(),
  chatId: z.string().optional(),
  metadata: z.record(z.any()),
  transactionHash: z.string().optional(),
})

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents
 * Create a new agent record after on-chain registration
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized agent creation attempt`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const validatedData = CreateAgentSchema.parse(body)

    // Verify the workflow belongs to the user
    const { workflow } = await import('@botflow/db/schema')
    const [workflowRecord] = await db
      .select({ id: workflow.id, userId: workflow.userId })
      .from(workflow)
      .where(eq(workflow.id, validatedData.workflowId))
      .limit(1)

    if (!workflowRecord) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (workflowRecord.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if agent with this agentId already exists
    const [existingAgent] = await db
      .select()
      .from(agent)
      .where(eq(agent.agentId, validatedData.agentId))
      .limit(1)

    if (existingAgent) {
      logger.info(`[${requestId}] Agent already exists, updating`, {
        agentId: validatedData.agentId,
      })

      // Update existing agent
      const [updatedAgent] = await db
        .update(agent)
        .set({
          workflowId: validatedData.workflowId,
          agentWallet: validatedData.agentWallet,
          ownerWallet: validatedData.ownerWallet,
          userDID: validatedData.userDID || null,
          agentDID: validatedData.agentDID || null,
          chatId: validatedData.chatId || null,
          metadata: validatedData.metadata,
          updatedAt: new Date(),
        })
        .where(eq(agent.id, existingAgent.id))
        .returning()

      return NextResponse.json({
        success: true,
        agent: updatedAgent,
        action: 'updated',
      })
    }

    // Create new agent record
    const agentId = crypto.randomUUID()
    const now = new Date()

    const [newAgent] = await db
      .insert(agent)
      .values({
        id: agentId,
        userId,
        workflowId: validatedData.workflowId,
        agentId: validatedData.agentId,
        agentWallet: validatedData.agentWallet,
        ownerWallet: validatedData.ownerWallet,
        userDID: validatedData.userDID || null,
        agentDID: validatedData.agentDID || null,
        chatId: validatedData.chatId || null,
        metadata: validatedData.metadata,
        transactionHash: validatedData.transactionHash || null,
        isActive: true,
        registeredAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    logger.info(`[${requestId}] Agent created successfully`, {
      agentId: newAgent.id,
      onChainAgentId: validatedData.agentId,
      workflowId: validatedData.workflowId,
    })

    return NextResponse.json({
      success: true,
      agent: newAgent,
      action: 'created',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn(`[${requestId}] Invalid agent data`, {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Invalid agent data', details: error.errors },
        { status: 400 }
      )
    }

    logger.error(`[${requestId}] Agent creation error`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/agents
 * Get all agents for the current user
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized agent fetch attempt`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const workflowId = searchParams.get('workflowId')

    const conditions = workflowId
      ? and(eq(agent.userId, userId), eq(agent.workflowId, workflowId))
      : eq(agent.userId, userId)

    const agents = await db.select().from(agent).where(conditions).orderBy(desc(agent.createdAt))

    return NextResponse.json({
      success: true,
      agents,
    })
  } catch (error: any) {
    logger.error(`[${requestId}] Agent fetch error`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const UpdateAgentSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required').optional(),
  agentWallet: z.string().min(1, 'Agent wallet is required').optional(),
  ownerWallet: z.string().min(1, 'Owner wallet is required').optional(),
  userDID: z.string().optional(),
  agentDID: z.string().optional(),
  chatId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * PATCH /api/agents?agentId=<agentId>
 * Update agent metadata in the database
 */
export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized agent update attempt`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateAgentSchema.parse(body)

    // Verify the agent belongs to the user
    const [existingAgent] = await db
      .select()
      .from(agent)
      .where(and(eq(agent.agentId, agentId), eq(agent.userId, userId)))
      .limit(1)

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.workflowId !== undefined) updateData.workflowId = validatedData.workflowId
    if (validatedData.agentWallet !== undefined) updateData.agentWallet = validatedData.agentWallet
    if (validatedData.ownerWallet !== undefined) updateData.ownerWallet = validatedData.ownerWallet
    if (validatedData.userDID !== undefined) updateData.userDID = validatedData.userDID || null
    if (validatedData.agentDID !== undefined) updateData.agentDID = validatedData.agentDID || null
    if (validatedData.chatId !== undefined) updateData.chatId = validatedData.chatId || null
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata

    // Update agent
    const [updatedAgent] = await db
      .update(agent)
      .set(updateData)
      .where(eq(agent.id, existingAgent.id))
      .returning()

    logger.info(`[${requestId}] Agent metadata updated successfully`, {
      agentId: updatedAgent.id,
      onChainAgentId: agentId,
    })

    return NextResponse.json({
      success: true,
      agent: updatedAgent,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn(`[${requestId}] Invalid agent metadata`, {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Invalid agent metadata', details: error.errors },
        { status: 400 }
      )
    }

    logger.error(`[${requestId}] Agent metadata update error`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
