import type { ToolConfig } from '@/tools/types'
import type {
  UniswapGetQuoteParams,
  UniswapGetQuoteResponse,
} from '@/tools/uniswap/types'

export const getQuoteTool: ToolConfig<UniswapGetQuoteParams, UniswapGetQuoteResponse> =
  {
    id: 'uniswap_get_quote',
    name: 'Uniswap Get Swap Quote',
    description: 'Get a quote for swapping tokens on Uniswap.',
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
      chainId: {
        type: 'number',
        required: false,
        visibility: 'user-or-llm',
        description: 'Chain ID (default: 1 for Ethereum mainnet)',
      },
    },

    request: {
      url: (params: UniswapGetQuoteParams) => {
        const chainId = params.chainId || 1
        // TODO: Implement actual Uniswap API endpoint
        return `https://api.uniswap.org/v1/quote?tokenIn=${params.tokenInAddress}&tokenOut=${params.tokenOutAddress}&amount=${params.amount}&chainId=${chainId}`
      },
      method: 'GET',
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    },

    transformResponse: async (response: Response) => {
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get swap quote')
      }

      return {
        success: true,
        output: {
          quote: {
            quote: data.quote || '0',
            amountIn: data.amountIn || '0',
            amountOut: data.amountOut || '0',
            priceImpact: data.priceImpact || '0',
            route: data.route || [],
            chainId: data.chainId || 1,
          },
        },
      }
    },

    outputs: {
      quote: {
        type: 'object',
        description: 'Swap quote data',
        properties: {
          quote: { type: 'string', description: 'Quote amount' },
          amountIn: { type: 'string', description: 'Input amount' },
          amountOut: { type: 'string', description: 'Output amount' },
          priceImpact: { type: 'string', description: 'Price impact percentage' },
          route: { type: 'array', description: 'Swap route' },
          chainId: { type: 'number', description: 'Chain ID' },
        },
      },
    },
  }

