import { db } from '@sim/db'
import { launchpadComments } from '@sim/db/schema'
import { desc, eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { getBody } from '@/api/v1/utils/getBody'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { tokenId } = await getBody(req)

  if (!tokenId) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  const commentsData = await db.query.launchpadComments.findMany({
    where: eq(launchpadComments.tokenId, tokenId),
    orderBy: [desc(launchpadComments.createdAt)],
  })

  return NextResponse.json(
    { message: 'success', comments: commentsData },
    { status: StatusCodes.OK }
  )
})
