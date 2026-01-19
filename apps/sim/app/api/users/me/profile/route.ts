import { db } from '@wazabi/db'
import { user } from '@wazabi/db/schema'
import { createLogger } from '@wazabi/logger'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { generateRequestId } from '@/lib/core/utils/request'

const logger = createLogger('UpdateUserProfileAPI')

// UpdateProfileSchema
const UpdateProfileSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    image: z
      .string()
      .refine(
        (val) => {
          return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/api/')
        },
        { message: 'Invalid image URL' }
      )
      .optional(),
    userDID: z.string().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.image !== undefined || data.userDID !== undefined,
    {
      message: 'At least one field (name, image, or userDID) must be provided',
    }
  )

interface UpdateData {
  updatedAt: Date
  name?: string
  image?: string | null
  userDID?: string
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized profile update attempt`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const validatedData = UpdateProfileSchema.parse(body)

    const updateData: UpdateData = { updatedAt: new Date() }
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.image !== undefined) updateData.image = validatedData.image
    if (validatedData.userDID !== undefined) updateData.userDID = validatedData.userDID

    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning()

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    logger.info(`[${requestId}] User profile updated`, {
      userId,
      updatedFields: Object.keys(validatedData),
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        userDID: updatedUser.userDID,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn(`[${requestId}] Invalid profile data`, {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      )
    }

    logger.error(`[${requestId}] Profile update error`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch current user profile
export async function GET() {
  const requestId = generateRequestId()

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized profile fetch attempt`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const [userRecord] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        userDID: user.userDID,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: userRecord,
    })
  } catch (error: any) {
    logger.error(`[${requestId}] Profile fetch error`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
