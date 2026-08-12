import {
  getPasswordRequirements,
  getTemporaryPasswordRequirements,
} from '@/utils/passwordValidation'

export function PasswordRequirements({
  password,
  policy = 'standard',
}: {
  password: string
  policy?: 'standard' | 'temporary'
}) {
  const requirements =
    policy === 'temporary'
      ? getTemporaryPasswordRequirements(password)
      : getPasswordRequirements(password)

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5"
      aria-live="polite"
    >
      <p className="text-xs font-semibold text-[var(--color-text)]">Mật khẩu phải có:</p>
      <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {requirements.map((requirement) => (
          <li
            key={requirement.key}
            className={`flex items-center gap-2 text-xs ${
              requirement.met
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px] ${
                requirement.met
                  ? 'border-emerald-300 bg-emerald-50 font-bold'
                  : 'border-[var(--color-border-strong)]'
              }`}
            >
              {requirement.met ? '✓' : ''}
            </span>
            {requirement.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
