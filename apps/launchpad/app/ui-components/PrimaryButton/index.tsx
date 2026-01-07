import type { ReactNode } from 'react'
import './style.css'
import { Loader2 } from 'lucide-react'

const PrimaryButton = ({
  className,
  children,
  onClick,
  bgColor,
  shadowColor,
  loading,
  htmlType,
  disabled,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
  bgColor?: string
  shadowColor?: string
  loading?: boolean
  htmlType?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean
}) => {
  return (
    <button
      type={htmlType}
      onClick={onClick}
      disabled={disabled || loading}
      className={`primary-btn relative flex items-center justify-center overflow-hidden rounded-2xl border-none font-poppins text-white outline-none ${className} ${disabled || loading ? 'cursor-not-allowed opacity-70' : ''}`}
      style={{
        backgroundColor: bgColor,
        boxShadow: shadowColor ? `0 1px 0 2px ${shadowColor}` : undefined,
      }}
    >
      {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
      <span className='font-extrabold'>{children}</span>
    </button>
  )
}

export default PrimaryButton
