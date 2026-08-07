import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  primary: 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-teal-200',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] ring-amber-200',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-red-200',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)] ring-sky-200',
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
