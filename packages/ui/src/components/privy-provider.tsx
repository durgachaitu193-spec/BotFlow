'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import type { ReactNode } from 'react'

export const BSC_TESTNET = {
    id: 97,
    name: 'Binance Smart Chain Testnet',
    network: 'bsc-testnet',
    nativeCurrency: {
        name: 'Binance Coin',
        symbol: 'tBNB',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        },
        public: {
            http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BscScan',
            url: 'https://testnet.bscscan.com',
        },
    },
    testnet: true,
}

export const BSC_MAINNET = {
    id: 56,
    name: 'Binance Smart Chain',
    network: 'bsc',
    nativeCurrency: {
        name: 'Binance Coin',
        symbol: 'BNB',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://bsc-dataseed.binance.org'],
        },
        public: {
            http: ['https://bsc-dataseed.binance.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BscScan',
            url: 'https://bscscan.com',
        },
    },
    testnet: false,
}

interface PrivyProviderWrapperProps {
    children: ReactNode
    appId?: string
    appUrl?: string

}

export function PrivyProviderWrapper({ children, appId, appUrl }: PrivyProviderWrapperProps) {
    const finalAppId = appId || process.env.NEXT_PUBLIC_PRIVY_APP_ID

    if (!finalAppId) {
        console.error('PrivyProviderWrapper: appId is missing. Authentication will not work.')
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono p-4">
                <div className="border border-red-500 rounded p-4 max-w-lg">
                    <h2 className="text-xl font-bold mb-2">Privy Config Error</h2>
                    <p>Missing <code>NEXT_PUBLIC_PRIVY_APP_ID</code>.</p>
                    <p className="text-sm mt-2 text-red-400">Please add this environment variable to your .env.local file.</p>
                </div>
            </div>
        )
    }

    console.log('[PrivyProviderWrapper] Initializing with App ID:', finalAppId?.slice(0, 6) + '...')
    console.warn('[PrivyProviderWrapper] If you see 403 errors, ensure http://localhost:3000 and http://localhost:3001 are in your Privy Dashboard Allowed Domains')

    return (
        <PrivyProvider
            appId={finalAppId}
            config={{
                loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord', 'github', 'apple'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#0EE0C6',
                    logo: appUrl ? `${appUrl}/megalith.svg` : undefined,
                    showWalletLoginFirst: true,
                    landingHeader: 'MegalithLabs',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                supportedChains: [BSC_TESTNET, BSC_MAINNET],
            }}
        >
            {children}
        </PrivyProvider>
    )
}
