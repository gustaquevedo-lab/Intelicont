import { cn } from '@/lib/utils'

function Alert({ className, children, variant = 'default', ...props }: { className?: string; children?: any; variant?: 'default' | 'destructive' | 'warning' }) {
  return (
    <div className={cn('rounded-lg border p-4', variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-800' : variant === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-border bg-card text-card-foreground', className)} {...props}>
      {children}
    </div>
  )
}

function AlertTitle({ className, children, ...props }: { className?: string; children?: any }) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props}>{children}</h5>
}

function AlertDescription({ className, children, ...props }: { className?: string; children?: any }) {
  return <div className={cn('text-sm', className)} {...props}>{children}</div>
}

export { Alert, AlertTitle, AlertDescription }
