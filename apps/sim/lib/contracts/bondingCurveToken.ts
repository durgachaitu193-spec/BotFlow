import { createLogger } from '@sim/logger'
import {
    type Chain,
    createPublicClient,
    createWalletClient,
    custom,
    http,
    formatEther,
} from 'viem'
import { DEFAULT_CHAIN } from './didRegistry'

const logger = createLogger('BondingCurveToken')

// ABI for DynamicBondingCurveToken - the token contract with bonding curve
export const BONDING_CURVE_TOKEN_ABI = [
    // ERC20 standard functions
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    // Bonding curve functions
    {
        inputs: [],
        name: 'reserveBalance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'isInitialized',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'currentSupply', type: 'uint256' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'calculateTotalCost',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'currentSupply', type: 'uint256' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'calculateTotalSellingCost',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'recipient', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'buyTokens',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'seller', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'sellTokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

/**
 * Get token info from the bonding curve token contract
 */
export async function getTokenInfo(
    tokenAddress: string,
    chain: Chain = DEFAULT_CHAIN
): Promise<{
    name: string
    symbol: string
    totalSupply: bigint
    reserveBalance: bigint
    isInitialized: boolean
}> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
        })

        const [name, symbol, totalSupply, reserveBalance, isInitialized] = await Promise.all([
            publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: BONDING_CURVE_TOKEN_ABI,
                functionName: 'name',
            }),
            publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: BONDING_CURVE_TOKEN_ABI,
                functionName: 'symbol',
            }),
            publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: BONDING_CURVE_TOKEN_ABI,
                functionName: 'totalSupply',
            }),
            publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: BONDING_CURVE_TOKEN_ABI,
                functionName: 'reserveBalance',
            }),
            publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: BONDING_CURVE_TOKEN_ABI,
                functionName: 'isInitialized',
            }),
        ])

        return {
            name: name as string,
            symbol: symbol as string,
            totalSupply: totalSupply as bigint,
            reserveBalance: reserveBalance as bigint,
            isInitialized: isInitialized as boolean,
        }
    } catch (error: any) {
        logger.error('Error getting token info:', { message: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to get token info')
    }
}

/**
 * Calculate the cost to buy tokens using the bonding curve
 * @param tokenAddress - The token contract address
 * @param amount - Number of tokens to buy (not scaled)
 * @returns The cost in BNB as a bigint
 */
export async function calculateBuyCost(
    tokenAddress: string,
    amount: bigint,
    chain: Chain = DEFAULT_CHAIN
): Promise<bigint> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
        })

        // Get current total supply first
        const totalSupply = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'totalSupply',
        })

        // Calculate cost based on current supply
        const cost = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'calculateTotalCost',
            args: [totalSupply as bigint, amount],
        })

        logger.info('Calculated buy cost', {
            tokenAddress,
            amount: amount.toString(),
            totalSupply: (totalSupply as bigint).toString(),
            cost: (cost as bigint).toString(),
        })

        return cost as bigint
    } catch (error: any) {
        logger.error('Error calculating buy cost:', { message: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to calculate buy cost')
    }
}

/**
 * Calculate the return from selling tokens
 * @param tokenAddress - The token contract address
 * @param amount - Number of tokens to sell (not scaled)
 * @returns The return in BNB as a bigint
 */
export async function calculateSellReturn(
    tokenAddress: string,
    amount: bigint,
    chain: Chain = DEFAULT_CHAIN
): Promise<bigint> {
    try {
        const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
        })

        // Get current total supply first
        const totalSupply = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'totalSupply',
        })

        // Calculate return based on current supply
        const returnAmount = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'calculateTotalSellingCost',
            args: [totalSupply as bigint, amount],
        })

        logger.info('Calculated sell return', {
            tokenAddress,
            amount: amount.toString(),
            returnAmount: (returnAmount as bigint).toString(),
        })

        return returnAmount as bigint
    } catch (error: any) {
        logger.error('Error calculating sell return:', { message: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to calculate sell return')
    }
}

/**
 * Buy tokens from the bonding curve
 * @param walletAddress - The buyer's wallet address
 * @param tokenAddress - The token contract address
 * @param amount - Number of tokens to buy (not scaled)
 * @param provider - Ethereum provider
 * @returns Transaction hash
 */
export async function buyTokens(
    walletAddress: string,
    tokenAddress: string,
    amount: bigint,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string }> {
    try {
        if (!provider) {
            throw new Error('Ethereum provider not available')
        }

        // Calculate cost first
        const cost = await calculateBuyCost(tokenAddress, amount, chain)

        logger.info('Buying tokens', {
            tokenAddress,
            amount: amount.toString(),
            cost: formatEther(cost),
        })

        const walletClient = createWalletClient({
            account: walletAddress as `0x${string}`,
            chain,
            transport: custom(provider),
        })

        const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
        })

        // Execute buy transaction
        const hash = await walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'buyTokens',
            args: [walletAddress as `0x${string}`, amount],
            value: cost,
        })

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash })

        logger.info('Token purchase successful', { txHash: hash })

        return { txHash: hash }
    } catch (error: any) {
        logger.error('Error buying tokens:', { message: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to buy tokens')
    }
}

/**
 * Sell tokens to the bonding curve
 * @param walletAddress - The seller's wallet address
 * @param tokenAddress - The token contract address
 * @param amount - Number of tokens to sell (not scaled)
 * @param provider - Ethereum provider
 * @returns Transaction hash
 */
export async function sellTokens(
    walletAddress: string,
    tokenAddress: string,
    amount: bigint,
    provider: any,
    chain: Chain = DEFAULT_CHAIN
): Promise<{ txHash: string }> {
    try {
        if (!provider) {
            throw new Error('Ethereum provider not available')
        }

        logger.info('Selling tokens', {
            tokenAddress,
            amount: amount.toString(),
        })

        const walletClient = createWalletClient({
            account: walletAddress as `0x${string}`,
            chain,
            transport: custom(provider),
        })

        const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
        })

        // Execute sell transaction
        const hash = await walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'sellTokens',
            args: [walletAddress as `0x${string}`, amount],
        })

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash })

        logger.info('Token sale successful', { txHash: hash })

        return { txHash: hash }
    } catch (error: any) {
        logger.error('Error selling tokens:', { message: error?.message || String(error) })
        throw new Error(error?.message || 'Failed to sell tokens')
    }
}
