import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    React.RefAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-card text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-porsche-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-porsche-red text-white hover:bg-porsche-red/90': variant === 'default',
            'bg-porsche-black text-white hover:bg-porsche-black/90': variant === 'secondary',
            'border border-porsche-chalk bg-white hover:bg-porsche-chalk/50': variant === 'outline',
            'hover:bg-porsche-chalk/50': variant === 'ghost',
            'text-porsche-red underline-offset-4 hover:underline': variant === 'link',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          }
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }