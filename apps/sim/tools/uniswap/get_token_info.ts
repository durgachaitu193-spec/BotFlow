import type { ToolConfig } from '@/tools/types'
import type { UniswapGetTokenInfoParams, UniswapGetTokenInfoResponse } from '@/tools/uniswap/types'

export const getTokenInfoTool: ToolConfig<UniswapGetTokenInfoParams, UniswapGetTokenInfoResponse> =
  {
    id: 'uniswap_get_token_info',
    name: 'Uniswap Get Token Info',
    description: 'Get information about a token on Uniswap.',
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
      url: (params: UniswapGetTokenInfoParams) => {
        const chainId = params.chainId || 1
        // TODO: Implement actual Uniswap API endpoint
        return `https://api.uniswap.org/v1/token?address=${params.tokenAddress}&chainId=${chainId}`
      },
      method: 'GET',
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    },

    transformResponse: async (response: Response) => {
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get token info')
      }

      return {
        success: true,
        output: {
          tokenInfo: {
            address: data.address || '',
            symbol: data.symbol || '',
            name: data.name || '',
            decimals: data.decimals || 18,
            chainId: data.chainId || 1,
            logoURI: data.logoURI,
          },
        },
      }
    },

    outputs: {
      tokenInfo: {
        type: 'object',
        description: 'Token information data',
        properties: {
          address: { type: 'string', description: 'Token contract address' },
          symbol: { type: 'string', description: 'Token symbol' },
          name: { type: 'string', description: 'Token name' },
          decimals: { type: 'number', description: 'Token decimals' },
          chainId: { type: 'number', description: 'Chain ID' },
          logoURI: { type: 'string', description: 'Token logo URI', optional: true },
        },
      },
    },
  }
