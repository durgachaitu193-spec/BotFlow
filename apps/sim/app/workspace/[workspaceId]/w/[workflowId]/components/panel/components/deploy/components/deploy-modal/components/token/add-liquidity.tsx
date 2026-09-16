'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallets } from '@botflow/ui'
import { createLogger } from '@botflow/logger'
import { parseEther, parseUnits, formatUnits, formatEther } from 'viem'
import { AlertTriangle, Check, ExternalLink, Info, Loader2, RefreshCw } from 'lucide-react'
import { Button, Input, Label } from '@/components/emcn'
import { Alert, AlertDescription } from '@/components/ui'
import {
    createPositionWithBNB,
    createPositionWithToken,
    approveToken,
    checkTokenAllowance,
    getTokenBalance,
    getBNBBalance,
    getUSDTAddress,
    getWBNBAddress,
    getPoolAddress,
    getPoolState,
    calculatePairedAmount,
    calculateTickBounds,
    createToken,
    getWBNBToken,
    getUSDTToken,
    FEE_TIERS,
    FEE_TIER_LABELS,
    type FeeTier,
    type PairType,
} from '@/lib/contracts/pancakeV3'
import { DEFAULT_CHAIN } from '@/lib/contracts/didRegistry'

const logger = createLogger('AddLiquidityV3')

interface AddLiquidityProps {
    tokenAddress: string
    tokenSymbol: string
    tokenName: string
    tokenDecimals?: number
}

const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5]
const PRICE_RANGE_OPTIONS = [25, 50, 100, 200] // ±percentage around initial price

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
    const [slippage, setSlippage] = useState(1)
    const [feeTier, setFeeTier] = useState<FeeTier>(FEE_TIERS.MEDIUM) // Default 0.25%
    const [priceRange, setPriceRange] = useState(100) // ±100% default for new tokens

    // Balance state
    const [tokenBalance, setTokenBalance] = useState<string | null>(null)
    const [pairBalance, setPairBalance] = useState<string | null>(null)
    const [isLoadingBalances, setIsLoadingBalances] = useState(false)

    // Approval state
    const [allowance, setAllowance] = useState<bigint>(0n)
    const [usdtAllowance, setUsdtAllowance] = useState<bigint>(0n)
    const [isApproving, setIsApproving] = useState(false)
    const [isApproved, setIsApproved] = useState(false)

    // Transaction state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [poolExists, setPoolExists] = useState<boolean | null>(null)
    const [poolAddress, setPoolAddress] = useState<string | null>(null)
    const [currentTick, setCurrentTick] = useState<number | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)

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

            // Check if pool exists and get pool state
            const wbnb = getWBNBAddress()
            const usdt = getUSDTAddress()
            const pairedToken = pairType === 'BNB' ? wbnb : usdt
            const pool = await getPoolAddress(tokenAddress, pairedToken, feeTier)
            setPoolExists(pool !== null)
            setPoolAddress(pool)

            // If pool exists, get current tick for auto-calculations
            if (pool) {
                try {
                    const poolState = await getPoolState(pool)
                    setCurrentTick(poolState.tick)
                } catch (err) {
                    logger.warn('Failed to get pool state', { error: err })
                }
            }
        } catch (err) {
            logger.error('Failed to load balances', { error: err })
        } finally {
            setIsLoadingBalances(false)
        }
    }

    useEffect(() => {
        loadBalances()
    }, [walletAddress, tokenAddress, pairType, feeTier])

    // Auto-calculate paired amount when user enters one amount
    const calculateOtherAmount = useCallback(async (
        enteredAmount: string,
        isTokenAmountEntered: boolean
    ) => {
        if (!poolAddress || !enteredAmount || Number(enteredAmount) <= 0 || currentTick === null) {
            return null
        }

        setIsCalculating(true)
        try {
            // Create token instances
            const token = createToken(tokenAddress, tokenDecimals, tokenSymbol, tokenName)
            const pairedToken = pairType === 'BNB' ? getWBNBToken() : getUSDTToken()

            // Sort tokens to determine which is token0/token1
            const isTokenFirst = token.address.toLowerCase() < pairedToken.address.toLowerCase()
            const token0 = isTokenFirst ? token : pairedToken
            const token1 = isTokenFirst ? pairedToken : token

            // Calculate tick bounds
            const { tickLower, tickUpper } = calculateTickBounds(currentTick, priceRange, feeTier)

            // Parse the entered amount
            const decimals = isTokenAmountEntered ? tokenDecimals : 18
            const amount = parseUnits(enteredAmount, decimals)

            // Determine if user entered token0 or token1 amount
            const isAmount0 = isTokenAmountEntered ? isTokenFirst : !isTokenFirst

            const result = await calculatePairedAmount(
                token0,
                token1,
                feeTier,
                poolAddress,
                tickLower,
                tickUpper,
                amount,
                isAmount0
            )

            // Format the paired amount
            const pairedDecimals = isTokenAmountEntered ? 18 : tokenDecimals
            const formattedAmount = formatUnits(result.pairedAmount, pairedDecimals)

            return formattedAmount
        } catch (err) {
            logger.warn('Failed to calculate paired amount', { error: err })
            return null
        } finally {
            setIsCalculating(false)
        }
    }, [poolAddress, currentTick, tokenAddress, tokenDecimals, tokenSymbol, tokenName, pairType, priceRange, feeTier])

    // Track which field was last edited to avoid infinite loops
    const [lastEditedField, setLastEditedField] = useState<'token' | 'pair' | null>(null)

    // Handle token amount change (synchronous for immediate UI response)
    const handleTokenAmountChange = (value: string) => {
        setTokenAmount(value)
        setLastEditedField('token')
    }

    // Handle pair amount change (synchronous for immediate UI response)
    const handlePairAmountChange = (value: string) => {
        setPairAmount(value)
        setLastEditedField('pair')
    }

    // Debounced auto-calculation effect
    useEffect(() => {
        if (!poolExists || !lastEditedField) return

        const timeout = setTimeout(async () => {
            if (lastEditedField === 'token' && tokenAmount && Number(tokenAmount) > 0) {
                const paired = await calculateOtherAmount(tokenAmount, true)
                if (paired) {
                    setPairAmount(paired)
                }
            } else if (lastEditedField === 'pair' && pairAmount && Number(pairAmount) > 0) {
                const paired = await calculateOtherAmount(pairAmount, false)
                if (paired) {
                    setTokenAmount(paired)
                }
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timeout)
    }, [tokenAmount, pairAmount, lastEditedField, poolExists, calculateOtherAmount])

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

            // Calculate initial price ratio from amounts
            const priceRatio = Number(pairAmount) / Number(tokenAmount)

            let result

            if (pairType === 'BNB') {
                const parsedBNBAmount = parseEther(pairAmount)

                result = await createPositionWithBNB(
                    walletAddress,
                    tokenAddress,
                    tokenDecimals,
                    tokenSymbol,
                    tokenName,
                    parsedTokenAmount,
                    parsedBNBAmount,
                    feeTier,
                    priceRatio,
                    priceRange,
                    slippage,
                    provider
                )
            } else {
                const usdtAddress = getUSDTAddress()
                const parsedUSDTAmount = parseUnits(pairAmount, 18)

                // Check USDT allowance
                const usdtAllow = await checkTokenAllowance(usdtAddress, walletAddress)
                if (usdtAllow < parsedUSDTAmount) {
                    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
                    await approveToken(walletAddress, usdtAddress, maxUint256, provider)
                }

                result = await createPositionWithToken(
                    walletAddress,
                    tokenAddress,
                    tokenDecimals,
                    tokenSymbol,
                    tokenName,
                    usdtAddress,
                    parsedTokenAmount,
                    parsedUSDTAmount,
                    feeTier,
                    priceRatio,
                    priceRange,
                    slippage,
                    provider
                )
            }

            setTxHash(result.txHash)
            setSuccess(true)

            logger.info('V3 Liquidity position created', { txHash: result.txHash })
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
                    Add Liquidity to PancakeSwap V3
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

            {poolExists === false && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        No pool exists yet. A new pool will be created with your initial price.
                    </AlertDescription>
                </Alert>
            )}

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
                        <span>V3 Liquidity position created!</span>
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
                            onChange={(e) => handleTokenAmountChange(e.target.value)}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[13px]"
                            min="0"
                            step="any"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!tokenBalance || isSubmitting || success}
                            onClick={() => handleTokenAmountChange(tokenBalance || '')}
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
                            onChange={(e) => handlePairAmountChange(e.target.value)}
                            disabled={isSubmitting || success}
                            className="h-[32px] flex-1 text-[13px]"
                            min="0"
                            step="any"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!pairBalance || isSubmitting || success}
                            onClick={() => handlePairAmountChange(pairBalance || '')}
                            className="h-[32px] text-[11px]"
                        >
                            MAX
                        </Button>
                    </div>
                </div>

                {/* Pool Status / Initial Price */}
                <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                    {poolExists === null ? (
                        <div className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking pool status...
                        </div>
                    ) : poolExists ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[12px] text-green-500">
                                <Check className="h-3 w-3" />
                                Pool exists - amounts will auto-balance
                            </div>
                            {currentTick !== null && (
                                <div className="space-y-1 text-[11px]">
                                    <div className="text-[var(--text-secondary)]">Current Price:</div>
                                    {(() => {
                                        // Calculate price from tick: price = 1.0001^tick
                                        const token = createToken(tokenAddress, tokenDecimals, tokenSymbol, tokenName)
                                        const pairedToken = pairType === 'BNB' ? getWBNBToken() : getUSDTToken()
                                        const isTokenFirst = token.address.toLowerCase() < pairedToken.address.toLowerCase()
                                        // Price in V3 is token1/token0, so we need to invert based on sort order
                                        const rawPrice = Math.pow(1.0001, currentTick)
                                        const priceInPair = isTokenFirst ? rawPrice : 1 / rawPrice
                                        const priceInToken = 1 / priceInPair
                                        return (
                                            <div className="flex flex-col gap-1 rounded bg-[var(--bg-tertiary)] p-2 font-mono text-[10px]">
                                                <span>1 {tokenSymbol} = {priceInPair.toFixed(8)} {pairType}</span>
                                                <span>1 {pairType} = {priceInToken.toFixed(4)} {tokenSymbol}</span>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                            {isCalculating && (
                                <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Calculating paired amount...
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[12px] text-yellow-500">
                                <AlertTriangle className="h-3 w-3" />
                                New pool - you set the initial price
                            </div>
                            {tokenAmount && pairAmount && Number(tokenAmount) > 0 && Number(pairAmount) > 0 && (
                                <div className="space-y-1 text-[11px]">
                                    <div className="text-[var(--text-secondary)]">
                                        Initial Price:
                                    </div>
                                    <div className="flex flex-col gap-1 rounded bg-[var(--bg-tertiary)] p-2 font-mono text-[10px]">
                                        <span>1 {tokenSymbol} = {(Number(pairAmount) / Number(tokenAmount)).toFixed(8)} {pairType}</span>
                                        <span>1 {pairType} = {(Number(tokenAmount) / Number(pairAmount)).toFixed(4)} {tokenSymbol}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Fee Tier */}
                <div>
                    <Label className="mb-1 block text-[12px] text-[var(--text-secondary)]">
                        Fee Tier
                    </Label>
                    <div className="flex gap-1">
                        {Object.entries(FEE_TIERS).map(([key, value]) => (
                            <Button
                                key={key}
                                type="button"
                                variant={feeTier === value ? 'default' : 'outline'}
                                onClick={() => setFeeTier(value)}
                                disabled={isSubmitting || success}
                                className="h-[28px] flex-1 text-[11px]"
                            >
                                {FEE_TIER_LABELS[value]}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div>
                    <Label className="mb-1 block text-[12px] text-[var(--text-secondary)]">
                        Price Range (±%)
                    </Label>
                    <div className="flex gap-1">
                        {PRICE_RANGE_OPTIONS.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                variant={priceRange === option ? 'default' : 'outline'}
                                onClick={() => setPriceRange(option)}
                                disabled={isSubmitting || success}
                                className="h-[28px] flex-1 text-[11px]"
                            >
                                ±{option}%
                            </Button>
                        ))}
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                        Wider range = less concentrated = more tolerant to price changes
                    </p>
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
                            Creating Position...
                        </>
                    ) : success ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Position Created
                        </>
                    ) : (
                        'Add Liquidity'
                    )}
                </Button>
            </div>

            <p className="text-center text-[10px] text-[var(--text-tertiary)]">
                Creates a V3 position (NFT) for {tokenSymbol}/{pairType} with {FEE_TIER_LABELS[feeTier]} fee
            </p>
        </div>
    )
}
