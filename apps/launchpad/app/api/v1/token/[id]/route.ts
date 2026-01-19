import { db } from '@wazabi/db'
import { launchpadTokens } from '@wazabi/db/schema'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { getSubstrateAddressFromMnemonic } from '@/api/db/token/utils/getSubstrateAddressFromMemonic'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id = '' } = params

  if (!id) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  const token = await db.query.launchpadTokens.findFirst({
    where: eq(launchpadTokens.id, id as string),
  })

  if (!token) {
    throw new APIError(
      ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
      StatusCodes.NOT_FOUND,
      ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
    )
  }
  const substrateAddress = await getSubstrateAddressFromMnemonic(token.mnemonic || '')
  const data = {
    id: token.id,
    symbol: token.symbol,
    supply: token.supply,
    reserveBalance: token.reserveBalance,
    price: token.currentPrice,
    createdAt: token.createdAt,
    logo: token.logo,
    description: token.description,
    name: token.name,
    twitter: token.twitter,
    website: token.website,
    telegram: token.telegram,
    substrateAddress,
  }

  return NextResponse.json({ token: data }, { status: StatusCodes.OK })
})
