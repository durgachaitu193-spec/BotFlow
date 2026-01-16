'use client'

import { useEffect, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createLogger } from '@sim/logger'
import { parseEther, parseUnits, formatUnits } from 'viem'
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Button, Input, Label } from '@/components/emcn'
import { Alert, AlertDescription } from '@/components/ui'
import {
    addLiquidityETH,
    addLiquidity,
    approveToken,
    checkTokenAllowance,
    getTokenBalance,
    getBNBBalance,
    getUSDTAddress,
    getWBNBAddress,
    getPairAddress,
    type PairType,
} from '@/lib/contracts/pancakeRouter'
import { DEFAULT_CHAIN } from '@/lib/contracts/didRegistry'

const logger = createLogger('AddLiquidity')

interface AddLiquidityProps {
    tokenAddress: string
    tokenSymbol: string
    tokenName: string
    tokenDecimals?: number
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1, 5]

export function AddLiquidity({
    tokenAddress,
    tokenSymbol,
    tokenName,
    tokenDecimals = 18,
}: AddLiquidityProps) {
    const { wallets } = useWallets()

    // Form state
    const [tokenAmount, setTokenAmount] = useState('')
    const [pairAmount, setPairAmount] = useState('')
    const [pairType, setPairType] = useState<PairType>('BNB')
    const [slippage, setSlippage] = useState(0.5)

    // Balance state
    const [tokenBalance, setTokenBalance] = useState<string | null>(null)
    const [pairBalance, setPairBalance] = useState<string | null>(null)
    const [isLoadingBalances, setIsLoadingBalances] = useState(false)

    // Approval state
    const [allowance, setAllowance] = useState<bigint>(0n)
    const [isApproving, setIsApproving] = useState(false)
    const [isApproved, setIsApproved] = useState(false)

    // Transaction state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [pairAddress, setPairAddressState] = useState<string | null>(null)

    const walletAddress = wallets?.[0]?.address

    // Load balances
    const loadBalances = async () => {
        if (!walletAddress || !tokenAddress) return

        setIsLoadingBalances(true)
        try {
            // Load token balance
            const tokenBalanceResult = await getTokenBalance(tokenAddress, walletAddress)
            setTokenBalance(tokenBalanceResult.formatted)

            // Load pair asset balance
            if (pairType === 'BNB') {
                const bnbResult = await getBNBBalance(walletAddress)
                setPairBalance(bnbResult.formatted)
            } else {
                const usdtAddress = getUSDTAddress()
                const usdtResult = await getTokenBalance(usdtAddress, walletAddress)
                setPairBalance(usdtResult.formatted)
            }

            // Check token allowance
            const currentAllowance = await checkTokenAllowance(tokenAddress, walletAddress)
            setAllowance(currentAllowance)
        } catch (err) {
            logger.error('Failed to load balances', { error: err })
        } finally {
            setIsLoadingBalances(false)
        }
    }

    useEffect(() => {
        loadBalances()
    }, [walletAddress, tokenAddress, pairType])

    // Check if we need approval
    useEffect(() => {
        if (!tokenAmount) {
            setIsApproved(false)
            return
        }

        try {
            const requiredAmount = parseUnits(tokenAmount, tokenDecimals)
            setIsApproved(allowance >= requiredAmount)
        } catch {
            setIsApproved(false)
        }
    }, [tokenAmount, allowance, tokenDecimals])

    // Handle approval
    const handleApprove = async () => {
        if (!walletAddress || !tokenAmount) return

        setIsApproving(true)
        setError(null)

        try {
            const provider = await wallets[0].getEthereumProvider()

            // Approve max uint256 for convenience
            const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

            await approveToken(walletAddress, tokenAddress, maxUint256, provider)

            setAllowance(maxUint256)
            setIsApproved(true)
            logger.info('Token approved successfully')
        } catch (err: any) {
            logger.error('Approval failed', { error: err })
            setError(err.message || 'Failed to approve token')
        } finally {
            setIsApproving(false)
        }
    }

    // Handle add liquidity
    const handleAddLiquidity = async () => {
        if (!walletAddress || !tokenAmount || !pairAmount) return

        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        try {
            const provider = await wallets[0].getEthereumProvider()
            const parsedTokenAmount = parseUnits(tokenAmount, tokenDecimals)

            let result

            if (pairType === 'BNB') {
                const parsedBNBAmount = parseEther(pairAmount)

                result = await addLiquidityETH(
                    walletAddress,
                    tokenAddress,
                    parsedTokenAmount,
                    parsedBNBAmount,
                    slippage,
                    provider
                )
            } else {
                const usdtAddress = getUSDTAddress()
                const parsedUSDTAmount = parseUnits(pairAmount, 18) // USDT on BSC has 18 decimals

                // Need to approve USDT as well
                const usdtAllowance = await checkTokenAllowance(usdtAddress, walletAddress)
                if (usdtAllowance < parsedUSDTAmount) {
                    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
                    await approveToken(walletAddress, usdtAddress, maxUint256, provider)
                }

                result = await addLiquidity(
                    walletAddress,
                    tokenAddress,
                    usdtAddress,
                    parsedTokenAmount,
                    parsedUSDTAmount,
                    slippage,
                    provider
                )
            }

            setTxHash(result.txHash)
            setSuccess(true)

            // Try to get pair address
            const wbnb = getWBNBAddress()
            const usdt = getUSDTAddress()
            const pairedToken = pairType === 'BNB' ? wbnb : usdt
            const pairAddr = await getPairAddress(tokenAddress, pairedToken)
            if (pairAddr) {
                setPairAddressState(pairAddr)
            }

            logger.info('Liquidity added successfully', { txHash: result.txHash })
        } catch (err: any) {
            logger.error('Add liquidity failed', { error: err })
            setError(err.message || 'Failed to add liquidity')
        } finally {
            setIsSubmitting(false)
        }
    }

    const isFormValid = Boolean(tokenAmount) && Boolean(pairAmount) && Number(tokenAmount) > 0 && Number(pairAmount) > 0

    const explorerUrl = DEFAULT_CHAIN.blockExplorers?.default?.url || 'https://testnet.bscscan.com'

    return (
        <div className="space-y-4 rounded-lg border border-[var(--border-primary)] p-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-[14px] text-[var(--text-primary)]">
                    Add Liquidity to PancakeSwap
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
                        <span>Liquidity added successfully!</span>
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
                        {pairAddress && (
                            <a
                                href={`${explorerUrl}/address/${pairAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary underline"
                            >
                                View Pair <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
                {/* Token Amount */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <Label className="text-[12px] text-[var(--text-secondary)]">
                            {tokenSymbol} Amount
                        </Label>
                        {tokenBalance && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                Balance: {Number(tokenBalance).toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="0.0"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[13px]"
                            min="0"
                            step="any"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!tokenBalance || isSubmitting || success}
                            onClick={() => setTokenAmount(tokenBalance || '')}
                            className="h-[32px] text-[11px]"
                        >
                            MAX
                        </Button>
                    </div>
                </div>

                {/* Pair Type Selection */}
                <div>
                    <Label className="mb-1 block text-[12px] text-[var(--text-secondary)]">
                        Pair With
                    </Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={pairType === 'BNB' ? 'default' : 'outline'}
                            onClick={() => setPairType('BNB')}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[12px]"
                        >
                            BNB
                        </Button>
                        <Button
                            type="button"
                            variant={pairType === 'USDT' ? 'default' : 'outline'}
                            onClick={() => setPairType('USDT')}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[12px]"
                        >
                            USDT
                        </Button>
                    </div>
                </div>

                {/* Pair Amount */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <Label className="text-[12px] text-[var(--text-secondary)]">
                            {pairType} Amount
                        </Label>
                        {pairBalance && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                Balance: {Number(pairBalance).toFixed(4)}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="0.0"
                            value={pairAmount}
                            onChange={(e) => setPairAmount(e.target.value)}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[13px]"
                            min="0"
                            step="any"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!pairBalance || isSubmitting || success}
                            onClick={() => setPairAmount(pairBalance || '')}
                            className="h-[32px] text-[11px]"
                        >
                            MAX
                        </Button>
                    </div>
                </div>

                {/* Slippage */}
                <div>
                    <Label className="mb-1 block text-[12px] text-[var(--text-secondary)]">
                        Slippage Tolerance
                    </Label>
                    <div className="flex gap-1">
                        {SLIPPAGE_OPTIONS.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                variant={slippage === option ? 'default' : 'outline'}
                                onClick={() => setSlippage(option)}
                                disabled={isSubmitting || success}
                                className="h-[28px] flex-1 text-[11px]"
                            >
                                {option}%
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                {!isApproved && !success && (
                    <Button
                        type="button"
                        onClick={handleApprove}
                        disabled={!isFormValid || isApproving || isSubmitting}
                        className="h-[36px] flex-1 text-[12px]"
                    >
                        {isApproving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Approving...
                            </>
                        ) : (
                            <>Approve {tokenSymbol}</>
                        )}
                    </Button>
                )}

                <Button
                    type="button"
                    onClick={handleAddLiquidity}
                    disabled={!isFormValid || !isApproved || isSubmitting || success}
                    className="h-[36px] flex-1 text-[12px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding Liquidity...
                        </>
                    ) : success ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Liquidity Added
                        </>
                    ) : (
                        'Add Liquidity'
                    )}
                </Button>
            </div>

            <p className="text-center text-[10px] text-[var(--text-tertiary)]">
                Creates a {tokenSymbol}/{pairType} pair on PancakeSwap V2
            </p>
        </div>
    )
}
