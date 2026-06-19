'use client'

import { cn } from '@/lib/utils'

export function MetricCard({ title, value, subtitle, icon, trend, className, children }: {
  title: string
  value: string
  subtitle?: string
  icon?: string
  trend?: { value: string; positive: boolean }
  className?: string
  children?: any
}) {
  return (
    <div className={cn('glass-card rounded-xl p-5 card-hover', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{title}</span>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <div className="metric-value mb-1">{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          {trend && (
            <span className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-500')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export function StatusBadge({ status, variant }: { status: string; variant?: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    initiated: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-sky-50 text-sky-700 border-sky-200',
    in_transit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
    frozen: 'bg-red-50 text-red-700 border-red-200',
    closed: 'bg-gray-50 text-gray-500 border-gray-200',
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  }
  const color = colors[status.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'pending' ? 'bg-amber-500 animate-pulse' : color.split(' ')[1]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </span>
  )
}

export function GlassCard({ title, description, action, className, children }: {
  title?: string
  description?: string
  action?: any
  className?: string
  children?: any
}) {
  return (
    <div className={cn('glass-card rounded-xl overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]', className)} />
  )
}

export function EmptyState({ icon, title, description, action }: {
  icon?: string
  title: string
  description?: string
  action?: any
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-4 opacity-30">{icon}</div>}
      <h3 className="text-sm font-semibold text-foreground/70">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function DataTable({ headers, rows, onRowClick, loading }: {
  headers: { key: string; label: string; className?: string }[]
  rows: any[]
  onRowClick?: (row: any) => void
  loading?: boolean
}) {
  if (loading) {
    return (
      <table className="data-table">
        <thead><tr>{headers.map(h => <th key={h.key} className={h.className}>{h.label}</th>)}</tr></thead>
        <tbody>
          {[1,2,3,4,5].map(i => (
            <tr key={i}>
              {headers.map(h => (
                <td key={h.key} className={h.className}><Skeleton className="h-4 w-24" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead><tr>{headers.map(h => <th key={h.key} className={h.className}>{h.label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-12 text-xs text-muted-foreground">No hay datos</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {headers.map(h => (
                  <td key={h.key} className={cn('text-sm', h.className)}>{row[h.key] ?? '-'}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
