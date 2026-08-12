import type { SelfProposedRating } from '@/features/period-results/types/periodResult.types'

export const PeriodEvaluationSummaryStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
  LOCKED: 'LOCKED',
} as const

export type PeriodEvaluationSummaryStatus =
  (typeof PeriodEvaluationSummaryStatus)[keyof typeof PeriodEvaluationSummaryStatus]

export type PeriodEvaluationSummaryEmployee = {
  userId: string
  fullName: string
  commonScore: number
  commonMaxScore: number
  taskScore: number
  taskMaxScore: number
  totalScore: number
  totalMaxScore: number
  selfProposedRating: SelfProposedRating | null
  managerScore: number | null
  managerProposedRating: SelfProposedRating | null
  keyTaskAssessment: string | null
  status: string
}

export type PeriodEvaluationSummary = {
  periodId: string
  periodName: string
  periodStatus: string
  totalEmployees: number
  results: PeriodEvaluationSummaryEmployee[]
}
