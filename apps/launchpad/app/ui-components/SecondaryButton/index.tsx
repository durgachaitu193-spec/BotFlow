import type { ReactNode } from 'react'

const SecondaryButton = ({
  className,
  children,
  onClick,
  icon,
}: {
  className?: string
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-x-2 border-none bg-transparent p-0 font-primary text-white shadow-none outline-none transition-all ${className}`}
    >
      {icon}
      <div className='flex items-center gap-x-0'>
        <span>[</span>
        <span className='font-bold hover:text-primary'>{children}</span>
        <span>]</span>
      </div>
    </button>
  )
}

export default SecondaryButton
