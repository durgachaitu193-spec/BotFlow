// DID Registry Contract Configuration
export const DID_REGISTRY_ADDRESS = '0xE0579eB8cb426cD70743731Fdb94Aad2877C582D' as const

// Username Registry Contract Configuration
export const USERNAME_REGISTRY_ADDRESS = '0x9EFfBd00883006c36E146Eb2F4Ac7494498ea2C6' as const

// Binance Smart Chain Mainnet (BSC Mainnet)
export const BSC_MAINNET = {
  id: 56,
  name: 'BSC Mainnet',
  network: 'bsc',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
    public: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com',
    },
  },
  testnet: false,
} as const

// Binance Smart Chain Testnet (BSC Testnet)
export const BSC_TESTNET = {
  id: 97,
  name: 'BSC Testnet',
  network: 'bsc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
    public: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://testnet.bscscan.com',
    },
  },
  testnet: true,
} as const

// Default to testnet for now
export const DEFAULT_CHAIN = BSC_TESTNET

// Contract ABI for DID Registry
export const DID_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'createDID',
    inputs: [
      {
        name: 'walletAddress',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'username',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [
      {
        name: 'did',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getDIDForAddress',
    inputs: [
      {
        name: 'addr',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
] as const

// Contract ABI for UsernameRegistry
export const USERNAME_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'isAvailable',
    inputs: [
      {
        name: 'username',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'reverseLookup',
    inputs: [
      {
        name: 'did',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
] as const
