'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { createLogger } from '@wazabi/logger'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/auth-client'

const logger = createLogger('WorkspacePage')

export default function WorkspacePage() {
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { ready: privyReady, authenticated: privyAuthenticated } = usePrivy()

  useEffect(() => {
    const redirectToFirstWorkspace = async () => {
      // Don't do anything until Privy is ready
      if (!privyReady || isPending) {
        return
      }

      // If user is authenticated via Privy but we don't have an app session yet,
      // wait a bit and retry the refetch. This handles the case where the user
      // has a valid Privy session but the app session cookie hasn't been established yet.
      if (privyAuthenticated && !session?.user) {
        if (!isRetrying) {
          logger.info('Privy authenticated but app session missing, retrying refetch...')
          setIsRetrying(true)
          await refetch()
          return
        }
      }

      // If user is truly not authenticated, redirect to login
      // Wait a bit longer to be sure they are truly not authenticated
      if (!session?.user) {
        // If Privy is not ready yet, or we're still retrying, give it more time
        if (!privyReady || isRetrying) {
          return
        }

        // Final check: if Privy says NOT authenticated and we have no session, then redirect
        if (!privyAuthenticated) {
          logger.info('User not authenticated (Privy or App), redirecting to login')
          router.replace('/login')
        } else {
          // If Privy IS authenticated but session is missing, try one last refetch
          logger.info('Privy authenticated but session still missing, one final retry...')
          await refetch()
        }
        return
      }

      try {
        setIsRedirecting(true)
        const urlParams = new URLSearchParams(window.location.search)
        const redirectWorkflowId = urlParams.get('redirect_workflow')

        if (redirectWorkflowId) {
          try {
            const workflowResponse = await fetch(`/api/workflows/${redirectWorkflowId}`)
            if (workflowResponse.ok) {
              const workflowData = await workflowResponse.json()
              const workspaceId = workflowData.data?.workspaceId

              if (workspaceId) {
                logger.info(
                  `Redirecting workflow ${redirectWorkflowId} to workspace ${workspaceId}`
                )
                router.replace(`/workspace/${workspaceId}/w/${redirectWorkflowId}`)
                return
              }
            }
          } catch (error) {
            logger.error('Error fetching workflow for redirect:', error)
          }
        }

        const response = await fetch('/api/workspaces')

        if (!response.ok) {
          throw new Error('Failed to fetch workspaces')
        }

        const data = await response.json()
        const workspaces = data.workspaces || []

        if (workspaces.length === 0) {
          logger.warn('No workspaces found for user, creating default workspace')

          try {
            const createResponse = await fetch('/api/workspaces', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: 'My Workspace' }),
            })

            if (createResponse.ok) {
              const createData = await createResponse.json()
              const newWorkspace = createData.workspace

              if (newWorkspace?.id) {
                logger.info(`Created default workspace: ${newWorkspace.id}`)
                router.replace(`/workspace/${newWorkspace.id}/w`)
                return
              }
            }

            logger.error('Failed to create default workspace')
          } catch (createError) {
            logger.error('Error creating default workspace:', createError)
          }

          // If we can't create a workspace, redirect to login to reset state
          router.replace('/login')
          return
        }

        // Get the first workspace (they should be ordered by most recent)
        const firstWorkspace = workspaces[0]
        logger.info(`Redirecting to first workspace: ${firstWorkspace.id}`)

        // Redirect to the first workspace
        router.replace(`/workspace/${firstWorkspace.id}/w`)
      } catch (error) {
        logger.error('Error fetching workspaces for redirect:', error)
        setError('Failed to load workspaces. Please try again.')
        setIsRedirecting(false)
        // Don't redirect if there's an error - let the user stay on the page
      }
    }

    // Only run this logic when we're at the root /workspace path
    // If we're already in a specific workspace, the children components will handle it
    if (typeof window !== 'undefined' && window.location.pathname === '/workspace') {
      redirectToFirstWorkspace()
    }
  }, [session, isPending, router, privyReady, privyAuthenticated, isRetrying, refetch])

  // Show error state
  if (error) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center space-y-4 text-white'>
        <div className='text-center'>
          <h1 className='font-bold text-2xl text-destructive'>Something went wrong</h1>
          <p className='text-muted-foreground'>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className='rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/login')}
          className='text-muted-foreground text-sm hover:underline'
        >
          Back to Login
        </button>
      </div>
    )
  }

  // Show loading state while we determine where to redirect (session pending or redirect in progress)
  if (isPending || isRedirecting || (privyAuthenticated && !session?.user)) {
    return (
      <div className='flex h-screen w-full items-center justify-center text-white'>
        <div className='flex flex-col items-center justify-center text-center align-middle'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          <p className='mt-2 text-muted-foreground text-sm italic'>Loading your workspaces...</p>
        </div>
      </div>
    )
  }

  // Fallback - should ideally not be reached as we should either be loading, redirecting or showing error
  return (
    <div className='flex h-screen w-full items-center justify-center text-white'>
      <div className='flex flex-col items-center justify-center text-center align-middle'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    </div>
  )
}
