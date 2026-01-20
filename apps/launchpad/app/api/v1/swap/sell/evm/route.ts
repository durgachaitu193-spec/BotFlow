import { BN } from '@polkadot/util'
import { db } from '@wazabi/db'
import { agent, launchpadHoldings, launchpadTokens, launchpadTransactions } from '@wazabi/db/schema'
import { and, eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { calculateTotalCost, calculateTotalSellingCost, SCALING_FACTOR } from '@/lib/bounding-curve'
import { getBody } from '@/api/v1/utils/getBody'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { INITIAL_TOKEN_PRICE } from '@/global/constants'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const POST = withErrorHandling(async (req: NextRequest) => {
  const {
    blockHash,
    txIndex,
    txHash,
    id: tokenId,
    amount: tokenCount,
    address,
  } = await getBody(req)

  const id = `${tokenId}`
  if (!txHash || !id || !tokenCount || !address || !blockHash || txIndex === undefined) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  let tokenData = await db.query.launchpadTokens.findFirst({
    where: eq(launchpadTokens.id, id),
  })

  if (!tokenData) {
    // If token not found in launchpadTokens, try to create it if it exists in agents table
    const agentData = await db.query.agent.findFirst({
      where: eq(agent.id, id),
    })

    if (agentData) {
      // Create launchpad token record
      await db.insert(launchpadTokens).values({
        id: id,
        name: (agentData.metadata as any)?.name || 'Unknown',
        symbol: (agentData.metadata as any)?.ticker || 'UNK',
        description: (agentData.metadata as any)?.description || '',
        logo: (agentData.metadata as any)?.image || '',
        network: 'bnb', // Defaulting to bnb as per current context
        createdBy: agentData.ownerWallet,
        supply: '0',
        reserveBalance: '0',
        currentPrice: INITIAL_TOKEN_PRICE.toString(),
        active: true,
        tradeDisabled: false,
      })

      // Re-fetch token data
      tokenData = await db.query.launchpadTokens.findFirst({
        where: eq(launchpadTokens.id, id),
      })
    }

    if (!tokenData) {
      throw new APIError(
        ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
        StatusCodes.NOT_FOUND,
        ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
      )
    }
  }

  try {
    await db.transaction(async (tx) => {
      const sellRequestedAmount = new BN(tokenCount.toString())

      const existingTx = await tx.query.launchpadTransactions.findFirst({
        where: eq(launchpadTransactions.txHash, txHash),
      })

      if (existingTx) {
        throw new APIError(
          ERROR_CODES.TRANSACTION_ALREADY_EXISTS_ERROR,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGES.TRANSACTION_ALREADY_EXISTS_ERROR
        )
      }

      const currentTokenData = await tx.query.launchpadTokens.findFirst({
        where: eq(launchpadTokens.id, id),
      })

      if (!currentTokenData) {
        throw new APIError(
          ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
          StatusCodes.NOT_FOUND,
          ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
        )
      }

      const { supply, reserveBalance, symbol, createdBy } = currentTokenData
      const currentSupply = new BN(supply).sub(sellRequestedAmount)

      if (currentSupply.lt(new BN('0'))) {
        throw new APIError(
          ERROR_CODES.INVALID_PARAMS_ERROR,
          StatusCodes.BAD_REQUEST,
          'Invalid supply amount.'
        )
      }

      const { cost: transferMoney, reserveBalance: newReserveBalance } = calculateTotalSellingCost(
        new BN(supply),
        new BN(tokenCount).div(SCALING_FACTOR),
        new BN(reserveBalance)
      )

      const { cost } = calculateTotalCost(currentSupply, new BN('1'), new BN(newReserveBalance))

      // Holdings
      const userHolding = await tx.query.launchpadHoldings.findFirst({
        where: and(eq(launchpadHoldings.walletAddress, address), eq(launchpadHoldings.tokenId, id)),
      })

      const oldHolding = new BN(userHolding?.balance || '0')
      const newHolding = oldHolding.sub(sellRequestedAmount)

      // Update Token
      await tx
        .update(launchpadTokens)
        .set({
          supply: currentSupply.toString(),
          reserveBalance: newReserveBalance.toString(),
          currentPrice: cost.toString(),
        })
        .where(eq(launchpadTokens.id, id))

      // Update Holdings
      await tx
        .insert(launchpadHoldings)
        .values({
          walletAddress: address,
          tokenId: id,
          balance: newHolding.toString(),
        })
        .onConflictDoUpdate({
          target: [launchpadHoldings.walletAddress, launchpadHoldings.tokenId],
          set: {
            balance: newHolding.toString(),
            updatedAt: new Date(),
          },
        })

      // Insert Transaction
      await tx.insert(launchpadTransactions).values({
        txHash: txHash,
        tokenId: id,
        symbol,
        amount: sellRequestedAmount.toString(),
        value: transferMoney.toString(),
        currentPrice: cost.toString(),
        type: 'sell',
        from: address,
        to: createdBy,
      })
    })

    return NextResponse.json({ message: 'success' }, { status: StatusCodes.OK })
  } catch (error) {
    console.log('Error during transaction: ', error)
    return NextResponse.json(
      { message: 'failed', error: error || 'Unknown error' },
      { status: StatusCodes.BAD_REQUEST }
    )
  }
})
