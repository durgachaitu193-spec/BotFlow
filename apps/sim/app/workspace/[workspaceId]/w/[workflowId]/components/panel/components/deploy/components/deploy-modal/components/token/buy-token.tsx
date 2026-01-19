'use client'

import { useEffect, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createLogger } from '@wazabi/logger'
import { formatEther } from 'viem'
import { AlertTriangle, ArrowRightLeft, Check, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Button, Input, Label } from '@/components/emcn'
import { Alert, AlertDescription } from '@/components/ui'
import {
    buyTokens,
    calculateBuyCost,
} from '@/lib/contracts/bondingCurveToken'
import { getTokenBalance, getBNBBalance } from '@/lib/contracts/pancakeRouter'
import { DEFAULT_CHAIN } from '@/lib/contracts/didRegistry'

const logger = createLogger('BuyToken')

interface BuyTokenProps {
    tokenAddress: string
    tokenName: string
    tokenSymbol: string
    onPurchaseComplete?: () => void
}

export function BuyToken({
    tokenAddress,
    tokenName,
    tokenSymbol,
    onPurchaseComplete,
}: BuyTokenProps) {
    const { wallets } = useWallets()

    // Form state
    const [buyAmount, setBuyAmount] = useState('')
    const [estimatedCost, setEstimatedCost] = useState<string | null>(null)

    // Balance state
    const [tokenBalance, setTokenBalance] = useState<string | null>(null)
    const [bnbBalance, setBnbBalance] = useState<string | null>(null)
    const [isLoadingBalances, setIsLoadingBalances] = useState(false)
    const [isEstimating, setIsEstimating] = useState(false)

    // Transaction state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)

    const walletAddress = wallets?.[0]?.address

    // Load balances
    const loadBalances = async () => {
        if (!walletAddress || !tokenAddress) return

        setIsLoadingBalances(true)
        try {
            // Load token balance
            const tokenBalanceResult = await getTokenBalance(tokenAddress, walletAddress)
            setTokenBalance(tokenBalanceResult.formatted)

            // Load BNB balance
            const bnbResult = await getBNBBalance(walletAddress)
            setBnbBalance(bnbResult.formatted)
        } catch (err: any) {
            logger.error('Failed to load balances', { message: err?.message || String(err) })
        } finally {
            setIsLoadingBalances(false)
        }
    }

    useEffect(() => {
        loadBalances()
    }, [walletAddress, tokenAddress])

    // Estimate cost when amount changes
    useEffect(() => {
        const estimateCost = async () => {
            if (!buyAmount || Number(buyAmount) <= 0 || !tokenAddress) {
                setEstimatedCost(null)
                return
            }

            setIsEstimating(true)
            setError(null)
            try {
                // The amount passed to calculateBuyCost is NOT scaled (the contract handles scaling)
                const amount = BigInt(Math.floor(Number(buyAmount)))
                const cost = await calculateBuyCost(tokenAddress, amount)
                setEstimatedCost(formatEther(cost))
            } catch (err: any) {
                logger.error('Failed to estimate cost', { message: err?.message || String(err) })
                setEstimatedCost(null)
                // Don't show error for cost estimation - it might just mean amount is too low
            } finally {
                setIsEstimating(false)
            }
        }

        const debounceTimer = setTimeout(estimateCost, 500)
        return () => clearTimeout(debounceTimer)
    }, [buyAmount, tokenAddress])

    // Handle buy
    const handleBuy = async () => {
        if (!walletAddress || !buyAmount || !tokenAddress) return

        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        try {
            const provider = await wallets[0].getEthereumProvider()
            // The amount passed to buyTokens is NOT scaled (the contract handles scaling)
            const amount = BigInt(Math.floor(Number(buyAmount)))

            const result = await buyTokens(
                walletAddress,
                tokenAddress,
                amount,
                provider
            )

            setTxHash(result.txHash)
            setSuccess(true)
            setBuyAmount('')
            setEstimatedCost(null)

            // Refresh balances
            await loadBalances()

            // Notify parent
            if (onPurchaseComplete) {
                onPurchaseComplete()
            }

            logger.info('Token purchase successful', { txHash: result.txHash })
        } catch (err: any) {
            logger.error('Token purchase failed', { message: err?.message || String(err) })
            setError(err.message || 'Failed to buy tokens')
        } finally {
            setIsSubmitting(false)
        }
    }

    const isFormValid = Boolean(buyAmount) && Number(buyAmount) > 0 && estimatedCost !== null
    const explorerUrl = DEFAULT_CHAIN.blockExplorers?.default?.url || 'https://testnet.bscscan.com'

    return (
        <div className="space-y-4 rounded-lg border border-[var(--border-primary)] p-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-[14px] text-[var(--text-primary)]">
                    Buy {tokenSymbol} Tokens
                </h3>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={loadBalances}
                    disabled={isLoadingBalances}
                    className="h-6 w-6 p-0"
                >
                    <RefreshCw className={`h-3 w-3 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <p className="text-[11px] text-[var(--text-tertiary)]">
                Purchase tokens using BNB via bonding curve pricing
            </p>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription className="flex flex-col gap-2">
                        <span>Tokens purchased successfully!</span>
                        {txHash && (
                            <a
                                href={`${explorerUrl}/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary underline"
                            >
                                View Transaction <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
                {/* Current Balance */}
                <div className="flex items-center justify-between rounded bg-[var(--surface-3)] px-3 py-2">
                    <span className="text-[11px] text-[var(--text-secondary)]">Your Balance</span>
                    <span className="font-medium text-[12px]">
                        {isLoadingBalances ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <>
                                {Number(tokenBalance || 0).toLocaleString()} {tokenSymbol}
                            </>
                        )}
                    </span>
                </div>

                {/* Buy Amount */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <Label className="text-[12px] text-[var(--text-secondary)]">
                            Amount to Buy
                        </Label>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="0"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[13px]"
                            min="1"
                            step="1"
                        />
                        <span className="flex items-center text-[12px] text-[var(--text-secondary)]">
                            {tokenSymbol}
                        </span>
                    </div>
                </div>

                {/* Cost Estimate */}
                <div className="flex items-center justify-between rounded bg-[var(--surface-3)] px-3 py-2">
                    <span className="text-[11px] text-[var(--text-secondary)]">Cost</span>
                    <span className="flex items-center gap-2 font-medium text-[12px]">
                        {isEstimating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : estimatedCost ? (
                            <>
                                <ArrowRightLeft className="h-3 w-3" />
                                {Number(estimatedCost).toFixed(8)} BNB
                            </>
                        ) : (
                            <span className="text-[var(--text-tertiary)]">--</span>
                        )}
                    </span>
                </div>

                {/* BNB Balance */}
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                    <span>Available BNB</span>
                    <span>{Number(bnbBalance || 0).toFixed(4)} BNB</span>
                </div>
            </div>

            {/* Buy Button */}
            <Button
                type="button"
                onClick={handleBuy}
                disabled={!isFormValid || isSubmitting || success}
                className="h-[36px] w-full text-[12px]"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buying...
                    </>
                ) : success ? (
                    <>
                        <Check className="mr-2 h-4 w-4" />
                        Purchase Complete
                    </>
                ) : (
                    <>Buy {tokenSymbol}</>
                )}
            </Button>
        </div>
    )
}
