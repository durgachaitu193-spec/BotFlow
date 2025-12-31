import {
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  parseEther,
} from 'viem'
import { createLogger } from '@/lib/logs/console/logger'
import { DEFAULT_CHAIN } from './didRegistry'

const logger = createLogger('TokenFactory')

export const TOKEN_FACTORY_ADDRESS = '0xb0ba7A078728966224dB6bdc9647bF8b68b3C1e0'

export const TOKEN_FACTORY_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'tokenAddress', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'string', name: 'symbol', type: 'string' },
      { indexed: false, internalType: 'string', name: 'ipfsHash', type: 'string' },
    ],
    name: 'TokenCreated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'MINTING_FEE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenCreationFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTokenCreationFee',
    outputs: [{ internalType: 'uint256', name: 'fee', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'buytoken',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'calculateTotalCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'calculateTotalSellingCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'tokenName', type: 'string' },
      { internalType: 'string', name: 'tokenSymbol', type: 'string' },
      { internalType: 'string', name: 'tokenIpfsHash', type: 'string' },
    ],
    name: 'createToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
    ],
    name: 'debugTokenLookup',
    outputs: [
      { internalType: 'bool', name: 'exists', type: 'bool' },
      { internalType: 'address', name: 'foundAddress', type: 'address' },
      { internalType: 'string', name: 'foundName', type: 'string' },
      { internalType: 'string', name: 'foundSymbol', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokenInformation',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'string', name: 'ipfsHash', type: 'string' },
        ],
        internalType: 'struct TokenFactory.TokenDetails[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
    ],
    name: 'getTokenAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTokenCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'tokenAddress', type: 'address' }],
    name: 'getTokenDetails',
    outputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
    ],
    name: 'getUserTokenBalance',
    outputs: [
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'string', name: 'message', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'selltoken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'tokenInfo',
    outputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

/**
 * Get the minting fee from the TokenFactory contract
 */
export async function getMintingFee(chain: Chain = DEFAULT_CHAIN): Promise<bigint> {
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    })

    const fee = await publicClient.readContract({
      address: TOKEN_FACTORY_ADDRESS as `0x${string}`,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'MINTING_FEE',
    })

    return fee as bigint
  } catch (error: any) {
    logger.error('Error getting minting fee:', error)
    // Default to 0.001 BNB if we can't read from contract
    return parseEther('0.001')
  }
}

/**
 * Check if a token already exists
 */
export async function checkTokenExists(
  tokenName: string,
  tokenSymbol: string,
  chain: Chain = DEFAULT_CHAIN
): Promise<{ exists: boolean; tokenAddress?: string }> {
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    })

    const result = await publicClient.readContract({
      address: TOKEN_FACTORY_ADDRESS as `0x${string}`,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'debugTokenLookup',
      args: [tokenName, tokenSymbol],
    })

    const [exists, foundAddress] = result as [boolean, string, string, string]

    return {
      exists,
      tokenAddress: exists ? foundAddress : undefined,
    }
  } catch (error: any) {
    logger.error('Error checking token existence:', error)
    return { exists: false }
  }
}

/**
 * Create a new token on the TokenFactory contract
 * @param walletAddress - The user's wallet address
 * @param tokenName - Name of the token
 * @param tokenSymbol - Symbol of the token
 * @param ipfsHash - IPFS hash for token metadata/image
 * @param provider - Ethereum provider (from Privy wallet)
 * @param chain - The chain to interact with (defaults to BSC_TESTNET)
 * @returns The token address and transaction hash if successful
 */
export async function createToken(
  walletAddress: string,
  tokenName: string,
  tokenSymbol: string,
  ipfsHash: string,
  provider: any,
  chain: Chain = DEFAULT_CHAIN
): Promise<{ tokenAddress: string; txHash: string } | null> {
  try {
    if (!provider) {
      throw new Error('Ethereum provider not available')
    }

    // Check if token already exists
    const { exists, tokenAddress: existingAddress } = await checkTokenExists(
      tokenName,
      tokenSymbol,
      chain
    )

    if (exists && existingAddress) {
      logger.info('Token already exists', { tokenAddress: existingAddress })
      return { tokenAddress: existingAddress, txHash: '' }
    }

    // Create wallet client
    const walletClient = createWalletClient({
      account: walletAddress as `0x${string}`,
      chain,
      transport: custom(provider),
    })

    // Create public client for waiting for transaction receipt
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    })

    // Check current network and switch if needed
    try {
      const currentChainId = await provider.request({ method: 'eth_chainId' })
      const currentChainIdNumber = Number.parseInt(currentChainId as string, 16)

      if (currentChainIdNumber !== chain.id) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chain.id.toString(16)}` }],
          })
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Chain not added, try to add it
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${chain.id.toString(16)}`,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcUrls.default.http,
                  blockExplorers: chain.blockExplorers
                    ? {
                        default: {
                          name: chain.blockExplorers.default.name,
                          url: chain.blockExplorers.default.url,
                        },
                      }
                    : undefined,
                },
              ],
            })
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            logger.warn(
              'Network switch failed, but proceeding with transaction on selected network RPC'
            )
          }
        }
      }
    } catch (error) {
      logger.warn('Could not check current network, proceeding with transaction')
    }

    // Get minting fee
    const mintingFee = await getMintingFee(chain)

    logger.info('Creating token', {
      tokenName,
      tokenSymbol,
      ipfsHash,
      mintingFee: mintingFee.toString(),
    })

    // Create token
    const hash = await walletClient.writeContract({
      address: TOKEN_FACTORY_ADDRESS as `0x${string}`,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'createToken',
      args: [tokenName, tokenSymbol, ipfsHash],
      value: mintingFee,
    })

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Extract token address from event logs
    let tokenAddress: string | null = null
    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: TOKEN_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === 'TokenCreated') {
            tokenAddress = decoded.args.tokenAddress as string
            break
          }
        } catch {
          // Not the event we're looking for, continue
        }
      }
    }

    if (!tokenAddress) {
      logger.warn('Could not extract token address from transaction receipt')
      // Try to get it from contract
      const { tokenAddress: fetchedAddress } = await checkTokenExists(tokenName, tokenSymbol, chain)
      if (fetchedAddress) {
        tokenAddress = fetchedAddress
      }
    }

    logger.info('Token created successfully', { tokenAddress, txHash: hash })

    return tokenAddress ? { tokenAddress, txHash: hash } : null
  } catch (error: any) {
    logger.error('Error creating token:', error)
    throw error
  }
}
