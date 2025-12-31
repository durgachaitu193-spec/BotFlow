import { NextRequest, NextResponse } from 'next/server'
import { db } from '@sim/db'
import { templatePurchases } from '@sim/db/schema'
import { getSession } from '@/lib/auth'
import { createLogger } from '@sim/logger'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger('TemplatePurchase')

const PurchaseSchema = z.object({
    transactionHash: z.string().optional(),
    amount: z.string().optional(),
})

/**
 * POST /api/templates/[id]/purchase
 * Record a template purchase after successful x402 payment
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getSession()
        const userId = session?.user?.id

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: templateId } = await params
        const body = await request.json()
        const validatedData = PurchaseSchema.parse(body)

        // Create purchase record
        const purchase = await db.insert(templatePurchases).values({
            id: uuidv4(),
            userId,
            templateId,
            transactionHash: validatedData.transactionHash,
            amount: validatedData.amount,
        }).returning()

        logger.info('Template purchase recorded', {
            userId,
            templateId,
            purchaseId: purchase[0].id,
            transactionHash: validatedData.transactionHash,
        })

        return NextResponse.json({
            success: true,
            purchase: purchase[0],
        })
    } catch (error: any) {
        logger.error('Error recording template purchase:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
