import { type NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_SYMBOLS, SUPPORTED_TOKENS } from '@/lib/x402-tokens'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TokenInfo = {
  symbol: string
  isNative?: boolean
  address?: `0x${string}`
  chainId?: number
}

const TOKEN_MAP: Record<string, TokenInfo> = Object.fromEntries(
  SUPPORTED_TOKENS.map((t) => [
    t.symbol,
    {
      symbol: t.symbol,
      address: t.address,
      chainId: t.chainId,
      isNative: t.address.toLowerCase() === '0x0000000000000000000000000000000000000000',
    },
  ])
)

function getGeckoTerminalNetwork(chainId: number): string | null {
  if (chainId === 56) return 'bsc'
  if (chainId === 8453) return 'base'
  if (chainId === 1) return 'eth'
  return null
}

function getWrappedAddress(symbol: string, chainId: number): `0x${string}` | null {
  if (symbol === 'BNB' && chainId === 56) {
    return '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' as `0x${string}`
  }
  if (symbol === 'ETH' && chainId === 8453) {
    return '0x4200000000000000000000000000000000000006' as `0x${string}`
  }
  if (symbol === 'ETH' && chainId === 1) {
    return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const list = (searchParams.get('tokens') || '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
    const symbols = list.length ? list : SUPPORTED_SYMBOLS
    const chainIdParam = searchParams.get('chainId')
    const chainId = chainIdParam ? Number(chainIdParam) : undefined

    const usdTarget = Number(process.env.NEXT_PUBLIC_X402_AMOUNT)

    const results: Record<string, { usd?: number }> = {}

    for (const sym of symbols) {
      if (sym === 'USDC' || sym === 'USDT') {
        results[sym] = { usd: 1 }
        continue
      }

      let info = TOKEN_MAP[sym]
      if (chainId && info) {
        const allTokens = SUPPORTED_TOKENS.filter((t) => t.symbol === sym)
        const chainToken = allTokens.find((t) => t.chainId === chainId)
        if (chainToken) {
          info = {
            symbol: chainToken.symbol,
            address: chainToken.address,
            chainId: chainToken.chainId,
            isNative:
              chainToken.address.toLowerCase() === '0x0000000000000000000000000000000000000000',
          }
        } else {
          continue
        }
      }
      if (!info?.address || !info.chainId) continue

      const network = getGeckoTerminalNetwork(info.chainId)
      if (!network) continue

      let addr = (info.address as string).toLowerCase()
      if (info.isNative && info.chainId) {
        const wrapped = getWrappedAddress(sym, info.chainId)
        if (wrapped) {
          addr = wrapped.toLowerCase()
        }
      }

      const url = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${addr}`
      try {
        const r = await fetch(url, { cache: 'no-store' })
        if (!r.ok) {
          // eslint-disable-next-line no-console
          console.warn(
            `[x402/prices] GeckoTerminal non-200 for ${sym} (${network}/${addr}): ${r.status}`
          )
          continue
        }
        const dj = (await r.json()) as {
          data?:
            | {
                attributes?: {
                  price_usd?: string
                }
              }
            | Array<{
                attributes?: {
                  price_usd?: string
                }
              }>
        }

        let priceStr: string | undefined
        if (Array.isArray(dj?.data)) {
          priceStr = dj.data[0]?.attributes?.price_usd
        } else {
          priceStr = dj?.data?.attributes?.price_usd
        }

        if (!priceStr) {
          // eslint-disable-next-line no-console
          console.warn(
            `[x402/prices] No price_usd found for ${sym} in response:`,
            JSON.stringify(dj, null, 2)
          )
          continue
        }

        const price = Number(priceStr)
        if (typeof price === 'number' && price > 0) {
          results[sym] = { usd: price }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[x402/prices] fetch error:', sym, e)
      }
    }

    return NextResponse.json({ usdTarget, prices: results })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[x402/prices] error:', e)
    return NextResponse.json({ error: 'failed to fetch prices' }, { status: 500 })
  }
}
