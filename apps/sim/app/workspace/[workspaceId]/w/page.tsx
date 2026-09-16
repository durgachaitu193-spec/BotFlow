'use client'

import { useEffect } from 'react'
import { createLogger } from '@botflow/logger'
import { Loader2, Plus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCreateWorkflow, useWorkflows } from '@/hooks/queries/workflows'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'

const logger = createLogger('WorkflowsPage')

export default function WorkflowsPage() {
  const router = useRouter()
  const { workflows, setActiveWorkflow } = useWorkflowRegistry()
  const params = useParams()
  const workspaceId = params.workspaceId as string

  // Fetch workflows using React Query
  const { isLoading, isError } = useWorkflows(workspaceId)
  const { mutate: createWorkflow, isPending: isCreating } = useCreateWorkflow()

  const workflowIds = Object.keys(workflows)

  // Validate that workflows belong to the current workspace
  const workspaceWorkflows = workflowIds.filter((id) => {
    const workflow = workflows[id]
    return workflow.workspaceId === workspaceId
  })

  // Handle redirection once workflows are loaded
  useEffect(() => {
    // Only proceed if workflows are done loading
    if (isLoading) return

    if (isError) {
      logger.error('Failed to load workflows for workspace')
      return
    }

    // If we have valid workspace workflows, redirect to the first one
    if (workspaceWorkflows.length > 0) {
      const firstWorkflowId = workspaceWorkflows[0]
      router.replace(`/workspace/${workspaceId}/w/${firstWorkflowId}`)
    }
  }, [isLoading, workspaceWorkflows, workspaceId, router, isError])

  // Show create workflow UI if no workflows found
  if (!isLoading && !isError && workspaceWorkflows.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center space-y-4'>
        <div className='text-center'>
          <h3 className='font-semibold text-lg'>No workflows found</h3>
          <p className='text-muted-foreground'>Create your first workflow to get started.</p>
        </div>
        <Button onClick={() => createWorkflow({ workspaceId })} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Plus className='mr-2 h-4 w-4' />
          )}
          Create Workflow
        </Button>
      </div>
    )
  }

  // Always show loading state until redirect happens
  return (
    <div className='flex h-full items-center justify-center'>
      <div className='text-center'>
        <div className='mx-auto mb-4'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    </div>
  )
}
