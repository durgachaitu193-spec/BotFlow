import { db } from '@sim/db'
import { launchpadHoldings } from '@sim/db/schema'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const GET = withErrorHandling(async (req: NextRequest) => {
  const tokenId = req.nextUrl.searchParams.get('tokenId')

  if (!tokenId) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  const holdingsList = await db.query.launchpadHoldings.findMany({
    where: eq(launchpadHoldings.tokenId, tokenId),
  })

  const holdings: Record<string, number> = {}
  holdingsList.forEach((h) => {
    holdings[h.walletAddress] = Number(h.balance)
  })

  return NextResponse.json({ holdings }, { status: StatusCodes.OK })
})
