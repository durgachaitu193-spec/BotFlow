/**
 * Build metadata JSON for agent registration
 */
export interface AgentMetadata {
  workflowId: string
  workflowName?: string
  deploymentType: 'api' | 'chat'
  // Chat-specific fields
  chatIdentifier?: string
  chatTitle?: string
  chatDescription?: string
  chatAuthType?: 'public' | 'password' | 'email' | 'sso'
  chatUrl?: string
  // Agent token information
  tokenName?: string
  tokenSymbol?: string
  tokenAddress?: string
  tokenIpfsHash?: string
  // API-specific fields
  apiEndpoint?: string
  // Common fields
  deployedAt?: string
  [key: string]: any // Allow additional fields
}

/**
 * Build metadata JSON string for agent registration
 */
export function buildAgentMetadata(metadata: AgentMetadata): string {
  return JSON.stringify(metadata)
}

/**
 * Generate a unique dummy agent wallet address
 * Each agent needs a unique wallet address as per contract requirements
 * Uses cryptographically secure random number generation
 */
export function generateDummyAgentWallet(): `0x${string}` {
  // Generate 20 random bytes (40 hex characters) for the address
  const randomBytes = new Uint8Array(20)

  // crypto.getRandomValues is available in both browser and Node.js environments
  // In Next.js, it's available globally in both client and server contexts
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto
  if (cryptoObj && cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues(randomBytes)
  } else {
    // Fallback: use Math.random (less secure but works everywhere)
    for (let i = 0; i < 20; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256)
    }
  }

  // Convert to hex string and pad with zeros if needed
  const hexString = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return `0x${hexString}` as `0x${string}`
}
