import { db } from '@wazabi/db'
import { launchpadTransactions } from '@wazabi/db/schema'
import { desc, eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'

export const GET = withErrorHandling(async (req: NextRequest) => {
  const tokenId = req.nextUrl.searchParams.get('tokenId')

  if (tokenId) {
    const transactions = await db.query.launchpadTransactions.findMany({
      where: eq(launchpadTransactions.tokenId, tokenId),
      orderBy: [desc(launchpadTransactions.createdAt)],
    })
    return NextResponse.json({ transactions }, { status: StatusCodes.OK })
  }
  const transactions = await db.query.launchpadTransactions.findMany({
    orderBy: [desc(launchpadTransactions.createdAt)],
    limit: 10,
  })
  return NextResponse.json({ transactions }, { status: StatusCodes.OK })
})
