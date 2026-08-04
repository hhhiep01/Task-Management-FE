import type { Organization } from '../../organizations/types/organization.types'

export type WorkCategory = {
  id: string
  organization: Organization
  code: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
  createdDate: string
  modifiedDate: string | null
}

export type WorkCategoryPayload = {
  organizationId: string
  code: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
}

export type CreateWorkCategoryRequest = WorkCategoryPayload

export type UpdateWorkCategoryRequest = WorkCategoryPayload
