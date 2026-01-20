// Hook for x402 payment integration with Privy
import { usePrivy, useWallets } from '@wazabi/ui'
import { useCallback } from 'react'
import {
    createPublicClient,
    createWalletClient,
    custom,
    http,
    parseEther,
    parseUnits,
    type PublicClient,
    type WalletClient,
} from 'viem'
import { base, bsc, mainnet } from 'viem/chains'
import {
    detectToken,
    getPrefill,
    signEIP3009,
    signERC20ViaFacilitator,
    type PrefillSelection,
    verifyThenSettle,
} from '@/lib/x402'

export function useX402Privy() {
    const { user } = usePrivy()
    const { wallets } = useWallets()

    const payAndSettle = useCallback(
        async (
            selection: PrefillSelection,
            logger: (msg: string) => void,
            targetChainId: number
        ) => {
            const wallet = wallets[0]
            if (!wallet) {
                throw new Error('No wallet connected')
            }

            // Ensure chain ID match
            const currentChainId = parseInt(wallet.chainId.split(':')[1])
            if (currentChainId !== targetChainId) {
                logger(`Switching chain to ${targetChainId}...`)
                await wallet.switchChain(targetChainId)
            }

            const provider = await wallet.getEthereumProvider()
            const targetChain = targetChainId === 56 ? bsc : targetChainId === 8453 ? base : mainnet

            const walletClient = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: targetChain,
                transport: custom(provider),
            }) as unknown as WalletClient

            const publicClient = createPublicClient({
                chain: targetChain,
                transport: http(),
            }) as unknown as PublicClient

            // 1. Get payment details
            logger('Getting payment details...')
            const prefill = await getPrefill(selection)

            // 2. Check if native or token
            const isNative = prefill.token === '0x0000000000000000000000000000000000000000'

            let payload: unknown

            if (isNative) {
                logger('Sending native payment...')
                // Amount is string, need to parse to wei
                // getPrefill returns string amount. For native we can use parseEther directly if it's in standard unit
                // getPrefill logic: converts USD target to token amount using price. 
                // Logic: amount = tokensNeeded.toFixed(8). 
                // So it's safe to assume it's in "ether" units (10^18 usually, or whatever the token decimals are)
                // For native it's 18 decimals usually.
                const val = parseEther(prefill.amount)
                const hash = await walletClient.sendTransaction({
                    account: wallet.address as `0x${string}`,
                    chain: targetChain,
                    to: prefill.recipient,
                    value: val,
                })
                payload = { nativeTxHash: hash }
            } else {
                // ERC20
                logger('Checking token capabilities...')
                const detection = await detectToken(publicClient, prefill.token, wallet.address as `0x${string}`)

                const validAfter = 0n
                // 1 hour validity
                const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600)

                // Parse amount using detected decimals
                const amountBigInt = parseUnits(prefill.amount, detection.decimals)

                if (detection.is3009) {
                    logger('Signing EIP-3009 authorization...')
                    const res = await signEIP3009({
                        walletClient,
                        address: wallet.address as `0x${string}`,
                        chainId: targetChainId,
                        tokenAddr: prefill.token,
                        tokenName: detection.name,
                        tokenVersion: detection.version,
                        from: wallet.address as `0x${string}`,
                        to: prefill.recipient,
                        value: amountBigInt,
                        validAfter,
                        validBefore,
                    })
                    payload = res.payload
                } else {
                    logger('Signing ERC-20 Facilitator authorization...')
                    if (!prefill.stargate) {
                        throw new Error('No facilitator configured for this token')
                    }
                    const res = await signERC20ViaFacilitator({
                        publicClient,
                        walletClient,
                        address: wallet.address as `0x${string}`,
                        chainId: targetChainId,
                        tokenAddr: prefill.token,
                        facilitator: prefill.stargate,
                        from: wallet.address as `0x${string}`,
                        to: prefill.recipient,
                        value: amountBigInt,
                        validAfter,
                        validBefore,
                    })
                    payload = res.payload
                }
            }

            logger('Verifying and settling...')
            return await verifyThenSettle(payload, logger)
        },
        [wallets]
    )

    return { payAndSettle }
}
