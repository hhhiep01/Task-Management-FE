import type { UserAccount } from '@/features/accounts/types/account.types'
import type { EvaluationPeriod } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import type { WorkTemplate } from '@/features/work-templates/types/workTemplate.types'

export type TaskStatus = string

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

export type TaskPayload = {
  periodId: string
  workTemplateId: string
  assigneeId: string
  title: string
  description: string
  assignedDate: string
  dueDate: string
}

export type TaskSummary = {
  label: string
  value: number
}

export type CreateTaskRequest = TaskPayload

export type UpdateTaskRequest = TaskPayload
