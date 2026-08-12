import type { WorkTaskStatus } from '@/features/tasks/types/task.types'

export type PersonalDashboardOverview = {
  periodId: string | null
  periodName: string | null
  totalTasks: number
  newTasks: number
  inProgressTasks: number
  waitingEvaluationTasks: number
  revisionRequiredTasks: number
  completedTasks: number
  cancelledTasks: number
  overdueTasks: number
  dueSoonTasks: number
}

export type PersonalAttentionTask = {
  taskId: string
  title: string
  periodId: string
  periodName: string
  status: WorkTaskStatus
  progressPercent: number
  dueDate: string | null
  isOverdue: boolean
  isDueSoon: boolean
}
