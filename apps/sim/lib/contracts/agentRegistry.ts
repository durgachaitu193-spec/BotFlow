import {
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
} from 'viem'
import { createLogger } from '@/lib/logs/console/logger'
import {
  AGENT_IDENTITY_REGISTRY_ABI,
  AGENT_IDENTITY_REGISTRY_ADDRESS,
} from './agentIdentityRegistry'
import { DEFAULT_CHAIN } from './didRegistry'

const logger = createLogger('AgentRegistry')

/**
 * Register an agent in the AgentIdentityRegistry contract
 * Uses the new contract interface where the registry
 * creates the agent wallet, token, and returns agentId, agentDID, agentWallet, and tokenAddress.
 *
 * @param walletAddress - The user's wallet address (from Privy)
 * @param metadata - JSON string containing agent metadata
 * @param provider - Ethereum provider (from Privy wallet)
 * @param chain - The chain to interact with (defaults to BSC_TESTNET)
 * @param tokenName - Optional token name (required if tokenSymbol or tokenIpfsHash provided)
 * @param tokenSymbol - Optional token symbol (required if tokenName or tokenIpfsHash provided)
 * @param tokenIpfsHash - Optional IPFS hash for token image (required if tokenName or tokenSymbol provided)
 * @param deploymentState - Optional JSON string containing workflow blocks and triggers deployment state
 * @returns On-chain agent details if successful, null otherwise
 */
export async function registerAgent(
  walletAddress: string,
  metadata: string,
  provider: any,
  chain: Chain = DEFAULT_CHAIN,
  tokenName?: string,
  tokenSymbol?: string,
  tokenIpfsHash?: string,
  deploymentState?: string
): Promise<{
  agentId: bigint
  agentDID: string
  agentWallet: string
  tokenAddress?: string
  txHash: string
} | null> {
  try {
    if (!provider) {
      throw new Error('Ethereum provider not available')
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

    // Get token creation fee from the contract
    // The contract is payable and requires the fee to be sent as value
    let tokenCreationFee: bigint = 0n
    try {
      const fee = await publicClient.readContract({
        address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
        abi: AGENT_IDENTITY_REGISTRY_ABI,
        functionName: 'getTokenCreationFee',
      })
      tokenCreationFee = fee as bigint
      logger.info('Token creation fee retrieved', { fee: tokenCreationFee.toString() })
    } catch (error) {
      logger.error('Failed to get token creation fee', { error })
      throw new Error('Failed to get token creation fee. Please try again.')
    }

    // Register agent with token info
    // The contract now handles token creation and metadata update in a single transaction
    // Both registerAgent and registerAgentWithoutDID require all 5 parameters (including deploymentState)
    // Both functions are now payable and require the token creation fee as value
    const functionName = 'registerAgent' // Use registerAgent (with DID) by default
    const args: readonly [string, string, string, string, string] = [
      metadata,
      tokenName ?? '',
      tokenSymbol ?? '',
      tokenIpfsHash ?? '',
      deploymentState ?? '',
    ]

    const hash = await walletClient.writeContract({
      address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
      abi: AGENT_IDENTITY_REGISTRY_ABI,
      functionName,
      args,
      value: tokenCreationFee, // Send the token creation fee as value
    })

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Try to extract agent info from event logs
    let agentId: bigint | null = null
    let agentWalletFromEvent: string | null = null
    let agentDIDFromEvent: string | null = null
    let tokenAddressFromEvent: string | null = null
    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: AGENT_IDENTITY_REGISTRY_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === 'AgentRegistered') {
            // AgentRegistered event: agentId (indexed), agentWallet (indexed), ownerWallet (indexed), userDID, agentDID, metadata
            agentId = decoded.args.agentId as bigint
            agentWalletFromEvent = decoded.args.agentWallet as `0x${string}`
            agentDIDFromEvent = decoded.args.agentDID as string // agentDID is at index 4
            break
          }

          if (decoded.eventName === 'AgentTokenCreated') {
            // AgentTokenCreated event: agentId (indexed), tokenAddress (indexed), tokenName, tokenSymbol, ipfsHash
            tokenAddressFromEvent = decoded.args.tokenAddress as `0x${string}`
          }
        } catch (decodeError) {
          // Swallow and continue – we'll fall back to on-chain queries below if needed
          logger.warn('Failed to decode event log', { error: decodeError })
        }
      }
    }

    // Fallback: query registry if we couldn't parse logs
    if (!agentId || !agentWalletFromEvent) {
      try {
        logger.info('Falling back to on-chain lookup for agent info')

        // getAgentsByOwner(walletAddress) -> uint256[]
        const agentIdsForOwner = (await publicClient.readContract({
          address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
          abi: AGENT_IDENTITY_REGISTRY_ABI,
          functionName: 'getAgentsByOwner',
          args: [walletAddress as `0x${string}`],
        })) as bigint[]

        if (agentIdsForOwner.length > 0) {
          const latestId = agentIdsForOwner[agentIdsForOwner.length - 1]
          const agentInfo = (await publicClient.readContract({
            address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: AGENT_IDENTITY_REGISTRY_ABI,
            functionName: 'getAgent',
            args: [latestId],
          })) as {
            agentId: bigint
            agentWallet: `0x${string}`
            ownerWallet: `0x${string}`
            userDID: string
            agentDID: string
            metadata: string
            isActive: boolean
            registeredAt: bigint
            tokenAddress: `0x${string}`
            tokenName: string
            tokenSymbol: string
            tokenIpfsHash: string
            deploymentState: string
          }

          agentId = agentInfo.agentId
          agentWalletFromEvent = agentInfo.agentWallet
          agentDIDFromEvent = agentInfo.agentDID
          if (
            agentInfo.tokenAddress &&
            agentInfo.tokenAddress !== '0x0000000000000000000000000000000000000000'
          ) {
            tokenAddressFromEvent = agentInfo.tokenAddress
          }
        }
      } catch (lookupError) {
        logger.error('On-chain lookup for agent info failed', { error: lookupError })
      }
    }

    if (!agentId || !agentWalletFromEvent) {
      logger.warn('Could not extract agent info from transaction or on-chain lookup')
      return null
    }

    logger.info('Agent registered successfully', {
      agentId: agentId.toString(),
      agentWallet: agentWalletFromEvent,
      agentDID: agentDIDFromEvent,
      tokenAddress: tokenAddressFromEvent,
      txHash: hash,
    })

    return {
      agentId,
      agentWallet: agentWalletFromEvent,
      agentDID: agentDIDFromEvent || '',
      tokenAddress: tokenAddressFromEvent || undefined,
      txHash: hash,
    }
  } catch (error: any) {
    logger.error('Error registering agent:', error)
    throw error
  }
}

/**
 * Update agent metadata in the AgentIdentityRegistry contract
 * @param walletAddress - The user's wallet address (from Privy)
 * @param agentId - The agent ID to update
 * @param newMetadata - JSON string containing updated agent metadata
 * @param provider - Ethereum provider (from Privy wallet)
 * @param chain - The chain to interact with (defaults to BSC_TESTNET)
 * @returns The transaction hash if successful
 */
export async function updateAgentMetadata(
  walletAddress: string,
  agentId: string,
  newMetadata: string,
  provider: any,
  chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string } | null> {
  try {
    if (!provider) {
      throw new Error('Ethereum provider not available')
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

    // Update agent metadata
    const hash = await walletClient.writeContract({
      address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
      abi: AGENT_IDENTITY_REGISTRY_ABI,
      functionName: 'updateAgentMetadata',
      args: [BigInt(agentId), newMetadata],
    })

    // Wait for transaction receipt
    await publicClient.waitForTransactionReceipt({ hash })

    logger.info('Agent metadata updated successfully', { agentId, txHash: hash })

    return { txHash: hash }
  } catch (error: any) {
    logger.error('Error updating agent metadata:', error)
    throw error
  }
}

/**
 * Update agent deployment state in the AgentIdentityRegistry contract
 * @param walletAddress - The user's wallet address (from Privy)
 * @param agentId - The agent ID to update
 * @param newDeploymentState - JSON string containing updated deployment state (workflow blocks and triggers)
 * @param provider - Ethereum provider (from Privy wallet)
 * @param chain - The chain to interact with (defaults to BSC_TESTNET)
 * @returns The transaction hash if successful
 */
export async function updateDeploymentState(
  walletAddress: string,
  agentId: string,
  newDeploymentState: string,
  provider: any,
  chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string } | null> {
  try {
    if (!provider) {
      throw new Error('Ethereum provider not available')
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

    // Update agent deployment state
    const hash = await walletClient.writeContract({
      address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
      abi: AGENT_IDENTITY_REGISTRY_ABI,
      functionName: 'updateDeploymentState',
      args: [BigInt(agentId), newDeploymentState],
    })

    // Wait for transaction receipt
    await publicClient.waitForTransactionReceipt({ hash })

    logger.info('Agent deployment state updated successfully', { agentId, txHash: hash })

    return { txHash: hash }
  } catch (error: any) {
    logger.error('Error updating agent deployment state:', error)
    throw error
  }
}

/**
 * Get agent deployment state from the AgentIdentityRegistry contract
 * @param agentId - The agent ID to query
 * @param chain - The chain to interact with (defaults to BSC_TESTNET)
 * @returns The deployment state JSON string if successful, null otherwise
 */
export async function getDeploymentState(
  agentId: string,
  chain: Chain = DEFAULT_CHAIN
): Promise<string | null> {
  try {
    // Create public client for reading
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    })

    // Get deployment state
    const deploymentState = (await publicClient.readContract({
      address: AGENT_IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
      abi: AGENT_IDENTITY_REGISTRY_ABI,
      functionName: 'getDeploymentState',
      args: [BigInt(agentId)],
    })) as string

    logger.info('Agent deployment state retrieved successfully', { agentId })

    return deploymentState
  } catch (error: any) {
    logger.error('Error getting agent deployment state:', error)
    return null
  }
}
