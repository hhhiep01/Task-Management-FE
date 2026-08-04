import type { WorkCategory } from '../../work-categories/types/workCategory.types'

export type WorkTemplate = {
  id: string
  workCategory: WorkCategory
  name: string
  expectedOutput: string
  standardDeadline: string
  workType: string
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
  workType: string
  baseScore: number
  difficultyPercent: number
  evidenceRequirement: string
  isActive: boolean
}

export type CreateWorkTemplateRequest = WorkTemplatePayload

export type UpdateWorkTemplateRequest = WorkTemplatePayload
