import type { WorkCategory } from '../../work-categories/types/workCategory.types'

export const WorkType = {
  REGULAR: 'REGULAR',
  AD_HOC: 'AD_HOC',
} as const

export type WorkType = (typeof WorkType)[keyof typeof WorkType]

export const workTypeLabels: Record<WorkType, string> = {
  [WorkType.REGULAR]: 'Thường xuyên',
  [WorkType.AD_HOC]: 'Phát sinh',
}

export function getWorkTypeLabel(value?: string | null) {
  return value === WorkType.REGULAR || value === WorkType.AD_HOC ? workTypeLabels[value] : '-'
}

export type WorkTemplate = {
  id: string
  workCategory: WorkCategory
  name: string
  expectedOutput: string
  standardDeadline: string
  workType: WorkType
  baseScore: number
  difficultyPercent: number
  evidenceRequirement: string
  isActive: boolean
  createdDate: string
  modifiedDate: string | null
}

export type WorkTemplatePayload = {
  workCategoryId: string
  name: string
  expectedOutput: string
  standardDeadline: string
  workType: WorkType
  baseScore: number
  difficultyPercent: number
  evidenceRequirement: string
  isActive: boolean
}

export type CreateWorkTemplateRequest = WorkTemplatePayload

export type UpdateWorkTemplateRequest = WorkTemplatePayload
