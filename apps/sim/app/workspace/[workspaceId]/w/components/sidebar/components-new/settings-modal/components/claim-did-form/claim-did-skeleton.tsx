import { Skeleton } from '@/components/ui/skeleton'

export function ClaimDidSkeleton() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='space-y-6'>
          {/* Header Section */}
          <div className='flex flex-col items-center space-y-4 text-center'>
            <Skeleton className='h-16 w-16 rounded-full' />
            <div className='flex w-full flex-col items-center space-y-2'>
              <Skeleton className='h-7 w-48' />
              <Skeleton className='h-4 w-64' />
            </div>
          </div>

          {/* Network Selection Section */}
          <div className='space-y-6'>
            <div className='space-y-3'>
              <Skeleton className='h-5 w-24' />
              <div className='grid grid-cols-2 gap-3'>
                {/* Network Option 1 */}
                <div className='flex flex-col items-center justify-center space-y-2 rounded-xl border border-border bg-card p-4'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <Skeleton className='h-4 w-20' />
                </div>
                {/* Network Option 2 */}
                <div className='flex flex-col items-center justify-center space-y-2 rounded-xl border border-border bg-card p-4'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <Skeleton className='h-11 w-full rounded-md' />
          </div>
        </div>
      </div>
    </div>
  )
}
