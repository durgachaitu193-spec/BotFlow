import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/x402/prices
 * Fetch current token prices for X402 payment
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tokensParam = searchParams.get('tokens')
        const chainId = searchParams.get('chainId')

        if (!tokensParam) {
            return NextResponse.json({ error: 'Missing tokens parameter' }, { status: 400 })
        }

        const symbols = tokensParam.split(',')

        // Fetch prices from CoinGecko API
        const coinGeckoIds: Record<string, string> = {
            BNB: 'binancecoin',
            USDT: 'tether',
            USDC: 'usd-coin',
            ETH: 'ethereum',
        }

        const ids = symbols
            .map((s) => coinGeckoIds[s.toUpperCase()])
            .filter(Boolean)
            .join(',')

        if (!ids) {
            return NextResponse.json({ error: 'No valid tokens' }, { status: 400 })
        }

        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
            {
                headers: {
                    Accept: 'application/json',
                },
                next: { revalidate: 60 }, // Cache for 60 seconds
            }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch prices from CoinGecko')
        }

        const data = await response.json()

        // Transform to symbol-based response
        const prices: Record<string, { usd: number }> = {}
        symbols.forEach((symbol) => {
            const id = coinGeckoIds[symbol.toUpperCase()]
            if (id && data[id]?.usd) {
                prices[symbol] = { usd: data[id].usd }
            }
        })

        // Get USD target from environment
        const usdTarget = Number(process.env.NEXT_PUBLIC_X402_AMOUNT || process.env.X402_AMOUNT || 0.75)

        return NextResponse.json({
            prices,
            usdTarget,
        })
    } catch (error: any) {
        console.error('Error fetching X402 prices:', error)
        return NextResponse.json(
            { error: 'Failed to fetch token prices', details: error.message },
            { status: 500 }
        )
    }
}
