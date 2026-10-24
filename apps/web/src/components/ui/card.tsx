import { cn } from '@/lib/utils'

interface DivProps {
  className?: string
  children?: any
  [key: string]: any
}

interface HeadingProps {
  className?: string
  children?: any
}

function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
      {...props}
    />
  )
}
Card.displayName = 'Card'

function CardHeader({ className, ...props }: DivProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
}
CardHeader.displayName = 'CardHeader'

function CardTitle({ className, children }: HeadingProps) {
  return (
    <h3 className={cn('text-xl font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  )
}
CardTitle.displayName = 'CardTitle'

function CardDescription({ className, children }: HeadingProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  )
}
CardDescription.displayName = 'CardDescription'

function CardContent({ className, ...props }: DivProps) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props} />
  )
}
CardContent.displayName = 'CardContent'

function CardFooter({ className, ...props }: DivProps) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
}
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
