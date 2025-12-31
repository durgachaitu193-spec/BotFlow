import { db, workflow } from '@sim/db'
import { createLogger } from '@sim/logger'
import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { generateRequestId } from '@/lib/core/utils/request'
import { validateWorkflowPermissions } from '@/lib/workflows/utils'
import { createErrorResponse, createSuccessResponse } from '@/app/api/workflows/utils'

const logger = createLogger('WorkflowDeploymentPaymentAPI')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PaymentSchema = z.object({
  paymentTxHash: z.string().optional(),
})

/**
 * POST /api/workflows/[id]/deployment-payment
 * Record successful X402 payment for workflow deployment
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  const { id } = await params

  try {
    logger.debug(`[${requestId}] Recording deployment payment for workflow: ${id}`)

    const { error } = await validateWorkflowPermissions(id, requestId, 'admin')
    if (error) {
      return createErrorResponse(error.message, error.status)
    }

    const body = await request.json()
    const { paymentTxHash } = PaymentSchema.parse(body)

    // Update workflow payment status
    const [updatedWorkflow] = await db
      .update(workflow)
      .set({
        deploymentPaymentPaid: true,
        deploymentPaymentPaidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflow.id, id))
      .returning()

    logger.info(`[${requestId}] Deployment payment recorded for workflow: ${id}`, {
      paymentTxHash,
    })

    return createSuccessResponse({
      deploymentPaymentPaid: updatedWorkflow.deploymentPaymentPaid,
      deploymentPaymentPaidAt: updatedWorkflow.deploymentPaymentPaidAt,
      paymentTxHash,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn(`[${requestId}] Invalid payment data for workflow ${id}`, {
        errors: error.errors,
      })
      return createErrorResponse('Invalid request data', 400)
    }

    logger.error(`[${requestId}] Error recording deployment payment: ${id}`, error)
    return createErrorResponse(error.message || 'Failed to record payment', 500)
  }
}
