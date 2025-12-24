import type { ToolConfig } from '@/tools/types'
import type {
  UniswapGetPriceParams,
  UniswapGetPriceResponse,
} from '@/tools/uniswap/types'

export const getPriceTool: ToolConfig<UniswapGetPriceParams, UniswapGetPriceResponse> =
  {
    id: 'uniswap_get_price',
    name: 'Uniswap Get Token Price',
    description: 'Get the current price of a token on Uniswap.',
    version: '1.0.0',

    params: {
      tokenAddress: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'Token contract address',
      },
      chainId: {
        type: 'number',
        required: false,
        visibility: 'user-or-llm',
        description: 'Chain ID (default: 1 for Ethereum mainnet)',
      },
    },

    request: {
      url: (params: UniswapGetPriceParams) => {
        const chainId = params.chainId || 1
        // TODO: Implement actual Uniswap API endpoint
        return `https://api.uniswap.org/v1/price?token=${params.tokenAddress}&chainId=${chainId}`
      },
      method: 'GET',
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    },

    transformResponse: async (response: Response) => {
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get token price')
      }

      return {
        success: true,
        output: {
          price: {
            price: data.price || '0',
            tokenAddress: data.tokenAddress || '',
            chainId: data.chainId || 1,
            timestamp: new Date().toISOString(),
          },
        },
      }
    },

    outputs: {
      price: {
        type: 'object',
        description: 'Token price data',
        properties: {
          price: { type: 'string', description: 'Token price' },
          tokenAddress: { type: 'string', description: 'Token contract address' },
          chainId: { type: 'number', description: 'Chain ID' },
          timestamp: { type: 'string', description: 'Price timestamp' },
        },
      },
    },
  }

