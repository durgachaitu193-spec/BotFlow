import { db } from '@wazabi/db'
import { templateCreators, templatePurchases, templates } from '@wazabi/db/schema'
import { createLogger } from '@wazabi/logger'
import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const logger = createLogger('TemplateCheckAccess')

/**
 * GET /api/templates/[id]/check-access
 * Check if user has access to use a template
 * Returns: { hasAccess: boolean, isCreator: boolean, requiresPayment: boolean }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: templateId } = await params

    // 1. Fetch template with creator info
    const templateResult = await db
      .select({
        id: templates.id,
        creatorId: templates.creatorId,
        creator: templateCreators,
      })
      .from(templates)
      .leftJoin(templateCreators, eq(templates.creatorId, templateCreators.id))
      .where(eq(templates.id, templateId))
      .limit(1)

    if (templateResult.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateResult[0]

    // 2. Check if user is the creator
    const isCreator =
      template.creator?.referenceType === 'user' && template.creator?.referenceId === userId

    if (isCreator) {
      logger.info('User is template creator, granting free access', {
        userId,
        templateId,
      })
      return NextResponse.json({
        hasAccess: true,
        isCreator: true,
        requiresPayment: false,
      })
    }

    // 3. Check if user has already purchased
    const purchase = await db.query.templatePurchases.findFirst({
      where: and(
        eq(templatePurchases.userId, userId),
        eq(templatePurchases.templateId, templateId)
      ),
    })

    if (purchase) {
      logger.info('User has already purchased template', {
        userId,
        templateId,
        purchaseId: purchase.id,
      })
      return NextResponse.json({
        hasAccess: true,
        isCreator: false,
        requiresPayment: false,
      })
    }

    // 4. User needs to pay
    logger.info('User requires payment to access template', {
      userId,
      templateId,
    })
    return NextResponse.json({
      hasAccess: false,
      isCreator: false,
      requiresPayment: true,
    })
  } catch (error: any) {
    logger.error('Error checking template access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
