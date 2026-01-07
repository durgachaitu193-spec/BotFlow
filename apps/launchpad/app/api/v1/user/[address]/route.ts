import { db } from '@sim/db'
import { launchpadHoldings } from '@sim/db/schema'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { address = '' } = params

  if (!address) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  const holdingsList = await db.query.launchpadHoldings.findMany({
    where: eq(launchpadHoldings.walletAddress, address as string),
  })

  if (!holdingsList || holdingsList.length === 0) {
    throw new APIError(
      ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
      StatusCodes.NOT_FOUND,
      ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
    )
  }

  const userHoldings: Record<string, string> = {}
  holdingsList.forEach((h) => {
    userHoldings[h.tokenId] = h.balance
  })

  const data = {
    id: address,
    userHoldings,
  }

  return NextResponse.json({ holdings: data }, { status: StatusCodes.OK })
})
