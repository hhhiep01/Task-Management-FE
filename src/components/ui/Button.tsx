import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2',
        className,
      )}
      {...props}
    />
  )
}
