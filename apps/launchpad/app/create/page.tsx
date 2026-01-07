'use client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import CreateToken from './components/createToken'

function Board() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className='flex h-full justify-center py-6'>
        <CreateToken isOpen={true} onClose={() => router.push('/')} />
      </div>
    </DashboardLayout>
  )
}

export default Board
