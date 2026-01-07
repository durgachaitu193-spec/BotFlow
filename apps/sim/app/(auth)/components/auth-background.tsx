import Image from 'next/image'
import { cn } from '@/lib/utils'
import backgroundImage from '@/public/background/background1.jpg'

type AuthBackgroundProps = {
  className?: string
  children?: React.ReactNode
}

export default function AuthBackground({ className, children }: AuthBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden', className)}>
      <Image
        src={backgroundImage}
        alt='Background'
        fill
        className='object-cover'
        priority
        quality={100}
        placeholder='blur'
      />
      <div className='absolute inset-0 bg-black/30' />
      <div className='relative z-20'>{children}</div>
    </div>
  )
}
