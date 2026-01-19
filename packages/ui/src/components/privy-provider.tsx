'use client'

import { type ReactNode, useMemo } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'

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
  logo?: string
}

export function PrivyProviderWrapper({ children, appId, appUrl, logo }: PrivyProviderWrapperProps) {
  const finalAppId = appId || process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!finalAppId) {
    console.error('PrivyProviderWrapper: appId is missing. Authentication will not work.')
    return (
      <div className='flex min-h-screen items-center justify-center bg-black p-4 font-mono text-red-500'>
        <div className='max-w-lg rounded border border-red-500 p-4'>
          <h2 className='mb-2 font-bold text-xl'>Privy Config Error</h2>
          <p>
            Missing <code>NEXT_PUBLIC_PRIVY_APP_ID</code>.
          </p>
          <p className='mt-2 text-red-400 text-sm'>
            Please add this environment variable to your .env.local file.
          </p>
        </div>
      </div>
    )
  }

  console.log('[PrivyProviderWrapper] Initializing with App ID:', `${finalAppId?.slice(0, 6)}...`)
  console.warn(
    '[PrivyProviderWrapper] If you see 403 errors, ensure http://localhost:3000 and http://localhost:3001 are in your Privy Dashboard Allowed Domains'
  )

  const privyConfig = useMemo(
    () => ({
      loginMethods: [
        'wallet' as const,
        'email' as const,
        'google' as const,
        'twitter' as const,
        'discord' as const,
        'github' as const,
        'apple' as const,
      ],
      appearance: {
        theme: 'dark' as const,
        accentColor: '#0EE0C6' as const,
        logo: logo || (appUrl ? `${appUrl}/wazabi.svg` : undefined),
        showWalletLoginFirst: true,
        landingHeader: 'Wazabi',
      },
      embeddedWallets: {
        ethereum: {
          createOnLogin: 'users-without-wallets' as const,
        },
      },
      supportedChains: [BSC_TESTNET, BSC_MAINNET],
      session: {
        duration: '30d' as const,
        renew: true,
        redirectToAfterLogin: false,
      },
      storageMethod: 'localStorage' as const,
    }),
    [appUrl]
  )

  return (
    <PrivyProvider appId={finalAppId} config={privyConfig}>
      {children}
    </PrivyProvider>
  )
}
