export function TaskProgress({ value, label = 'Tiến độ' }: { value: number; label?: string }) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div className="grid gap-2" aria-label={`${label}: ${normalizedValue}%`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--color-text)]">{label}</span>
        <span className="font-bold text-[var(--color-text-strong)]">{normalizedValue}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}
