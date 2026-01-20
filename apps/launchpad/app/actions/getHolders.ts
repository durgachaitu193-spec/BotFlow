'use server'

import { db } from '@wazabi/db'
import { launchpadHoldings, launchpadTokens } from '@wazabi/db/schema'
import { desc, eq } from 'drizzle-orm'

export interface Holder {
  address: string
  percentage: string
  balance: string
  isBondingCurve: boolean
}

export async function getHolders(tokenId: string): Promise<Holder[]> {
  try {
    // 1. Get Token Supply
    const token = await db.query.launchpadTokens.findFirst({
      where: eq(launchpadTokens.id, tokenId),
      columns: {
        supply: true,
        network: true, // might be useful later
      },
    })

    if (!token || !token.supply) {
      return []
    }

    const totalSupply = BigInt(token.supply)
    if (totalSupply === BigInt(0)) return []

    // 2. Get Holdings
    const holdings = await db.query.launchpadHoldings.findMany({
      where: eq(launchpadHoldings.tokenId, tokenId),
      orderBy: [desc(launchpadHoldings.balance)],
      limit: 20, // Get top 20
    })

    // 3. Calculate Percentages and format
    const formattedHolders: Holder[] = holdings.map((h) => {
      const balance = BigInt(h.balance)
      // Calculate percentage with 2 decimal places
      // (balance * 10000 / totalSupply) / 100
      const percentageVal = Number((balance * BigInt(10000)) / totalSupply) / 100

      return {
        address: h.walletAddress,
        percentage: `${percentageVal.toFixed(2)}%`,
        balance: h.balance,
        isBondingCurve: false, // Logic to determine if it's a bonding curve/pool address can be added later
      }
    })

    return formattedHolders
  } catch (error) {
    console.error('Error fetching holders:', error)
    return []
  }
}
