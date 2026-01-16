import { createLogger } from '@sim/logger'
import {
    type Chain,
    createPublicClient,
    createWalletClient,
    custom,
    http,
    parseEther,
    formatEther,
    parseUnits,
    formatUnits,
    erc20Abi,
    encodeFunctionData,
} from 'viem'
import { Token, CurrencyAmount, Percent } from '@pancakeswap/sdk'
import { Pool, Position, nearestUsableTick, TickMath, FeeAmount, TICK_SPACINGS } from '@pancakeswap/v3-sdk'
import { DEFAULT_CHAIN, BSC_MAINNET, BSC_TESTNET } from './didRegistry'

const logger = createLogger('PancakeV3')

// =============================================================================
// V3 Contract Addresses (BSC Mainnet & Testnet)
// =============================================================================

export const V3_POSITION_MANAGER_MAINNET = '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364' as const
export const V3_POSITION_MANAGER_TESTNET = '0x427bF5b37357632377eCbEC9de3626C71A5396c1' as const

export const V3_FACTORY_MAINNET = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865' as const
export const V3_FACTORY_TESTNET = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865' as const

export const WBNB_MAINNET = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as const
export const WBNB_TESTNET = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' as const

export const USDT_MAINNET = '0x55d398326f99059fF775485246999027B3197955' as const
export const USDT_TESTNET = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' as const

// =============================================================================
// Fee Tiers (using SDK's FeeAmount enum)
// =============================================================================

export const FEE_TIERS = {
    LOWEST: FeeAmount.LOWEST,   // 100 = 0.01%
    LOW: FeeAmount.LOW,         // 500 = 0.05%
    MEDIUM: FeeAmount.MEDIUM,   // 2500 = 0.25%
    HIGH: FeeAmount.HIGH,       // 10000 = 1%
} as const

export type FeeTier = FeeAmount

export const FEE_TIER_LABELS: Record<FeeAmount, string> = {
    [FeeAmount.LOWEST]: '0.01%',
    [FeeAmount.LOW]: '0.05%',
    [FeeAmount.MEDIUM]: '0.25%',
    [FeeAmount.HIGH]: '1%',
}

// =============================================================================
// Address Getters
// =============================================================================

export function getPositionManagerAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? V3_POSITION_MANAGER_MAINNET : V3_POSITION_MANAGER_TESTNET
}

export function getV3FactoryAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? V3_FACTORY_MAINNET : V3_FACTORY_TESTNET
}

export function getWBNBAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? WBNB_MAINNET : WBNB_TESTNET
}

export function getUSDTAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? USDT_MAINNET : USDT_TESTNET
}

export function getChainId(chain: Chain = DEFAULT_CHAIN): number {
    return chain.id === BSC_MAINNET.id ? 56 : 97
}

// =============================================================================
// SDK Token Helpers
// =============================================================================

/**
 * Create a PancakeSwap Token instance
 */
export function createToken(
    address: string,
    decimals: number,
    symbol: string,
    name: string,
    chain: Chain = DEFAULT_CHAIN
): Token {
    return new Token(getChainId(chain), address as `0x${string}`, decimals, symbol, name)
}

/**
 * Get WBNB token instance
 */
export function getWBNBToken(chain: Chain = DEFAULT_CHAIN): Token {
    const chainId = getChainId(chain)
    const address = getWBNBAddress(chain)
    return new Token(chainId, address, 18, 'WBNB', 'Wrapped BNB')
}

/**
 * Get USDT token instance
 */
export function getUSDTToken(chain: Chain = DEFAULT_CHAIN): Token {
    const chainId = getChainId(chain)
    const address = getUSDTAddress(chain)
    return new Token(chainId, address, 18, 'USDT', 'Tether USD')
}

// =============================================================================
// ABIs
// =============================================================================

export const POSITION_MANAGER_ABI = [
    {
        inputs: [
            {
                components: [
                    { internalType: 'address', name: 'token0', type: 'address' },
                    { internalType: 'address', name: 'token1', type: 'address' },
                    { internalType: 'uint24', name: 'fee', type: 'uint24' },
                    { internalType: 'int24', name: 'tickLower', type: 'int24' },
                    { internalType: 'int24', name: 'tickUpper', type: 'int24' },
                    { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
                    { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
                    { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
                    { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
                    { internalType: 'address', name: 'recipient', type: 'address' },
                    { internalType: 'uint256', name: 'deadline', type: 'uint256' },
                ],
                internalType: 'struct INonfungiblePositionManager.MintParams',
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'mint',
        outputs: [
            { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
        ],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token0', type: 'address' },
            { internalType: 'address', name: 'token1', type: 'address' },
            { internalType: 'uint24', name: 'fee', type: 'uint24' },
            { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
        ],
        name: 'createAndInitializePoolIfNecessary',
        outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes[]', name: 'data', type: 'bytes[]' }],
        name: 'multicall',
        outputs: [{ internalType: 'bytes[]', name: 'results', type: 'bytes[]' }],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'refundETH',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
] as const

export const V3_FACTORY_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'tokenA', type: 'address' },
            { internalType: 'address', name: 'tokenB', type: 'address' },
            { internalType: 'uint24', name: 'fee', type: 'uint24' },
        ],
        name: 'getPool',
        outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

export const V3_POOL_ABI = [
    {
        inputs: [],
        name: 'slot0',
        outputs: [
            { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
            { internalType: 'int24', name: 'tick', type: 'int24' },
            { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
            { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
            { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
            { internalType: 'uint32', name: 'feeProtocol', type: 'uint32' },
            { internalType: 'bool', name: 'unlocked', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'liquidity',
        outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// =============================================================================
// SDK-Based Helper Functions
// =============================================================================

/**
 * Calculate tick bounds using SDK's TickMath
 * @param currentTick - Current pool tick
 * @param priceRangePercent - ±percentage around current price
 * @param fee - Fee tier determines tick spacing
 */
export function calculateTickBounds(
    currentTick: number,
    priceRangePercent: number,
    fee: FeeAmount
): { tickLower: number; tickUpper: number } {
    const tickSpacing = TICK_SPACINGS[fee]

    // Calculate tick range from percentage
    // Each tick represents ~0.01% price change, so ±100% is roughly ±6932 ticks
    const tickRange = Math.floor(Math.log(1 + priceRangePercent / 100) / Math.log(1.0001))

    // Use SDK's nearestUsableTick to align to tick spacing
    const tickLower = nearestUsableTick(currentTick - tickRange, tickSpacing)
    const tickUpper = nearestUsableTick(currentTick + tickRange, tickSpacing)

    return { tickLower, tickUpper }
}

/**
 * Calculate sqrtPriceX96 from a price using SDK's TickMath
 */
export function priceToSqrtPriceX96(price: number): bigint {
    // price = 1.0001^tick, so tick = log1.0001(price)
    const tick = Math.floor(Math.log(price) / Math.log(1.0001))
    return TickMath.getSqrtRatioAtTick(tick)
}

/**
 * Calculate tick from price
 */
export function priceToTick(price: number): number {
    return Math.floor(Math.log(price) / Math.log(1.0001))
}

// =============================================================================
// Core Functions
// =============================================================================

export async function checkTokenAllowance(
    tokenAddress: string,
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<bigint> {
    const publicClient = createPublicClient({ chain, transport: http() })
    const positionManager = getPositionManagerAddress(chain)

    return publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [ownerAddress as `0x${string}`, positionManager],
    })
}

export async function approveToken(
    walletAddress: string,
    tokenAddress: string,
    amount: bigint,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string }> {
    const positionManager = getPositionManagerAddress(chain)

    const walletClient = createWalletClient({
        chain,
        transport: custom(provider),
    })

    const hash = await walletClient.writeContract({
        account: walletAddress as `0x${string}`,
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [positionManager, amount],
    })

    const publicClient = createPublicClient({ chain, transport: http() })
    await publicClient.waitForTransactionReceipt({ hash })

    logger.info('Token approved', { txHash: hash })
    return { txHash: hash }
}

export async function getPoolAddress(
    tokenA: string,
    tokenB: string,
    fee: FeeAmount,
    chain: Chain = DEFAULT_CHAIN
): Promise<string | null> {
    const publicClient = createPublicClient({ chain, transport: http() })
    const factoryAddress = getV3FactoryAddress(chain)

    const poolAddress = await publicClient.readContract({
        address: factoryAddress,
        abi: V3_FACTORY_ABI,
        functionName: 'getPool',
        args: [tokenA as `0x${string}`, tokenB as `0x${string}`, fee],
    })

    return poolAddress === '0x0000000000000000000000000000000000000000' ? null : poolAddress
}

/**
 * Get the current state of a V3 pool (tick, sqrtPriceX96)
 */
export async function getPoolState(
    poolAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ sqrtPriceX96: bigint; tick: number; liquidity: bigint }> {
    const publicClient = createPublicClient({ chain, transport: http() })

    const [slot0, liquidity] = await Promise.all([
        publicClient.readContract({
            address: poolAddress as `0x${string}`,
            abi: V3_POOL_ABI,
            functionName: 'slot0',
        }),
        publicClient.readContract({
            address: poolAddress as `0x${string}`,
            abi: V3_POOL_ABI,
            functionName: 'liquidity',
        }),
    ])

    return {
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
        liquidity,
    }
}

/**
 * Create an SDK Pool instance from on-chain data
 */
export async function createPoolInstance(
    token0: Token,
    token1: Token,
    fee: FeeAmount,
    poolAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<Pool> {
    const poolState = await getPoolState(poolAddress, chain)

    return new Pool(
        token0,
        token1,
        fee,
        poolState.sqrtPriceX96,
        poolState.liquidity,
        poolState.tick
    )
}

/**
 * Calculate the paired token amount based on pool price and tick range.
 * This replicates PancakeSwap's auto-fill behavior.
 * 
 * @param token0 - Token0 instance
 * @param token1 - Token1 instance  
 * @param fee - Fee tier
 * @param poolAddress - Address of the pool (or null for new pool)
 * @param tickLower - Lower tick bound
 * @param tickUpper - Upper tick bound
 * @param amount - The amount user entered (in wei)
 * @param isAmount0 - True if user entered token0 amount, false for token1
 * @param chain - Chain config
 * @returns The calculated paired amount
 */
export async function calculatePairedAmount(
    token0: Token,
    token1: Token,
    fee: FeeAmount,
    poolAddress: string | null,
    tickLower: number,
    tickUpper: number,
    amount: bigint,
    isAmount0: boolean,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ pairedAmount: bigint; liquidity: bigint }> {
    if (!poolAddress) {
        // For new pools, we can't calculate - user must provide both
        throw new Error('Pool does not exist yet. Please enter both amounts.')
    }

    // Get the pool instance
    const pool = await createPoolInstance(token0, token1, fee, poolAddress, chain)

    let position: Position

    if (isAmount0) {
        // User entered token0 amount, calculate token1
        position = Position.fromAmount0({
            pool,
            tickLower,
            tickUpper,
            amount0: amount,
            useFullPrecision: false,
        })
    } else {
        // User entered token1 amount, calculate token0
        position = Position.fromAmount1({
            pool,
            tickLower,
            tickUpper,
            amount1: amount,
        })
    }

    // Get the mint amounts from the position
    const { amount0, amount1 } = position.mintAmounts

    return {
        pairedAmount: isAmount0 ? amount1 : amount0,
        liquidity: position.liquidity,
    }
}

export async function getTokenBalance(
    tokenAddress: string,
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ balance: bigint; decimals: number; formatted: string }> {
    const publicClient = createPublicClient({ chain, transport: http() })

    const [balance, decimals] = await Promise.all([
        publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [ownerAddress as `0x${string}`],
        }),
        publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'decimals',
        }),
    ])

    return { balance, decimals, formatted: formatUnits(balance, decimals) }
}

export async function getBNBBalance(
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ balance: bigint; formatted: string }> {
    const publicClient = createPublicClient({ chain, transport: http() })
    const balance = await publicClient.getBalance({ address: ownerAddress as `0x${string}` })
    return { balance, formatted: formatEther(balance) }
}

/**
 * Sort tokens by address (required for V3 - token0 < token1)
 */
function sortTokens(tokenA: Token, tokenB: Token): [Token, Token, boolean] {
    const isAFirst = tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
    return isAFirst ? [tokenA, tokenB, true] : [tokenB, tokenA, false]
}

/**
 * Create a V3 liquidity position with BNB using SDK
 */
export async function createPositionWithBNB(
    walletAddress: string,
    tokenAddress: string,
    tokenDecimals: number,
    tokenSymbol: string,
    tokenName: string,
    tokenAmount: bigint,
    bnbAmount: bigint,
    fee: FeeAmount,
    priceRatio: number,
    priceRangePercent: number,
    slippagePercent: number,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string; tokenId: bigint | null; liquidity: bigint | null }> {
    try {
        const positionManager = getPositionManagerAddress(chain)
        const chainId = getChainId(chain)

        // Create SDK Token instances
        const token = createToken(tokenAddress, tokenDecimals, tokenSymbol, tokenName, chain)
        const wbnb = getWBNBToken(chain)

        // Sort tokens (SDK requirement)
        const [token0, token1, isTokenFirst] = sortTokens(token, wbnb)
        const amount0 = isTokenFirst ? tokenAmount : bnbAmount
        const amount1 = isTokenFirst ? bnbAmount : tokenAmount

        const walletClient = createWalletClient({ chain, transport: custom(provider) })
        const publicClient = createPublicClient({ chain, transport: http() })

        // Check if pool exists FIRST
        const existingPool = await getPoolAddress(token0.address, token1.address, fee, chain)
        const isNewPool = !existingPool

        let currentTick: number
        let sqrtPriceX96: bigint

        if (isNewPool) {
            // For new pools, use our calculated price
            const currentPrice = isTokenFirst ? priceRatio : 1 / priceRatio
            currentTick = priceToTick(currentPrice)
            sqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

            logger.info('Creating new pool with initial price', { currentTick, sqrtPriceX96: sqrtPriceX96.toString() })

            const createPoolHash = await walletClient.writeContract({
                account: walletAddress as `0x${string}`,
                address: positionManager,
                abi: POSITION_MANAGER_ABI,
                functionName: 'createAndInitializePoolIfNecessary',
                args: [
                    token0.address as `0x${string}`,
                    token1.address as `0x${string}`,
                    fee,
                    sqrtPriceX96,
                ],
                value: 0n,
            })
            await publicClient.waitForTransactionReceipt({ hash: createPoolHash })
            logger.info('Pool created', { txHash: createPoolHash })

            // After creating pool, get its state
            const newPoolAddress = await getPoolAddress(token0.address, token1.address, fee, chain)
            if (!newPoolAddress) throw new Error('Pool creation failed')
            const poolState = await getPoolState(newPoolAddress, chain)
            currentTick = poolState.tick
            sqrtPriceX96 = poolState.sqrtPriceX96
        } else {
            // For existing pools, use the ACTUAL pool tick
            const poolState = await getPoolState(existingPool, chain)
            currentTick = poolState.tick
            sqrtPriceX96 = poolState.sqrtPriceX96

            logger.info('Using existing pool', {
                poolAddress: existingPool,
                currentTick,
                sqrtPriceX96: sqrtPriceX96.toString(),
                liquidity: poolState.liquidity.toString()
            })
        }

        // Calculate tick bounds around the ACTUAL current tick
        const { tickLower, tickUpper } = calculateTickBounds(currentTick, priceRangePercent, fee)

        // Get the pool address (it now exists)
        const poolAddress = existingPool || await getPoolAddress(token0.address, token1.address, fee, chain)
        if (!poolAddress) throw new Error('Pool not found')

        // Create SDK Pool instance for proper calculations
        const pool = await createPoolInstance(token0, token1, fee, poolAddress, chain)

        // Use SDK Position.fromAmounts to calculate proper liquidity and amounts
        const position = Position.fromAmounts({
            pool,
            tickLower,
            tickUpper,
            amount0: amount0,
            amount1: amount1,
            useFullPrecision: false, // Use router-compatible precision
        })

        // Get the actual mint amounts from the position
        const { amount0: mintAmount0, amount1: mintAmount1 } = position.mintAmounts

        // Get slippage-adjusted minimums using SDK's proper calculation
        const slippageTolerance = new Percent(Math.floor(slippagePercent * 100), 10000)
        const { amount0: amount0Min, amount1: amount1Min } = position.mintAmountsWithSlippage(slippageTolerance)

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

        logger.info('Minting V3 position with SDK calculations', {
            token0: token0.address,
            token1: token1.address,
            fee,
            tickLower,
            tickUpper,
            currentTick,
            liquidity: position.liquidity.toString(),
            mintAmount0: mintAmount0.toString(),
            mintAmount1: mintAmount1.toString(),
            amount0Min: amount0Min.toString(),
            amount1Min: amount1Min.toString(),
        })

        // Mint position
        const hash = await walletClient.writeContract({
            account: walletAddress as `0x${string}`,
            address: positionManager,
            abi: POSITION_MANAGER_ABI,
            functionName: 'mint',
            args: [{
                token0: token0.address as `0x${string}`,
                token1: token1.address as `0x${string}`,
                fee,
                tickLower,
                tickUpper,
                amount0Desired: mintAmount0,
                amount1Desired: mintAmount1,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                recipient: walletAddress as `0x${string}`,
                deadline,
            }],
            value: isTokenFirst ? mintAmount1 : mintAmount0, // Send BNB (mintAmount1 if our token is first, mintAmount0 if WBNB is first)
        })

        await publicClient.waitForTransactionReceipt({ hash })

        logger.info('V3 position created', { txHash: hash })
        return { txHash: hash, tokenId: null, liquidity: null }
    } catch (error: any) {
        logger.error('Failed to create V3 position with BNB', { error: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to create V3 position')
    }
}

/**
 * Create a V3 liquidity position with USDT using SDK
 */
export async function createPositionWithToken(
    walletAddress: string,
    tokenAAddress: string,
    tokenADecimals: number,
    tokenASymbol: string,
    tokenAName: string,
    tokenBAddress: string,
    amountA: bigint,
    amountB: bigint,
    fee: FeeAmount,
    priceRatio: number,
    priceRangePercent: number,
    slippagePercent: number,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string; tokenId: bigint | null; liquidity: bigint | null }> {
    try {
        const positionManager = getPositionManagerAddress(chain)

        // Create SDK Token instances
        const tokenA = createToken(tokenAAddress, tokenADecimals, tokenASymbol, tokenAName, chain)
        const tokenB = getUSDTToken(chain)

        // Sort tokens
        const [token0, token1, isAFirst] = sortTokens(tokenA, tokenB)
        const amount0 = isAFirst ? amountA : amountB
        const amount1 = isAFirst ? amountB : amountA

        const walletClient = createWalletClient({ chain, transport: custom(provider) })
        const publicClient = createPublicClient({ chain, transport: http() })

        // Check if pool exists FIRST
        const existingPool = await getPoolAddress(token0.address, token1.address, fee, chain)
        const isNewPool = !existingPool

        let currentTick: number
        let sqrtPriceX96: bigint

        if (isNewPool) {
            // For new pools, use our calculated price
            const currentPrice = isAFirst ? priceRatio : 1 / priceRatio
            currentTick = priceToTick(currentPrice)
            sqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

            const createPoolHash = await walletClient.writeContract({
                account: walletAddress as `0x${string}`,
                address: positionManager,
                abi: POSITION_MANAGER_ABI,
                functionName: 'createAndInitializePoolIfNecessary',
                args: [
                    token0.address as `0x${string}`,
                    token1.address as `0x${string}`,
                    fee,
                    sqrtPriceX96,
                ],
            })
            await publicClient.waitForTransactionReceipt({ hash: createPoolHash })

            // After creating pool, get its state
            const newPoolAddress = await getPoolAddress(token0.address, token1.address, fee, chain)
            if (!newPoolAddress) throw new Error('Pool creation failed')
            const poolState = await getPoolState(newPoolAddress, chain)
            currentTick = poolState.tick
            sqrtPriceX96 = poolState.sqrtPriceX96
        } else {
            // For existing pools, use the ACTUAL pool tick
            const poolState = await getPoolState(existingPool, chain)
            currentTick = poolState.tick
            sqrtPriceX96 = poolState.sqrtPriceX96
        }

        // Calculate tick bounds around the ACTUAL current tick
        const { tickLower, tickUpper } = calculateTickBounds(currentTick, priceRangePercent, fee)

        // Get the pool address (it now exists)
        const poolAddress = existingPool || await getPoolAddress(token0.address, token1.address, fee, chain)
        if (!poolAddress) throw new Error('Pool not found')

        // Create SDK Pool instance for proper calculations
        const pool = await createPoolInstance(token0, token1, fee, poolAddress, chain)

        // Use SDK Position.fromAmounts to calculate proper liquidity and amounts
        const position = Position.fromAmounts({
            pool,
            tickLower,
            tickUpper,
            amount0: amount0,
            amount1: amount1,
            useFullPrecision: false,
        })

        // Get the actual mint amounts from the position
        const { amount0: mintAmount0, amount1: mintAmount1 } = position.mintAmounts

        // Get slippage-adjusted minimums
        const slippageTolerance = new Percent(Math.floor(slippagePercent * 100), 10000)
        const { amount0: amount0Min, amount1: amount1Min } = position.mintAmountsWithSlippage(slippageTolerance)

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

        logger.info('Minting V3 position with SDK calculations', {
            token0: token0.address,
            token1: token1.address,
            fee,
            tickLower,
            tickUpper,
            currentTick,
            liquidity: position.liquidity.toString(),
            mintAmount0: mintAmount0.toString(),
            mintAmount1: mintAmount1.toString(),
        })

        // Mint position
        const hash = await walletClient.writeContract({
            account: walletAddress as `0x${string}`,
            address: positionManager,
            abi: POSITION_MANAGER_ABI,
            functionName: 'mint',
            args: [{
                token0: token0.address as `0x${string}`,
                token1: token1.address as `0x${string}`,
                fee,
                tickLower,
                tickUpper,
                amount0Desired: mintAmount0,
                amount1Desired: mintAmount1,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                recipient: walletAddress as `0x${string}`,
                deadline,
            }],
        })

        await publicClient.waitForTransactionReceipt({ hash })

        logger.info('V3 position created', { txHash: hash })
        return { txHash: hash, tokenId: null, liquidity: null }
    } catch (error: any) {
        logger.error('Failed to create V3 position', { error: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to create V3 position')
    }
}

// Export types
export type PairType = 'BNB' | 'USDT'
