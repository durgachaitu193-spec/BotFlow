import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/core/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center font-medium gap-[4px] rounded-[40px] focus:outline-none transition-colors w-fit',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--surface-5)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        outline:
          'border border-[#575757] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        red: 'bg-[var(--text-error)]/10 text-[var(--text-error)] border border-[var(--text-error)]/20',
        amber: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
        green: 'bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)] border border-[var(--brand-tertiary)]/20',
        gray: 'bg-[var(--surface-11)] text-[var(--text-secondary)] border border-[var(--surface-12)]',
        'gray-secondary': 'bg-[var(--surface-5)] text-[var(--text-tertiary)] border border-[var(--border)]',
        blue: 'bg-[#2fa1ff]/10 text-[#2fa1ff] border border-[#2fa1ff]/20',
        teal: 'bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] border border-[var(--brand-secondary)]/20',
        purple: 'bg-[#8c10ff]/10 text-[#8c10ff] border border-[#8c10ff]/20',
        orange: 'bg-[var(--brand-500)]/10 text-[var(--brand-500)] border border-[var(--brand-500)]/20',
      },
      size: {
        default: 'px-[9px] py-[2.25px] text-[13px]',
        sm: 'px-[6px] py-[1px] text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  dot?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

function Badge({ className, variant, size, dot, icon: Icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <div className='h-[5px] w-[5px] rounded-full bg-current' />}
      {Icon && <Icon className='h-[12px] w-[12px]' />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
