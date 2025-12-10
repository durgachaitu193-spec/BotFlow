export const tokenAbiViem = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'version',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'authorizationState',
    stateMutability: 'view',
    inputs: [
      { name: 'authorizer', type: 'address' },
      { name: 'nonce', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const

export const facilitatorAbiViem = [
  {
    type: 'function',
    name: 'getNonce',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

export type SupportedToken = {
  symbol: 'USDT' | 'USDC' | 'ASTER' | 'BNB' | 'ETH'
  address: `0x${string}`
  chainId: number
}

export const BNB_TOKENS: SupportedToken[] = [
  {
    symbol: 'USDT',
    address: '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`,
    chainId: 56,
  },
  {
    symbol: 'USDC',
    address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' as `0x${string}`,
    chainId: 56,
  },
  {
    symbol: 'ASTER',
    address: '0x000ae314e2a2172a039b26378814c252734f556a' as `0x${string}`,
    chainId: 56,
  },
  {
    symbol: 'BNB',
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    chainId: 56,
  },
]

export const BASE_TOKENS: SupportedToken[] = [
  {
    symbol: 'USDT',
    address: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2' as `0x${string}`,
    chainId: 8453,
  },
  {
    symbol: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    chainId: 8453,
  },
  {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    chainId: 8453,
  },
]

export const ETHEREUM_TOKENS: SupportedToken[] = [
  {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    chainId: 1,
  },
]

export const SUPPORTED_TOKENS: SupportedToken[] = [...BNB_TOKENS]

export const SUPPORTED_SYMBOLS = Array.from(
  new Set(SUPPORTED_TOKENS.map((t) => t.symbol))
) as SupportedToken['symbol'][]

export function getTokensByChainId(chainId: number): SupportedToken[] {
  if (chainId === 56) return BNB_TOKENS
  // if (chainId === 8453) return BASE_TOKENS
  // if (chainId === 1) return ETHEREUM_TOKENS
  return []
}
