import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

type TaskSummaryTone = 'primary' | 'success' | 'warning' | 'danger' | 'info'

type TaskSummaryCardProps = {
  label: string
  value: number | string
  description: string
  tone?: TaskSummaryTone
  badge?: ReactNode
}

const toneClasses: Record<TaskSummaryTone, string> = {
  primary: 'border-l-[var(--color-primary)]',
  success: 'border-l-[var(--color-success)]',
  warning: 'border-l-[var(--color-warning)]',
  danger: 'border-l-[var(--color-danger)]',
  info: 'border-l-[var(--color-info)]',
}

export function TaskSummaryCard({
  label,
  value,
  description,
  tone = 'primary',
  badge,
}: TaskSummaryCardProps) {
  return (
    <Card className={`border-l-4 p-5 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-normal text-[var(--color-text-strong)]">
            {value}
          </p>
        </div>
        {badge ? <Badge variant={tone === 'primary' ? 'primary' : tone}>{badge}</Badge> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
    </Card>
  )
}
