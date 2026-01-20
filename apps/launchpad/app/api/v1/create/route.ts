import { db } from '@wazabi/db'
import { launchpadTokens } from '@wazabi/db/schema'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { getBody } from '@/api/v1/utils/getBody'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const POST = withErrorHandling(async (req: NextRequest) => {
  const {
    name,
    symbol,
    description,
    logo,
    id,
    ipfsHash,
    twitter = '',
    telegram = '',
    website = '',
    network,
    address,
  } = await getBody(req)

  if (!id || !name || !symbol || !description || !logo || !network || !address) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  try {
    // Check if token already exists
    const existingToken = await db.query.launchpadTokens.findFirst({
      where: eq(launchpadTokens.id, id),
    })

    if (existingToken?.active) {
      throw new APIError(
        ERROR_CODES.TOKEN_ALREADY_EXISTS_ERROR,
        StatusCodes.BAD_REQUEST,
        ERROR_MESSAGES.TOKEN_ALREADY_EXISTS_ERROR
      )
    }

    await db
      .insert(launchpadTokens)
      .values({
        id,
        name,
        symbol,
        description,
        logo,
        ipfsHash: ipfsHash || '',
        twitter,
        telegram,
        website,
        network,
        createdBy: address,
        supply: '0',
        reserveBalance: '0',
        active: false,
        currentPrice: '0',
        tradeDisabled: false,
      })
      .onConflictDoUpdate({
        target: launchpadTokens.id,
        set: {
          name,
          symbol,
          description,
          logo,
          ipfsHash: ipfsHash || '',
          twitter,
          telegram,
          website,
          network,
          createdBy: address,
        },
      })

    return NextResponse.json({ message: 'success', id }, { status: StatusCodes.OK })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'error' }, { status: StatusCodes.BAD_REQUEST })
  }
})
