import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'wide'

type ModalProps = {
  open: boolean
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: ModalSize
  closeLabel?: string
  mobileFullscreen?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  wide: 'max-w-5xl',
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
  closeLabel = 'Đóng',
  mobileFullscreen = false,
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 grid place-items-center bg-slate-950/45',
        mobileFullscreen ? 'p-0 sm:px-4 sm:py-6' : 'px-4 py-6',
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'flex w-full min-w-0 flex-col overflow-hidden whitespace-normal border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-modal)]',
          mobileFullscreen
            ? 'h-full max-h-none rounded-none border-x-0 sm:h-auto sm:max-h-[90vh] sm:rounded-[var(--radius-lg)] sm:border-x'
            : 'max-h-[90vh] rounded-[var(--radius-lg)]',
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="break-words text-lg font-semibold text-[var(--color-text-strong)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 break-words text-sm leading-6 text-[var(--color-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-xl leading-none text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>
        <div className="w-full min-w-0 max-w-full overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
