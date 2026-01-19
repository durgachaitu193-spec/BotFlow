'use client'

import type { ReactNode } from 'react'
import { PrivyProviderWrapper } from '@wazabi/ui'
import { AppProvider } from '@/context/AppContext'
import { UserDetailsProvider } from '@/context/UserDetailContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderWrapper>
      <AppProvider>
        <UserDetailsProvider>{children}</UserDetailsProvider>
      </AppProvider>
    </PrivyProviderWrapper>
  )
}
