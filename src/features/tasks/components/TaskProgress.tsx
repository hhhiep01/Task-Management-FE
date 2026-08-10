export function TaskProgress({ value, label = 'Tiến độ' }: { value: number; label?: string }) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className="grid w-full min-w-0 max-w-full gap-2"
      aria-label={`${label}: ${normalizedValue}%`}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
        <span className="min-w-0 break-words font-medium text-[var(--color-text)]">{label}</span>
        <span className="shrink-0 font-bold text-[var(--color-text-strong)]">
          {normalizedValue}%
        </span>
      </div>
      <div
        className="relative h-2 w-full min-w-0 max-w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <div
          className="h-full max-w-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}
