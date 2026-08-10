export const CriterionType = {
  GROUP: 'GROUP',
  ITEM: 'ITEM',
} as const

export type CriterionType = (typeof CriterionType)[keyof typeof CriterionType]

export const criterionTypeLabels: Record<CriterionType, string> = {
  [CriterionType.GROUP]: 'Nhóm tiêu chí',
  [CriterionType.ITEM]: 'Tiêu chí chấm điểm',
}

export function getCriterionTypeLabel(value?: string | null) {
  return value === CriterionType.GROUP || value === CriterionType.ITEM
    ? criterionTypeLabels[value]
    : '-'
}

export type CommonCriterion = {
  id: string
  organizationId: string
  organizationName: string
  parentId: string | null
  parentCode: string | null
  code: string
  content: string
  maxScore: number
  criterionType: CriterionType
  sortOrder: number
  isActive: boolean
  createdDate: string
  modifiedDate: string | null
}

export type CommonCriterionPayload = {
  organizationId: string
  parentId: string | null
  code: string
  content: string
  maxScore: number
  criterionType: CriterionType
  sortOrder: number
  isActive: boolean
}

export type CreateCommonCriterionRequest = CommonCriterionPayload

export type UpdateCommonCriterionRequest = CommonCriterionPayload
