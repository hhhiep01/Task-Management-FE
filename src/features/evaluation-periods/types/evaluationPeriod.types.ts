import type { Organization } from '../../organizations/types/organization.types'

export const PeriodType = {
  MONTH: 0,
  QUARTER: 1,
  YEAR: 2,
} as const

export type PeriodType = (typeof PeriodType)[keyof typeof PeriodType]

export const PeriodStatus = {
  DRAFT: 0,
  ACTIVE: 1,
  CLOSED: 2,
} as const

export type PeriodStatus = (typeof PeriodStatus)[keyof typeof PeriodStatus]

export type EvaluationPeriod = {
  id: string
  organization: Organization
  name: string
  periodType: PeriodType
  startDate: string
  endDate: string
  status: PeriodStatus
  createdDate: string
  modifiedDate: string | null
}

export type EvaluationPeriodPayload = {
  organizationId: string
  name: string
  periodType: PeriodType
  startDate: string
  endDate: string
  status: PeriodStatus
}

export type CreateEvaluationPeriodRequest = EvaluationPeriodPayload

export type UpdateEvaluationPeriodRequest = EvaluationPeriodPayload
