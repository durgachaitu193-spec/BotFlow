import { ethers } from 'ethers'
import type { PublicClient, WalletClient } from 'viem'
import { facilitatorAbiViem, tokenAbiViem } from '@/lib/x402-tokens'

// x402 v2 Protocol Version
export const X402_VERSION = 2

export const BSC_CHAIN_ID_DEC = 56
export const BSC_CHAIN_ID_HEX = '0x38'
export const BSC_RPC =
  process.env.NEXT_PUBLIC_BSC_RPC_URL ||
  process.env.BSC_RPC_URL ||
  'https://bsc-dataseed.binance.org/'
export const BASE_RPC =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || process.env.BASE_RPC_URL || 'https://mainnet.base.org'

// Wazabi Facilitator URL
// Defaulting to localhost for development/testing as requested
export const X402_BASE = process.env.NEXT_PUBLIC_X402_BASE_URL || 'http://localhost:4022'

export const FORCE_ERC20 = process.env.NEXT_PUBLIC_FORCE_ERC20 === '1'
export const FORCE_EIP3009 = process.env.NEXT_PUBLIC_FORCE_EIP3009 === '1'

/**
 * Convert chain ID to CAIP-2 network identifier
 */
export function getNetworkId(chainId: number): string {
  return `eip155:${chainId}`
}

export type Prefill = {
  recipient: `0x${string}`
  token: `0x${string}`
  amount: string
  stargate?: `0x${string}`
}

export type PrefillSelection = {
  tokenAddress: `0x${string}`
  priceUsd?: number
}

export async function getPrefill(selection?: PrefillSelection): Promise<Prefill> {
  if (selection?.tokenAddress) {
    const envStargateSel = process.env.NEXT_PUBLIC_STARGATE_CONTRACT || ''
    const recipientSel = process.env.NEXT_PUBLIC_X402_RECIPIENT || ''
    if (!ethers.isAddress(recipientSel)) {
      throw new Error('Missing/invalid NEXT_PUBLIC_X402_RECIPIENT')
    }
    if (!ethers.isAddress(selection.tokenAddress)) {
      throw new Error('Missing/invalid selected token address')
    }

    const usdPriceSel: number | undefined = selection.priceUsd
    const usdTarget = Number(process.env.NEXT_PUBLIC_X402_AMOUNT || process.env.X402_AMOUNT || 0.75)
    let amountSel = process.env.NEXT_PUBLIC_X402_AMOUNT || '1.0'
    if (usdPriceSel && usdPriceSel > 0) {
      amountSel = (usdTarget / usdPriceSel).toFixed(8)
    }

    return {
      recipient: recipientSel as `0x${string}`,
      token: selection.tokenAddress as `0x${string}`,
      amount: amountSel,
      stargate: envStargateSel as `0x${string}` | undefined,
    }
  }

  const envStargate = process.env.NEXT_PUBLIC_STARGATE_CONTRACT || ''
  const recipient = process.env.NEXT_PUBLIC_X402_RECIPIENT || ''

  const selectedAddress: string | undefined = selection?.tokenAddress
  const usdPrice: number | undefined = selection?.priceUsd

  const token = (selectedAddress || process.env.NEXT_PUBLIC_X402_TOKEN || '') as string

  let amount = process.env.NEXT_PUBLIC_X402_AMOUNT || '1.0'
  if (usdPrice && usdPrice > 0) {
    const usdTarget = Number(process.env.NEXT_PUBLIC_X402_AMOUNT || process.env.X402_AMOUNT || 0.75)
    const tokensNeeded = usdTarget / usdPrice
    amount = tokensNeeded.toFixed(8)
  }

  if (!ethers.isAddress(recipient)) {
    throw new Error('Missing/invalid NEXT_PUBLIC_X402_RECIPIENT')
  }
  if (!ethers.isAddress(token)) {
    throw new Error('Missing/invalid NEXT_PUBLIC_X402_TOKEN')
  }

  return {
    recipient: recipient as `0x${string}`,
    token: token as `0x${string}`,
    amount,
    stargate: envStargate as `0x${string}` | undefined,
  }
}

export async function detectToken(
  publicClient: PublicClient,
  tokenAddr: string,
  user: `0x${string}`
) {
  let name = 'Unknown' as string
  let version = '1' as string
  let symbol = '' as string
  let decimals = 18 as number
  let is3009 = false as boolean

  try {
    name = (await publicClient.readContract({
      address: tokenAddr as `0x${string}`,
      abi: tokenAbiViem,
      functionName: 'name',
    })) as string
  } catch { }
  try {
    version = (await publicClient.readContract({
      address: tokenAddr as `0x${string}`,
      abi: tokenAbiViem,
      functionName: 'version',
    })) as string
  } catch { }
  try {
    symbol = (await publicClient.readContract({
      address: tokenAddr as `0x${string}`,
      abi: tokenAbiViem,
      functionName: 'symbol',
    })) as string
  } catch { }
  try {
    decimals = Number(
      await publicClient.readContract({
        address: tokenAddr as `0x${string}`,
        abi: tokenAbiViem,
        functionName: 'decimals',
      })
    )
  } catch { }

  try {
    const testNonce = ethers.hexlify(ethers.randomBytes(32))
    await publicClient.readContract({
      address: tokenAddr as `0x${string}`,
      abi: tokenAbiViem,
      functionName: 'authorizationState',
      args: [user, testNonce as `0x${string}`],
    })
    is3009 = true
  } catch {
    is3009 = false
  }

  if (FORCE_EIP3009) is3009 = true
  if (FORCE_ERC20) is3009 = false

  return { name, version, symbol, decimals, is3009 }
}

export async function signEIP3009(params: {
  walletClient: WalletClient
  address: `0x${string}`
  chainId: number
  tokenAddr: `0x${string}`
  tokenName: string
  tokenVersion: string
  from: `0x${string}`
  to: `0x${string}`
  value: bigint
  validAfter: bigint
  validBefore: bigint
}) {
  const nonce = ethers.hexlify(ethers.randomBytes(32)) as `0x${string}`
  const domain = {
    name: params.tokenName,
    version: params.tokenVersion || '1',
    chainId: params.chainId,
    verifyingContract: params.tokenAddr,
  }
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  } as const
  const message = {
    from: params.from as `0x${string}`,
    to: params.to as `0x${string}`,
    value: params.value,
    validAfter: params.validAfter,
    validBefore: params.validBefore,
    nonce,
  }
  const sig = await params.walletClient.signTypedData({
    account: params.address,
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  })

  // v2: Use CAIP-2 network identifier
  const networkId = getNetworkId(params.chainId)
  const scheme = 'exact'

  const payload = {
    paymentPayload: {
      x402Version: X402_VERSION,
      resource: {
        url: 'x402://payment',
        description: 'EIP-3009 payment authorization',
        mimeType: 'application/json',
      },
      accepted: {
        scheme,
        network: networkId,
        asset: params.tokenAddr,
        amount: message.value.toString(),
        payTo: params.to,
        maxTimeoutSeconds: 300,
        extra: {},
      },
      payload: {
        signature: sig,
        authorization: {
          from: message.from,
          to: message.to,
          value: message.value.toString(),
          validAfter: message.validAfter.toString(),
          validBefore: message.validBefore.toString(),
          nonce: message.nonce,
        },
      },
    },
    paymentRequirements: {
      scheme,
      network: networkId,
      asset: params.tokenAddr,
      amount: message.value.toString(),
      payTo: params.to,
      maxTimeoutSeconds: 300,
      extra: {},
    },
  }
  return { payload }
}

export async function signERC20ViaFacilitator(params: {
  publicClient: PublicClient
  walletClient: WalletClient
  address: `0x${string}`
  chainId: number
  tokenAddr: `0x${string}`
  facilitator: `0x${string}`
  from: `0x${string}`
  to: `0x${string}`
  value: bigint
  validAfter: bigint
  validBefore: bigint
}) {
  const nonce = (await params.publicClient.readContract({
    address: params.facilitator as `0x${string}`,
    abi: facilitatorAbiViem,
    functionName: 'getNonce',
    args: [params.from as `0x${string}`, params.tokenAddr as `0x${string}`],
  })) as bigint

  // v2: Updated domain name to Wazabi
  const domain = {
    name: 'Wazabi',
    version: '1',
    chainId: params.chainId,
    verifyingContract: params.facilitator,
  }
  const types = {
    ERC20Payment: [
      { name: 'token', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
    ],
  } as const
  const message = {
    token: params.tokenAddr,
    from: params.from,
    to: params.to,
    value: params.value,
    nonce,
    validAfter: params.validAfter,
    validBefore: params.validBefore,
  }
  const sig = await params.walletClient.signTypedData({
    account: params.address,
    domain,
    types,
    primaryType: 'ERC20Payment',
    message,
  })

  // v2: Use CAIP-2 network identifier
  const networkId = getNetworkId(params.chainId)
  const scheme = 'stargate'

  const payload = {
    paymentPayload: {
      x402Version: X402_VERSION,
      resource: {
        url: 'x402://payment',
        description: 'ERC-20 payment via Wazabi Stargate',
        mimeType: 'application/json',
      },
      accepted: {
        scheme,
        network: networkId,
        asset: params.tokenAddr,
        amount: message.value.toString(),
        payTo: params.to,
        maxTimeoutSeconds: 300,
        extra: {
          stargateAddress: params.facilitator,
        },
      },
      payload: {
        signature: sig,
        authorization: {
          token: message.token,
          from: message.from,
          to: message.to,
          value: message.value.toString(),
          nonce: message.nonce.toString(),
          validAfter: message.validAfter.toString(),
          validBefore: message.validBefore.toString(),
        },
      },
    },
    paymentRequirements: {
      scheme,
      network: networkId,
      asset: params.tokenAddr,
      amount: message.value.toString(),
      payTo: params.to,
      maxTimeoutSeconds: 300,
      extra: {
        stargateAddress: params.facilitator,
      },
    },
  }
  return { payload }
}

export async function verifyThenSettle(payload: unknown, logger?: (msg: string) => void) {
  if (
    payload &&
    typeof payload === 'object' &&
    (payload as { nativeTxHash?: string }).nativeTxHash
  ) {
    const tx = (payload as { nativeTxHash: string }).nativeTxHash
    logger?.(`✅ Native payment complete: ${tx}`)
    return { txHash: tx }
  }

  const jsonSafe = JSON.parse(
    JSON.stringify(payload, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  )

  logger?.('🔍 Sending /verify request...')
  const vr = await fetch(`${X402_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonSafe),
  })
  const verifyText = await vr.text()
  if (!vr.ok) {
    logger?.(`❌ /verify ${vr.status}`)
    throw new Error(`/verify ${vr.status} ${verifyText}`)
  }
  try {
    const vj = JSON.parse(verifyText)
    if (vj?.isValid === false) {
      logger?.(`❌ Verify invalid: ${vj?.invalidReason || 'unknown'}`)
      throw new Error(vj?.invalidReason || 'verify failed')
    }
    logger?.('✅ Verify OK')
  } catch { }

  logger?.('🚀 Sending /settle request...')
  const sr = await fetch(`${X402_BASE}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonSafe),
  })
  const settleText = await sr.text()
  if (!sr.ok) {
    logger?.(`❌ /settle ${sr.status}`)
    throw new Error(`settlement failed: ${sr.status} ${settleText}`)
  }
  try {
    const js = JSON.parse(settleText)
    const tx = js?.transaction || js?.txHash || js?.hash || '<no tx hash>'
    logger?.(`✅ Settlement complete: ${tx}`)
    return js
  } catch {
    logger?.('✅ Settlement complete')
    return {}
  }
}
