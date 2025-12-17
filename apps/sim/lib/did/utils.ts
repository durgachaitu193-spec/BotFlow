import { type Chain, createPublicClient, http } from 'viem'
import {
  DID_REGISTRY_ABI,
  DID_REGISTRY_ADDRESS,
  USERNAME_REGISTRY_ABI,
  USERNAME_REGISTRY_ADDRESS,
} from '../contracts/didRegistry'

/**
 * Fetch DID for a wallet address
 */
export async function fetchDIDForAddress(
  address: string,
  chain: Chain
): Promise<{ did: string | null; username: string | null }> {
  if (!address) {
    return { did: null, username: null }
  }

  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    })

    // Get DID for the address
    const did = await publicClient.readContract({
      address: DID_REGISTRY_ADDRESS as `0x${string}`,
      abi: DID_REGISTRY_ABI,
      functionName: 'getDIDForAddress',
      args: [address as `0x${string}`],
    })

    const trimmedDID = (did as string).trim() || null

    // If DID exists, fetch the username
    let username: string | null = null
    if (trimmedDID) {
      try {
        const usernameResult = await publicClient.readContract({
          address: USERNAME_REGISTRY_ADDRESS as `0x${string}`,
          abi: USERNAME_REGISTRY_ABI,
          functionName: 'reverseLookup',
          args: [trimmedDID],
        })
        username = (usernameResult as string).trim() || null
      } catch (error) {
        console.error('Error fetching username:', error)
      }
    }

    return { did: trimmedDID, username }
  } catch (error) {
    console.error('Error fetching DID:', error)
    return { did: null, username: null }
  }
}

/**
 * Check if username is available (server-side only - use API route for client-side)
 */
export async function checkUsernameAvailability(username: string, chain: Chain): Promise<boolean> {
  if (!username.trim()) {
    return false
  }

  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    })

    const trimmedUsername = username.trim()

    const available = await publicClient.readContract({
      address: USERNAME_REGISTRY_ADDRESS as `0x${string}`,
      abi: USERNAME_REGISTRY_ABI,
      functionName: 'isAvailable',
      args: [trimmedUsername],
    })

    return available as boolean
  } catch (error) {
    console.error('Error checking username availability:', {
      error,
      username: username.trim(),
      chain: chain.name,
      contractAddress: USERNAME_REGISTRY_ADDRESS,
    })
    throw error
  }
}
