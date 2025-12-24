import type { ToolConfig } from '@/tools/types'
import type {
  UniswapGetPoolInfoParams,
  UniswapGetPoolInfoResponse,
} from '@/tools/uniswap/types'

export const getPoolInfoTool: ToolConfig<
  UniswapGetPoolInfoParams,
  UniswapGetPoolInfoResponse
> = {
  id: 'uniswap_get_pool_info',
  name: 'Uniswap Get Pool Info',
  description: 'Get information about a Uniswap pool.',
  version: '1.0.0',

  params: {
    token0Address: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'First token contract address',
    },
    token1Address: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Second token contract address',
    },
    feeTier: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pool fee tier (500, 3000, or 10000)',
    },
    chainId: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Chain ID (default: 1 for Ethereum mainnet)',
    },
  },

  request: {
    url: (params: UniswapGetPoolInfoParams) => {
      const chainId = params.chainId || 1
      const feeTier = params.feeTier || 3000
      // TODO: Implement actual Uniswap API endpoint
      return `https://api.uniswap.org/v1/pool?token0=${params.token0Address}&token1=${params.token1Address}&fee=${feeTier}&chainId=${chainId}`
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get pool info')
    }

    return {
      success: true,
      output: {
        poolInfo: {
          address: data.address || '',
          token0: data.token0 || { address: '', symbol: '', name: '', decimals: 18, chainId: 1 },
          token1: data.token1 || { address: '', symbol: '', name: '', decimals: 18, chainId: 1 },
          fee: data.fee || 3000,
          liquidity: data.liquidity || '0',
          sqrtPriceX96: data.sqrtPriceX96 || '0',
          tick: data.tick || 0,
          chainId: data.chainId || 1,
        },
      },
    }
  },

  outputs: {
    poolInfo: {
      type: 'object',
      description: 'Pool information data',
      properties: {
        address: { type: 'string', description: 'Pool contract address' },
        token0: { type: 'object', description: 'First token info' },
        token1: { type: 'object', description: 'Second token info' },
        fee: { type: 'number', description: 'Pool fee tier' },
        liquidity: { type: 'string', description: 'Pool liquidity' },
        sqrtPriceX96: { type: 'string', description: 'Pool price' },
        tick: { type: 'number', description: 'Pool tick' },
        chainId: { type: 'number', description: 'Chain ID' },
      },
    },
  },
}

