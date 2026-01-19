import { createLogger } from '@wazabi/logger'
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
} from 'viem'
import { DEFAULT_CHAIN, BSC_MAINNET, BSC_TESTNET } from './didRegistry'

const logger = createLogger('PancakeRouter')

// PancakeSwap V2 Router addresses
export const PANCAKE_ROUTER_V2_MAINNET = '0x10ED43C718714eb63d5aA57B78B54704E256024E' as const
export const PANCAKE_ROUTER_V2_TESTNET = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' as const

// PancakeSwap V2 Factory addresses
export const PANCAKE_FACTORY_V2_MAINNET = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' as const
export const PANCAKE_FACTORY_V2_TESTNET = '0x6725F303b657a9451d8BA641348b6761A6CC7a17' as const

// WBNB addresses
export const WBNB_MAINNET = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as const
export const WBNB_TESTNET = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' as const

// USDT addresses (BSC)
export const USDT_MAINNET = '0x55d398326f99059fF775485246999027B3197955' as const
export const USDT_TESTNET = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' as const

// Get addresses based on chain
export function getRouterAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? PANCAKE_ROUTER_V2_MAINNET : PANCAKE_ROUTER_V2_TESTNET
}

export function getFactoryAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? PANCAKE_FACTORY_V2_MAINNET : PANCAKE_FACTORY_V2_TESTNET
}

export function getWBNBAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? WBNB_MAINNET : WBNB_TESTNET
}

export function getUSDTAddress(chain: Chain = DEFAULT_CHAIN): `0x${string}` {
    return chain.id === BSC_MAINNET.id ? USDT_MAINNET : USDT_TESTNET
}

// PancakeSwap V2 Router ABI (only functions we need)
export const PANCAKE_ROUTER_V2_ABI = [
    {
        inputs: [],
        name: 'WETH',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'factory',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'tokenA', type: 'address' },
            { internalType: 'address', name: 'tokenB', type: 'address' },
            { internalType: 'uint256', name: 'amountADesired', type: 'uint256' },
            { internalType: 'uint256', name: 'amountBDesired', type: 'uint256' },
            { internalType: 'uint256', name: 'amountAMin', type: 'uint256' },
            { internalType: 'uint256', name: 'amountBMin', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        name: 'addLiquidity',
        outputs: [
            { internalType: 'uint256', name: 'amountA', type: 'uint256' },
            { internalType: 'uint256', name: 'amountB', type: 'uint256' },
            { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amountTokenDesired', type: 'uint256' },
            { internalType: 'uint256', name: 'amountTokenMin', type: 'uint256' },
            { internalType: 'uint256', name: 'amountETHMin', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        name: 'addLiquidityETH',
        outputs: [
            { internalType: 'uint256', name: 'amountToken', type: 'uint256' },
            { internalType: 'uint256', name: 'amountETH', type: 'uint256' },
            { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
        ],
        stateMutability: 'payable',
        type: 'function',
    },
] as const

// PancakeSwap V2 Factory ABI (only functions we need)
export const PANCAKE_FACTORY_V2_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'tokenA', type: 'address' },
            { internalType: 'address', name: 'tokenB', type: 'address' },
        ],
        name: 'getPair',
        outputs: [{ internalType: 'address', name: 'pair', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// LP Token ABI (ERC20 with extra pair info)
export const LP_TOKEN_ABI = [
    ...erc20Abi,
    {
        inputs: [],
        name: 'token0',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'token1',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getReserves',
        outputs: [
            { internalType: 'uint112', name: 'reserve0', type: 'uint112' },
            { internalType: 'uint112', name: 'reserve1', type: 'uint112' },
            { internalType: 'uint32', name: 'blockTimestampLast', type: 'uint32' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const

/**
 * Check token allowance for spending by the router
 */
export async function checkTokenAllowance(
    tokenAddress: string,
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<bigint> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        const routerAddress = getRouterAddress(chain)

        const allowance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [ownerAddress as `0x${string}`, routerAddress],
        })

        logger.info('Checked token allowance', {
            tokenAddress,
            ownerAddress,
            routerAddress,
            allowance: allowance.toString(),
        })

        return allowance
    } catch (error) {
        logger.error('Failed to check token allowance', { error })
        throw error
    }
}

/**
 * Approve token for spending by the PancakeSwap router
 */
export async function approveToken(
    walletAddress: string,
    tokenAddress: string,
    amount: bigint,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string }> {
    try {
        const routerAddress = getRouterAddress(chain)

        logger.info('Approving token for router', {
            walletAddress,
            tokenAddress,
            routerAddress,
            amount: amount.toString(),
        })

        const walletClient = createWalletClient({
            chain,
            transport: custom(provider),
        })

        const hash = await walletClient.writeContract({
            account: walletAddress as `0x${string}`,
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'approve',
            args: [routerAddress, amount],
        })

        logger.info('Token approval submitted', { txHash: hash })

        // Wait for confirmation
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        await publicClient.waitForTransactionReceipt({ hash })

        logger.info('Token approval confirmed', { txHash: hash })

        return { txHash: hash }
    } catch (error) {
        logger.error('Failed to approve token', { error })
        throw error
    }
}

/**
 * Get token balance for an address
 */
export async function getTokenBalance(
    tokenAddress: string,
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ balance: bigint; decimals: number; formatted: string }> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

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

        return {
            balance,
            decimals,
            formatted: formatUnits(balance, decimals),
        }
    } catch (error) {
        logger.error('Failed to get token balance', { error })
        throw error
    }
}

/**
 * Get BNB balance for an address
 */
export async function getBNBBalance(
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ balance: bigint; formatted: string }> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        const balance = await publicClient.getBalance({
            address: ownerAddress as `0x${string}`,
        })

        return {
            balance,
            formatted: formatEther(balance),
        }
    } catch (error) {
        logger.error('Failed to get BNB balance', { error })
        throw error
    }
}

/**
 * Add liquidity with BNB (TOKEN/BNB pair)
 */
export async function addLiquidityETH(
    walletAddress: string,
    tokenAddress: string,
    tokenAmount: bigint,
    bnbAmount: bigint,
    slippagePercent: number = 0.5, // 0.5% default slippage
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{
    txHash: string
    amountToken: bigint
    amountBNB: bigint
    liquidity: bigint
}> {
    try {
        const routerAddress = getRouterAddress(chain)

        // Calculate minimum amounts with slippage
        const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100))
        const amountTokenMin = (tokenAmount * slippageMultiplier) / 10000n
        const amountBNBMin = (bnbAmount * slippageMultiplier) / 10000n

        // Deadline 20 minutes from now
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

        logger.info('Adding liquidity with BNB', {
            walletAddress,
            tokenAddress,
            tokenAmount: tokenAmount.toString(),
            bnbAmount: bnbAmount.toString(),
            amountTokenMin: amountTokenMin.toString(),
            amountBNBMin: amountBNBMin.toString(),
            deadline: deadline.toString(),
        })

        const walletClient = createWalletClient({
            chain,
            transport: custom(provider),
        })

        const hash = await walletClient.writeContract({
            account: walletAddress as `0x${string}`,
            address: routerAddress,
            abi: PANCAKE_ROUTER_V2_ABI,
            functionName: 'addLiquidityETH',
            args: [
                tokenAddress as `0x${string}`,
                tokenAmount,
                amountTokenMin,
                amountBNBMin,
                walletAddress as `0x${string}`,
                deadline,
            ],
            value: bnbAmount,
        })

        logger.info('Add liquidity transaction submitted', { txHash: hash })

        // Wait for confirmation
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        logger.info('Add liquidity transaction confirmed', {
            txHash: hash,
            blockNumber: receipt.blockNumber,
        })

        // Parse logs to get actual amounts (simplified - would need proper log parsing)
        return {
            txHash: hash,
            amountToken: tokenAmount,
            amountBNB: bnbAmount,
            liquidity: 0n, // Would need to parse from logs
        }
    } catch (error) {
        logger.error('Failed to add liquidity with BNB', { error })
        throw error
    }
}

/**
 * Add liquidity with another token (TOKEN/USDT pair)
 */
export async function addLiquidity(
    walletAddress: string,
    tokenAAddress: string,
    tokenBAddress: string,
    amountA: bigint,
    amountB: bigint,
    slippagePercent: number = 0.5,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{
    txHash: string
    amountA: bigint
    amountB: bigint
    liquidity: bigint
}> {
    try {
        const routerAddress = getRouterAddress(chain)

        // Calculate minimum amounts with slippage
        const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100))
        const amountAMin = (amountA * slippageMultiplier) / 10000n
        const amountBMin = (amountB * slippageMultiplier) / 10000n

        // Deadline 20 minutes from now
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

        logger.info('Adding liquidity', {
            walletAddress,
            tokenAAddress,
            tokenBAddress,
            amountA: amountA.toString(),
            amountB: amountB.toString(),
            amountAMin: amountAMin.toString(),
            amountBMin: amountBMin.toString(),
            deadline: deadline.toString(),
        })

        const walletClient = createWalletClient({
            chain,
            transport: custom(provider),
        })

        const hash = await walletClient.writeContract({
            account: walletAddress as `0x${string}`,
            address: routerAddress,
            abi: PANCAKE_ROUTER_V2_ABI,
            functionName: 'addLiquidity',
            args: [
                tokenAAddress as `0x${string}`,
                tokenBAddress as `0x${string}`,
                amountA,
                amountB,
                amountAMin,
                amountBMin,
                walletAddress as `0x${string}`,
                deadline,
            ],
        })

        logger.info('Add liquidity transaction submitted', { txHash: hash })

        // Wait for confirmation
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        logger.info('Add liquidity transaction confirmed', {
            txHash: hash,
            blockNumber: receipt.blockNumber,
        })

        return {
            txHash: hash,
            amountA,
            amountB,
            liquidity: 0n,
        }
    } catch (error) {
        logger.error('Failed to add liquidity', { error })
        throw error
    }
}

/**
 * Get pair address for two tokens
 */
export async function getPairAddress(
    tokenA: string,
    tokenB: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<string | null> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        const factoryAddress = getFactoryAddress(chain)

        const pairAddress = await publicClient.readContract({
            address: factoryAddress,
            abi: PANCAKE_FACTORY_V2_ABI,
            functionName: 'getPair',
            args: [tokenA as `0x${string}`, tokenB as `0x${string}`],
        })

        // Zero address means no pair exists
        if (pairAddress === '0x0000000000000000000000000000000000000000') {
            return null
        }

        return pairAddress
    } catch (error) {
        logger.error('Failed to get pair address', { error })
        throw error
    }
}

/**
 * Get LP token balance
 */
export async function getLPBalance(
    pairAddress: string,
    ownerAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ balance: bigint; formatted: string }> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        })

        const balance = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: LP_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [ownerAddress as `0x${string}`],
        })

        return {
            balance,
            formatted: formatEther(balance), // LP tokens have 18 decimals
        }
    } catch (error) {
        logger.error('Failed to get LP balance', { error })
        throw error
    }
}

// Export types
export type PairType = 'BNB' | 'USDT'

export interface LiquidityParams {
    tokenAddress: string
    tokenAmount: string // Human readable amount
    pairType: PairType
    pairAmount: string // Human readable amount (BNB or USDT)
    slippagePercent?: number
}
