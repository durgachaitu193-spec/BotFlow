'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { BSC_MAINNET, BSC_TESTNET } from './contracts/didRegistry'
import { getEnv } from './core/config/env'

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const privyAppId = getEnv('NEXT_PUBLIC_PRIVY_APP_ID')

  if (!privyAppId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set. Privy authentication will not work.')
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord', 'github', 'apple'],
        appearance: {
          theme: 'dark',
          accentColor: '#0EE0C6',
          logo: getEnv('NEXT_PUBLIC_APP_URL')
            ? `${getEnv('NEXT_PUBLIC_APP_URL')}/megalith.svg`
            : undefined,
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

