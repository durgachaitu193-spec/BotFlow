import React, { type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, suffix, ...props }, ref) => {
    return (
      <div className={`relative flex items-center ${className}`}>
        <input
          className={`h-full w-full bg-transparent px-4 py-2 outline-none ${suffix ? 'pr-10' : ''}`}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className='pointer-events-none absolute right-3 flex items-center'>{suffix}</div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
