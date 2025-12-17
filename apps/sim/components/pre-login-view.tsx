'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export function IntroductionClient() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    console.log('IntroductionClient mounted')
  }, [])

  return (
    <AnimatePresence
      mode='wait'
      onExitComplete={() => {
        console.log('IntroductionClient: redirecting to /login')
        router.push('/login')
      }}
    >
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
          className='fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black'
        >
          <video
            autoPlay
            muted
            playsInline
            onEnded={() => {
              console.log('Video ended')
              setIsVisible(false)
            }}
            className='absolute inset-0 -z-10 h-full w-full object-cover'
          >
            <source src='/video/video2.mp4' type='video/mp4' />
          </video>

          <div className='absolute inset-0 bg-black/10' />
          <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/40' />

          <div className='relative z-10 flex flex-col items-center justify-center gap-8'>
            <motion.div
              initial={{ scale: 2.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{
                duration: 2.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.5,
              }}
              className='relative h-24 w-96 md:h-32 md:w-[500px]'
            >
              <Image
                src='/logo/lockup_ow.png'
                alt='Megalith Logo'
                fill
                priority
                className='object-contain drop-shadow-[0_4px_3px_rgba(0,0,0,0.6)_0_10px_8px_rgba(0,0,0,0.4)]'
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
