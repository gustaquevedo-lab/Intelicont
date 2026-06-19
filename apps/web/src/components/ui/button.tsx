import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg font-semibold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string
  children?: any
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: (e: any) => void
}

function Button({ className, variant, size, children, type = 'button', disabled, onClick }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {children}
    </button>
  )
}
Button.displayName = 'Button'

export { Button, buttonVariants }
