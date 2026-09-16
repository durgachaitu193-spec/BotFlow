import { db } from '@botflow/db'
import { launchpadTokens, launchpadTransactions } from '@botflow/db/schema'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { getBody } from '@/api/v1/utils/getBody'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { INITIAL_TOKEN_PRICE } from '@/global/constants'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

/**
 * Update token record after creation on blockchain (client-side)
 * This endpoint is called after the frontend has created the token on TokenFactory
 * It updates the database with the token address and transaction hash
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { id, txHash, tokenAddress } = await getBody(req)

  if (!id || !txHash) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      'Missing required parameters: id, txHash'
    )
  }

  // Get token data from database
  const tokenData = await db.query.launchpadTokens.findFirst({
    where: eq(launchpadTokens.id, id),
  })

  if (!tokenData) {
    throw new APIError(
      ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
      StatusCodes.NOT_FOUND,
      ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
    )
  }

  try {
    // Update database in a transaction
    await db.transaction(async (tx) => {
      // Update token record
      await tx
        .update(launchpadTokens)
        .set({
          active: true,
          txHash: txHash,
          tokenAddress: tokenAddress || '',
          currentPrice: INITIAL_TOKEN_PRICE.toString(),
          updatedAt: new Date(),
        })
        .where(eq(launchpadTokens.id, id))

      // Create transaction record
      const existingTx = await tx.query.launchpadTransactions.findFirst({
        where: eq(launchpadTransactions.txHash, txHash),
      })

      if (!existingTx) {
        await tx.insert(launchpadTransactions).values({
          txHash: txHash,
          tokenId: id,
          symbol: tokenData.symbol,
          amount: '0',
          value: '0',
          currentPrice: INITIAL_TOKEN_PRICE.toString(),
          type: 'created',
          from: tokenData.createdBy,
          to: tokenAddress || tokenData.createdBy,
        })
      }
    })

    return NextResponse.json(
      {
        message: 'success',
        tokenAddress,
        txHash,
      },
      { status: StatusCodes.OK }
    )
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Error updating token:', error)
    return NextResponse.json(
      {
        message: 'failed',
        error: error.message || 'Failed to update token',
      },
      { status: StatusCodes.BAD_REQUEST }
    )
  }
})
