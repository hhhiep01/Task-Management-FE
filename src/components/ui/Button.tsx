import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border-strong)] bg-white text-[var(--color-text-strong)] shadow-sm hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)]',
  danger:
    'border border-red-200 bg-white text-[var(--color-danger)] shadow-sm hover:bg-red-50',
  link: 'border border-transparent bg-transparent px-0 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
}

export function Button({
  className,
  type = 'button',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
