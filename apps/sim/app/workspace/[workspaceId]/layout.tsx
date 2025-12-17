'use client'

import { Tooltip } from '@/components/emcn'
import { GlobalCommandsProvider } from '@/app/workspace/[workspaceId]/providers/global-commands-provider'
import { ProviderModelsLoader } from '@/app/workspace/[workspaceId]/providers/provider-models-loader'
import { SettingsLoader } from '@/app/workspace/[workspaceId]/providers/settings-loader'
import { WorkspacePermissionsProvider } from '@/app/workspace/[workspaceId]/providers/workspace-permissions-provider'
import { SidebarNew } from '@/app/workspace/[workspaceId]/w/components/sidebar/sidebar-new'
import { clearUserData, useSidebarStore } from '@/stores'
import { Navbar, LaunchpadNavbar } from '@sim/ui'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed)

  return (
    <>
      <SettingsLoader />
      <ProviderModelsLoader />
      <GlobalCommandsProvider>
        <Tooltip.Provider delayDuration={600} skipDelayDuration={0}>
          <WorkspacePermissionsProvider>
            <div className="flex h-screen w-full flex-col overflow-hidden">
              <LaunchpadNavbar currentApp="builder" />
              <div className='flex flex-1 overflow-hidden'>
                <SidebarNew />
                <div className='flex flex-1 flex-col overflow-hidden w-full relative'>
                  <Navbar currentApp="builder" isCollapsed={isCollapsed} onSignOut={clearUserData} />
                  {children}
                </div>
              </div>
            </div>
          </WorkspacePermissionsProvider>
        </Tooltip.Provider>
      </GlobalCommandsProvider>
    </>
  )
}
