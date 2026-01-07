import type { ToolConfig } from '@/tools/types'
import type { UniswapSwapParams, UniswapSwapResponse } from '@/tools/uniswap/types'

export const swapTool: ToolConfig<UniswapSwapParams, UniswapSwapResponse> = {
  id: 'uniswap_swap',
  name: 'Uniswap Swap Tokens',
  description: 'Execute a token swap on Uniswap.',
  version: '1.0.0',

  params: {
    tokenInAddress: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Input token contract address',
    },
    tokenOutAddress: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Output token contract address',
    },
    amount: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Amount to swap',
    },
    recipient: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Recipient wallet address',
    },
    slippageTolerance: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Slippage tolerance percentage (default: 0.5)',
    },
    chainId: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Chain ID (default: 1 for Ethereum mainnet)',
    },
  },

  request: {
    url: () => {
      // TODO: Implement actual Uniswap API endpoint
      return 'https://api.uniswap.org/v1/swap'
    },
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: UniswapSwapParams) => {
      return JSON.stringify({
        tokenIn: params.tokenInAddress,
        tokenOut: params.tokenOutAddress,
        amount: params.amount,
        recipient: params.recipient,
        slippageTolerance: params.slippageTolerance || 0.5,
        chainId: params.chainId || 1,
      })
    },
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to execute swap')
    }

    return {
      success: true,
      output: {
        swapResult: {
          transactionHash: data.transactionHash || '',
          amountIn: data.amountIn || '',
          amountOut: data.amountOut || '',
          recipient: data.recipient || '',
          chainId: data.chainId || 1,
          timestamp: new Date().toISOString(),
        },
        transactionHash: data.transactionHash || '',
      },
    }
  },

  outputs: {
    swapResult: {
      type: 'object',
      description: 'Swap transaction result',
      properties: {
        transactionHash: { type: 'string', description: 'Transaction hash' },
        amountIn: { type: 'string', description: 'Input amount' },
        amountOut: { type: 'string', description: 'Output amount' },
        recipient: { type: 'string', description: 'Recipient address' },
        chainId: { type: 'number', description: 'Chain ID' },
        timestamp: { type: 'string', description: 'Transaction timestamp' },
      },
    },
    transactionHash: {
      type: 'string',
      description: 'Transaction hash',
    },
  },
}
