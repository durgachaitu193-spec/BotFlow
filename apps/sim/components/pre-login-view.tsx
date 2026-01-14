'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function IntroductionClient() {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/login')
    router.push('/login')
  }, [router])

  return null
}
