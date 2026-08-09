import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

type CardVariant = 'default' | 'muted' | 'flat'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
}

const variantClasses: Record<CardVariant, string> = {
  default: 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]',
  muted: 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] shadow-none',
  flat: 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-none',
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-[var(--radius-md)] border', variantClasses[variant], className)}
      {...props}
    />
  )
}
