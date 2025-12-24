// Common types for Uniswap tools
import type { ToolResponse } from '@/tools/types'

// Get Token Price tool types
export interface UniswapGetPriceParams {
  tokenAddress: string
  chainId?: number
}

export interface UniswapTokenPrice {
  price: string
  tokenAddress: string
  chainId: number
  timestamp: string
}

export interface UniswapGetPriceResponse extends ToolResponse {
  output: {
    price: UniswapTokenPrice
  }
}

// Get Token Info tool types
export interface UniswapGetTokenInfoParams {
  tokenAddress: string
  chainId?: number
}

export interface UniswapTokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI?: string
}

export interface UniswapGetTokenInfoResponse extends ToolResponse {
  output: {
    tokenInfo: UniswapTokenInfo
  }
}

// Get Pool Info tool types
export interface UniswapGetPoolInfoParams {
  token0Address: string
  token1Address: string
  feeTier?: number
  chainId?: number
}

export interface UniswapPoolInfo {
  address: string
  token0: UniswapTokenInfo
  token1: UniswapTokenInfo
  fee: number
  liquidity: string
  sqrtPriceX96: string
  tick: number
  chainId: number
}

export interface UniswapGetPoolInfoResponse extends ToolResponse {
  output: {
    poolInfo: UniswapPoolInfo
  }
}

// Get Swap Quote tool types
export interface UniswapGetQuoteParams {
  tokenInAddress: string
  tokenOutAddress: string
  amount: string
  chainId?: number
}

export interface UniswapQuote {
  quote: string
  amountIn: string
  amountOut: string
  priceImpact: string
  route: Array<{
    tokenIn: string
    tokenOut: string
    fee: number
  }>
  chainId: number
}

export interface UniswapGetQuoteResponse extends ToolResponse {
  output: {
    quote: UniswapQuote
  }
}

// Swap Tokens tool types
export interface UniswapSwapParams {
  tokenInAddress: string
  tokenOutAddress: string
  amount: string
  recipient: string
  slippageTolerance?: number
  chainId?: number
}

export interface UniswapSwapResult {
  transactionHash: string
  amountIn: string
  amountOut: string
  recipient: string
  chainId: number
  timestamp: string
}

export interface UniswapSwapResponse extends ToolResponse {
  output: {
    swapResult: UniswapSwapResult
    transactionHash: string
  }
}

export type UniswapResponse =
  | UniswapGetPriceResponse
  | UniswapGetTokenInfoResponse
  | UniswapGetPoolInfoResponse
  | UniswapGetQuoteResponse
  | UniswapSwapResponse

