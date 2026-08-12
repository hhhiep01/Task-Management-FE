import { useState } from 'react'
import type { ChangeEventHandler } from 'react'

import { cn } from '@/utils/cn'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  autoComplete: 'current-password' | 'new-password'
  error?: string
  placeholder?: string
  disabled?: boolean
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  placeholder = 'Nhập mật khẩu',
  disabled = false,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-11 w-full rounded-[var(--radius-md)] border bg-white px-3 pr-11 text-sm text-[var(--color-text-strong)] outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]',
            error
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100'
              : 'border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:ring-teal-100',
          )}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed"
          aria-label={isVisible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
          title={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          <PasswordVisibilityIcon visible={isVisible} />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 10s2.5-4 7.5-4 7.5 4 7.5 4-2.5 4-7.5 4-7.5-4-7.5-4Z" />
      <circle cx="10" cy="10" r="2" />
      {visible ? null : <path d="m3 3 14 14" />}
    </svg>
  )
}
