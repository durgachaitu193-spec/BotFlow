'use client'

import type { ReactNode } from 'react'
import { PrivyProviderWrapper } from '@botflow/ui'
import { AppProvider } from '@/context/AppContext'
import { UserDetailsProvider } from '@/context/UserDetailContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderWrapper
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      logo="/logo/botflow-icon-dark.png"
    >
      <AppProvider>
        <UserDetailsProvider>{children}</UserDetailsProvider>
      </AppProvider>
    </PrivyProviderWrapper>
  )
}
