import type { UserAccount } from '@/features/accounts/types/account.types'
import type { EvaluationPeriod } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import type { WorkTemplate } from '@/features/work-templates/types/workTemplate.types'

export const WorkTaskStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type WorkTaskStatus = (typeof WorkTaskStatus)[keyof typeof WorkTaskStatus]

export type TaskStatus = WorkTaskStatus | string

export const taskStatusLabels: Record<WorkTaskStatus, string> = {
  [WorkTaskStatus.NEW]: 'Mới',
  [WorkTaskStatus.IN_PROGRESS]: 'Đang thực hiện',
  [WorkTaskStatus.COMPLETED]: 'Hoàn thành',
  [WorkTaskStatus.CANCELLED]: 'Đã hủy',
}

export function getTaskStatusLabel(status?: string | null) {
  if (!status) {
    return '-'
  }

  return taskStatusLabels[status as WorkTaskStatus] ?? status
}

export type Task = {
  id: string
  title: string
  period?: EvaluationPeriod | null
  periodId?: string
  periodName?: string | null
  workTemplate?: WorkTemplate | null
  workTemplateId?: string
  workTemplateName?: string | null
  assignee?: UserAccount | null
  assigner?: UserAccount | null
  assigneeId?: string
  assigneeName?: string | null
  owner?: string
  description?: string | null
  expectedOutput?: string | null
  workType?: string | null
  assignedDate?: string | null
  dueDate?: string | null
  completedDate?: string | null
  baseScore?: number
  difficultyPercent?: number
  progressPercent?: number
  resultDescription?: string | null
  status: TaskStatus
  due?: string
  createdDate?: string | null
  modifiedDate?: string | null
}

export type TaskFormPayload = {
  periodId: string
  workTemplateId: string
  assigneeId: string
  title: string
  description: string
  assignedDate: string
  dueDate: string
}

export type TaskRequest = {
  periodId: string
  workTemplateId: string
  assigneeId: string
  title: string
  description: string
  expectedOutput: string
  workType: number
  assignedDate: string
  dueDate: string
  completedDate: string | null
  baseScore: number
  difficultyPercent: number
  progressPercent: number
  resultDescription: string | null
  status: WorkTaskStatus
}

export type TaskSummary = {
  label: string
  value: number
}

export type CreateTaskRequest = TaskRequest

export type UpdateTaskRequest = TaskRequest
