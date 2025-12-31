import { db } from '@sim/db'
import { launchpadTokens } from '@sim/db/schema'
import { desc, eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import { DEFAULT_PAGE_NUMBER, PAGINATION_LISTING_LIMIT } from '@/global/constants'
import { APIError } from '@/global/exceptions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export const GET = withErrorHandling(async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (id) {
      const token = await db.query.launchpadTokens.findFirst({
        where: eq(launchpadTokens.id, id),
      })

      if (!token) {
        return NextResponse.json({ tokens: [] }, { status: StatusCodes.OK })
      }

      return NextResponse.json(
        {
          tokens: [
            {
              id: token.id,
              symbol: token.symbol,
              supply: token.supply,
              reserveBalance: token.reserveBalance,
              price: token.currentPrice,
              createdAt: token.createdAt,
              logo: token.logo,
              description: token.description,
              name: token.name,
              createdBy: token.createdBy,
              tradeDisabled: token.tradeDisabled,
              hydradxId: null, // Add if needed
              twitter: token.twitter,
              telegram: token.telegram,
              website: token.website,
              ethereumAddress: token.createdBy, // Assuming this maps to createdBy or another field
            },
          ],
        },
        { status: StatusCodes.OK }
      )
    }

    const page = Number(req.nextUrl.searchParams.get('_page') || DEFAULT_PAGE_NUMBER)
    const limit = Number(req.nextUrl.searchParams.get('_limit') || PAGINATION_LISTING_LIMIT)

    if (Number.isNaN(Number(page)) || Number.isNaN(Number(limit))) {
      throw new APIError(
        ERROR_CODES.INVALID_PARAMS_ERROR,
        StatusCodes.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_PARAMS_ERROR
      )
    }

    const tokensList = await db.query.launchpadTokens.findMany({
      orderBy: [desc(launchpadTokens.createdAt)],
      limit: limit,
      offset: (page - 1) * limit,
    })

    const tokens = tokensList.map((token) => {
      return {
        id: token.id,
        symbol: token.symbol,
        supply: token.supply,
        reserveBalance: token.reserveBalance,
        price: token.currentPrice,
        createdAt: token.createdAt,
        logo: token.logo,
        description: token.description,
        name: token.name,
        createdBy: token.createdBy,
        tradeDisabled: token.tradeDisabled,
      }
    })

    return NextResponse.json({ tokens }, { status: StatusCodes.OK })
  } catch (error) {
    return NextResponse.json({ tokens: [], error }, { status: StatusCodes.OK })
  }
})
