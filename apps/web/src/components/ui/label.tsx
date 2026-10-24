import { cn } from '@/lib/utils'

interface LabelProps {
  className?: string
  children?: any
  htmlFor?: string
}

function Label({ className, children, htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1.5',
        className
      )}
    >
      {children}
    </label>
  )
}
Label.displayName = 'Label'

export { Label }
