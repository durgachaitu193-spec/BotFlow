import { UniswapIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { UniswapResponse } from '@/tools/uniswap/types'

export const UniswapBlock: BlockConfig<UniswapResponse> = {
  type: 'uniswap',
  name: 'Uniswap',
  description: 'Interact with Uniswap DEX for token swaps and price data',
  longDescription:
    'Integrate Uniswap into the workflow. Can get token price, get token info, get pool info, get swap quote, and execute token swaps.',
  docsLink: 'https://docs.sim.ai/tools/uniswap',
  category: 'tools',
  bgColor: '#FF007A',
  icon: UniswapIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Get Token Price', id: 'uniswap_get_price' },
        { label: 'Get Token Info', id: 'uniswap_get_token_info' },
        { label: 'Get Pool Info', id: 'uniswap_get_pool_info' },
        { label: 'Get Swap Quote', id: 'uniswap_get_quote' },
        { label: 'Swap Tokens', id: 'uniswap_swap' },
      ],
      value: () => 'uniswap_get_price',
    },
    // Get Token Price operation inputs
    {
      id: 'tokenAddress',
      title: 'Token Address',
      type: 'short-input',
      placeholder: 'Enter token contract address (e.g., 0x...)',
      condition: { field: 'operation', value: 'uniswap_get_price' },
      required: true,
    },
    {
      id: 'chainId',
      title: 'Chain ID',
      type: 'short-input',
      placeholder: '1 (Ethereum), 137 (Polygon), etc.',
      condition: { field: 'operation', value: 'uniswap_get_price' },
    },
    // Get Token Info operation inputs
    {
      id: 'tokenAddress',
      title: 'Token Address',
      type: 'short-input',
      placeholder: 'Enter token contract address (e.g., 0x...)',
      condition: { field: 'operation', value: 'uniswap_get_token_info' },
      required: true,
    },
    {
      id: 'chainId',
      title: 'Chain ID',
      type: 'short-input',
      placeholder: '1 (Ethereum), 137 (Polygon), etc.',
      condition: { field: 'operation', value: 'uniswap_get_token_info' },
    },
    // Get Pool Info operation inputs
    {
      id: 'token0Address',
      title: 'Token 0 Address',
      type: 'short-input',
      placeholder: 'Enter first token contract address',
      condition: { field: 'operation', value: 'uniswap_get_pool_info' },
      required: true,
    },
    {
      id: 'token1Address',
      title: 'Token 1 Address',
      type: 'short-input',
      placeholder: 'Enter second token contract address',
      condition: { field: 'operation', value: 'uniswap_get_pool_info' },
      required: true,
    },
    {
      id: 'feeTier',
      title: 'Fee Tier',
      type: 'short-input',
      placeholder: '500, 3000, or 10000',
      condition: { field: 'operation', value: 'uniswap_get_pool_info' },
    },
    {
      id: 'chainId',
      title: 'Chain ID',
      type: 'short-input',
      placeholder: '1 (Ethereum), 137 (Polygon), etc.',
      condition: { field: 'operation', value: 'uniswap_get_pool_info' },
    },
    // Get Swap Quote operation inputs
    {
      id: 'tokenInAddress',
      title: 'Token In Address',
      type: 'short-input',
      placeholder: 'Enter input token contract address',
      condition: { field: 'operation', value: 'uniswap_get_quote' },
      required: true,
    },
    {
      id: 'tokenOutAddress',
      title: 'Token Out Address',
      type: 'short-input',
      placeholder: 'Enter output token contract address',
      condition: { field: 'operation', value: 'uniswap_get_quote' },
      required: true,
    },
    {
      id: 'amount',
      title: 'Amount',
      type: 'short-input',
      placeholder: 'Enter amount to swap',
      condition: { field: 'operation', value: 'uniswap_get_quote' },
      required: true,
    },
    {
      id: 'chainId',
      title: 'Chain ID',
      type: 'short-input',
      placeholder: '1 (Ethereum), 137 (Polygon), etc.',
      condition: { field: 'operation', value: 'uniswap_get_quote' },
    },
    // Swap Tokens operation inputs
    {
      id: 'tokenInAddress',
      title: 'Token In Address',
      type: 'short-input',
      placeholder: 'Enter input token contract address',
      condition: { field: 'operation', value: 'uniswap_swap' },
      required: true,
    },
    {
      id: 'tokenOutAddress',
      title: 'Token Out Address',
      type: 'short-input',
      placeholder: 'Enter output token contract address',
      condition: { field: 'operation', value: 'uniswap_swap' },
      required: true,
    },
    {
      id: 'amount',
      title: 'Amount',
      type: 'short-input',
      placeholder: 'Enter amount to swap',
      condition: { field: 'operation', value: 'uniswap_swap' },
      required: true,
    },
    {
      id: 'recipient',
      title: 'Recipient Address',
      type: 'short-input',
      placeholder: 'Enter recipient wallet address',
      condition: { field: 'operation', value: 'uniswap_swap' },
      required: true,
    },
    {
      id: 'slippageTolerance',
      title: 'Slippage Tolerance (%)',
      type: 'short-input',
      placeholder: '0.5',
      condition: { field: 'operation', value: 'uniswap_swap' },
    },
    {
      id: 'chainId',
      title: 'Chain ID',
      type: 'short-input',
      placeholder: '1 (Ethereum), 137 (Polygon), etc.',
      condition: { field: 'operation', value: 'uniswap_swap' },
    },
  ],
  tools: {
    access: [
      'uniswap_get_price',
      'uniswap_get_token_info',
      'uniswap_get_pool_info',
      'uniswap_get_quote',
      'uniswap_swap',
    ],
    config: {
      tool: (params) => {
        // Convert numeric fields to numbers
        if (params.chainId) {
          params.chainId = Number(params.chainId)
        }
        if (params.feeTier) {
          params.feeTier = Number(params.feeTier)
        }
        if (params.amount) {
          params.amount = params.amount.toString()
        }
        if (params.slippageTolerance) {
          params.slippageTolerance = Number(params.slippageTolerance)
        }

        switch (params.operation) {
          case 'uniswap_get_price':
            return 'uniswap_get_price'
          case 'uniswap_get_token_info':
            return 'uniswap_get_token_info'
          case 'uniswap_get_pool_info':
            return 'uniswap_get_pool_info'
          case 'uniswap_get_quote':
            return 'uniswap_get_quote'
          case 'uniswap_swap':
            return 'uniswap_swap'
          default:
            return 'uniswap_get_price'
        }
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    // Get Token Price & Token Info operations
    tokenAddress: { type: 'string', description: 'Token contract address' },
    // Get Pool Info operation
    token0Address: { type: 'string', description: 'First token contract address' },
    token1Address: { type: 'string', description: 'Second token contract address' },
    feeTier: { type: 'number', description: 'Pool fee tier (500, 3000, or 10000)' },
    // Get Quote & Swap operations
    tokenInAddress: { type: 'string', description: 'Input token contract address' },
    tokenOutAddress: { type: 'string', description: 'Output token contract address' },
    amount: { type: 'string', description: 'Amount to swap' },
    // Swap operation
    recipient: { type: 'string', description: 'Recipient wallet address' },
    slippageTolerance: { type: 'number', description: 'Slippage tolerance percentage' },
    // Common
    chainId: { type: 'number', description: 'Blockchain network chain ID' },
  },
  outputs: {
    // Get Token Price output
    price: { type: 'json', description: 'Token price data' },
    // Get Token Info output
    tokenInfo: { type: 'json', description: 'Token information data' },
    // Get Pool Info output
    poolInfo: { type: 'json', description: 'Pool information data' },
    // Get Quote output
    quote: { type: 'json', description: 'Swap quote data' },
    // Swap output
    swapResult: { type: 'json', description: 'Swap transaction result' },
    transactionHash: { type: 'string', description: 'Transaction hash' },
  },
}

