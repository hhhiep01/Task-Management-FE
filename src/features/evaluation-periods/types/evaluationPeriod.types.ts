import type { Organization } from '../../organizations/types/organization.types'

export const PeriodType = {
  MONTH: 'MONTH',
  QUARTER: 'QUARTER',
  YEAR: 'YEAR',
} as const

export type PeriodType = (typeof PeriodType)[keyof typeof PeriodType]

export const PeriodStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
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

export function toEvaluationPeriodPayload(
  period: EvaluationPeriod,
  overrides: Partial<EvaluationPeriodPayload> = {},
): EvaluationPeriodPayload {
  return {
    organizationId: period.organization.id,
    name: period.name,
    periodType: period.periodType,
    startDate: period.startDate.slice(0, 10),
    endDate: period.endDate.slice(0, 10),
    status: period.status,
    ...overrides,
  }
}
