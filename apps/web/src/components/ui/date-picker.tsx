import { cn } from '@/lib/utils'

interface DatePickerProps {
  className?: string
  value?: string
  onChange?: (e: any) => void
  [key: string]: any
}

function DatePicker({ className, ...props }: DatePickerProps) {
  return (
    <input
      type="date"
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
        className
      )}
      {...props}
    />
  )
}
DatePicker.displayName = 'DatePicker'

export { DatePicker }
