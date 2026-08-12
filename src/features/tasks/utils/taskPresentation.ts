import { formatDate } from '@/utils/formatDate'

import { WorkTaskStatus, getTaskStatusLabel, type Task } from '../types/task.types'

export type TaskBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function getPeriodName(task: Task) {
  return task.period?.name ?? task.periodName ?? '-'
}

export function getTemplateName(task: Task) {
  return task.workTemplate?.name ?? task.workTemplateName ?? '-'
}

export function getAssigneeName(task: Task) {
  return task.assignee?.fullName ?? task.assigneeName ?? task.owner ?? '-'
}

export function getAssignerName(task: Task) {
  return task.assigner?.fullName ?? '-'
}

export function getProgress(task: Task) {
  return Math.min(100, Math.max(0, task.progressPercent ?? 0))
}

export function isClosedTask(task: Task) {
  return task.status === WorkTaskStatus.COMPLETED || task.status === WorkTaskStatus.CANCELLED
}

export function getDaysUntilDue(task: Task) {
  const value = task.dueDate ?? task.due

  if (!value) {
    return null
  }

  const dueDate = new Date(`${value.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(dueDate.getTime())) {
    return null
  }

  const today = new Date(`${getTodayInputValue()}T00:00:00`)
  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
}

export function isRevisionRequired(task: Task) {
  return task.status === WorkTaskStatus.REVISION_REQUIRED
}

export function getStatusVariant(task: Task): TaskBadgeVariant {
  if (task.status === WorkTaskStatus.REVISION_REQUIRED) {
    return 'warning'
  }

  if (task.status === WorkTaskStatus.COMPLETED) {
    return 'success'
  }

  if (task.status === WorkTaskStatus.CANCELLED) {
    return 'neutral'
  }

  if (task.status === WorkTaskStatus.WAITING_EVALUATION) {
    return 'warning'
  }

  if (task.status === WorkTaskStatus.IN_PROGRESS) {
    return 'primary'
  }

  return 'info'
}

export function getDueBadge(task: Task): { label: string; variant: TaskBadgeVariant } {
  const daysUntilDue = getDaysUntilDue(task)

  if (isClosedTask(task)) {
    return { label: formatDate(task.dueDate ?? task.due), variant: 'neutral' }
  }

  if (daysUntilDue === null) {
    return { label: 'Chưa có hạn', variant: 'neutral' }
  }

  if (daysUntilDue < 0) {
    return { label: `Quá hạn ${Math.abs(daysUntilDue)} ngày`, variant: 'danger' }
  }

  if (daysUntilDue === 0) {
    return { label: 'Hạn hôm nay', variant: 'warning' }
  }

  if (daysUntilDue <= 3) {
    return { label: `Còn ${daysUntilDue} ngày`, variant: 'warning' }
  }

  return { label: formatDate(task.dueDate ?? task.due), variant: 'info' }
}

export function getTaskStatusDisplay(task: Task) {
  return getTaskStatusLabel(task.status)
}

export function getTaskStatusSecondaryText(task: Task) {
  if (task.status === WorkTaskStatus.REVISION_REQUIRED) {
    return 'Cần xem lại kết quả'
  }

  if (task.status === WorkTaskStatus.COMPLETED) {
    return 'Đã được phê duyệt'
  }

  return null
}
