import { db } from '@sim/db'
import { templateCreators, templates } from '@sim/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const conditions = [eq(templates.status, 'approved')]
    if (id) {
      conditions.push(eq(templates.id, id))
    }

    const results = await db
      .select({
        id: templates.id,
        workflowId: templates.workflowId,
        name: templates.name,
        details: templates.details,
        creatorId: templates.creatorId,
        creator: templateCreators,
        views: templates.views,
        stars: templates.stars,
        status: templates.status,
        tags: templates.tags,
        requiredCredentials: templates.requiredCredentials,
        state: templates.state,
        createdAt: templates.createdAt,
        updatedAt: templates.updatedAt,
      })
      .from(templates)
      .leftJoin(templateCreators, eq(templates.creatorId, templateCreators.id))
      .where(and(...conditions))
      .orderBy(desc(templates.views), desc(templates.createdAt))

    if (id && results.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: id ? results[0] : results,
    })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
