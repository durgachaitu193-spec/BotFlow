'use client'

import { useCallback } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import {
  createPublicClient,
  createWalletClient,
  custom,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { base, bsc, mainnet } from 'viem/chains'
import {
  detectToken,
  FORCE_EIP3009,
  FORCE_ERC20,
  getPrefill,
  type PrefillSelection,
  signEIP3009,
  signERC20ViaFacilitator,
  verifyThenSettle,
} from '@/lib/x402'
import { tokenAbiViem } from '@/lib/x402-tokens'

type LoggerFn = (msg: string) => void

function getChainForId(chainId: number) {
  if (chainId === 56) return bsc
  if (chainId === 8453) return base
  if (chainId === 1) return mainnet
  return undefined
}

async function getNumericChainId(provider: any): Promise<number> {
  const raw = (await provider.request?.({ method: 'eth_chainId' })) as string | undefined
  if (!raw) return 56
  return Number.parseInt(raw, 16)
}

export function useX402Privy() {
  const { wallets } = useWallets()

  const getWalletContext = useCallback(
    async (targetChainId?: number) => {
      const wallet = wallets && wallets.length > 0 ? wallets[0] : null

      if (!wallet?.address) {
        throw new Error('Wallet not ready')
      }

      const provider = await wallet.getEthereumProvider()
      const currentChainId = await getNumericChainId(provider)
      const chainId = targetChainId || currentChainId || 56
      const chain = getChainForId(chainId) || bsc

      // Ensure the connected wallet network matches the target chain
      if (currentChainId !== chain.id) {
        try {
          await provider.request?.({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chain.id.toString(16)}` }],
          })
          // small delay to let the switch propagate
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            // Chain not added – try to add it using viem's chain metadata
            await provider.request?.({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${chain.id.toString(16)}`,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcUrls.default.http,
                  blockExplorerUrls: chain.blockExplorers?.default?.url
                    ? [chain.blockExplorers.default.url]
                    : [],
                },
              ],
            })
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
          // if user rejects or it still fails, we'll just proceed and let the tx error surface
        }
      }

      // Reuse the Privy provider for both read and write, like agent registration does,
      // instead of building a separate RPC stack from scratch.
      const rpcClient = createPublicClient({
        chain,
        transport: custom(provider as any),
      }) as PublicClient

      const walletClient = createWalletClient({
        account: wallet.address as `0x${string}`,
        chain,
        transport: custom(provider as any),
      }) as WalletClient

      return {
        walletClient,
        rpcClient,
        chainId,
        address: wallet.address as `0x${string}`,
      }
    },
    [wallets]
  )

  const buildPaymentPayload = useCallback(
    async (selection: PrefillSelection | undefined, logger?: LoggerFn, targetChainId?: number) => {
      const { walletClient, rpcClient, chainId, address } = await getWalletContext(targetChainId)

      logger?.('🔍 Preparing x402 prefill & token metadata...')
      const from = address
      const prefill = await getPrefill(selection)

      const isNativePrefill =
        (prefill.token as string).toLowerCase() === '0x0000000000000000000000000000000000000000'

      if (isNativePrefill) {
        const amountNum = Number.parseFloat(prefill.amount)
        const roundedAmount = amountNum.toFixed(18)
        const value = ethers.parseUnits(roundedAmount, 18)
        logger?.(`💸 Sending native transfer of ${roundedAmount} to ${prefill.recipient}...`)

        interface TxSender {
          sendTransaction: (args: { to: `0x${string}`; value: bigint }) => Promise<`0x${string}`>
        }

        const txHash = await (walletClient as unknown as TxSender).sendTransaction({
          to: prefill.recipient as `0x${string}`,
          value,
        })
        await rpcClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        logger?.(`✅ Native transfer confirmed: ${txHash}`)
        return { payload: { nativeTxHash: txHash } as unknown }
      }

      const det = await detectToken(rpcClient, prefill.token as `0x${string}`, from)

      const amountNum = Number.parseFloat(prefill.amount)
      const roundedAmount = amountNum.toFixed(det.decimals)
      const value = ethers.parseUnits(roundedAmount, det.decimals)
      logger?.(
        `💰 Amount: ${roundedAmount} ${det.symbol || ''} | Checking balance & building authorization...`
      )

      const balance = (await rpcClient.readContract({
        address: prefill.token as `0x${string}`,
        abi: tokenAbiViem,
        functionName: 'balanceOf',
        args: [from],
      })) as bigint

      if (balance < value) {
        throw new Error('Insufficient token balance for authorization amount')
      }

      const now = Math.floor(Date.now() / 1000)
      const validAfter = now - 60
      const validBefore = now + 3600
      const useEIP3009 = FORCE_EIP3009 ? true : FORCE_ERC20 ? false : det.is3009

      if (useEIP3009) {
        logger?.('✍️ Signing EIP-3009 authorization...')
        return await signEIP3009({
          walletClient,
          address: from,
          chainId,
          tokenAddr: prefill.token as `0x${string}`,
          tokenName: det.name,
          tokenVersion: det.version || '1',
          from,
          to: prefill.recipient as `0x${string}`,
          value,
          validAfter: BigInt(validAfter),
          validBefore: BigInt(validBefore),
        })
      }

      const facilitator = prefill.stargate || process.env.NEXT_PUBLIC_STARGATE_CONTRACT || ''
      if (!ethers.isAddress(facilitator)) {
        throw new Error('STARGATE_CONTRACT (facilitator) is required for standard ERC-20')
      }

      logger?.('🛂 Checking allowance / approval...')
      const allowance = (await rpcClient.readContract({
        address: prefill.token as `0x${string}`,
        abi: tokenAbiViem,
        functionName: 'allowance',
        args: [from, facilitator as `0x${string}`],
      })) as bigint

      if (allowance < value) {
        logger?.('📝 Requesting token approval...')
        interface ApproveWriter {
          writeContract: (args: {
            address: `0x${string}`
            abi: unknown
            functionName: 'approve'
            args: [`0x${string}`, bigint]
          }) => Promise<`0x${string}`>
        }
        const txHash = await (walletClient as unknown as ApproveWriter).writeContract({
          address: prefill.token as `0x${string}`,
          abi: tokenAbiViem,
          functionName: 'approve',
          args: [facilitator as `0x${string}`, value],
        })
        logger?.('⏳ Waiting for approval confirmation...')
        await rpcClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        logger?.('✅ Approval confirmed')

        const postAllowance = (await rpcClient.readContract({
          address: prefill.token as `0x${string}`,
          abi: tokenAbiViem,
          functionName: 'allowance',
          args: [from, facilitator as `0x${string}`],
        })) as bigint
        if (postAllowance < value) {
          throw new Error('Allowance still insufficient after approval')
        }
      }

      logger?.('✍️ Signing ERC20 facilitator authorization...')
      return await signERC20ViaFacilitator({
        publicClient: rpcClient,
        walletClient,
        address: from,
        chainId,
        tokenAddr: prefill.token as `0x${string}`,
        facilitator: facilitator as `0x${string}`,
        from,
        to: prefill.recipient as `0x${string}`,
        value,
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
      })
    },
    [getWalletContext]
  )

  const payAndSettle = useCallback(
    async (selection: PrefillSelection | undefined, logger?: LoggerFn, targetChainId?: number) => {
      const built = await buildPaymentPayload(selection, logger, targetChainId)
      return verifyThenSettle((built as { payload: unknown }).payload, logger)
    },
    [buildPaymentPayload]
  )

  return {
    payAndSettle,
  }
}
