import type React from 'react'

interface SpinnerProps {
  size?: 'small' | 'default' | 'large'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    default: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  }

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-gray-600 border-t-white ${className}`}
    />
  )
}

export default Spinner
