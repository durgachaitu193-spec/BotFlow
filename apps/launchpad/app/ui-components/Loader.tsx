import type React from 'react'
import Spinner from './Spinner'

const Loader: React.FC<{
  size?: 'small' | 'default' | 'large'
  text?: string
  className?: string
}> = ({
  size = 'default',
  text,
}: {
  size?: 'small' | 'default' | 'large'
  text?: string
  className?: string
}) => {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-y-2'>
      <Spinner size={size} />
      {text && <p className='text-sm text-white'>{text}</p>}
    </div>
  )
}

export default Loader
