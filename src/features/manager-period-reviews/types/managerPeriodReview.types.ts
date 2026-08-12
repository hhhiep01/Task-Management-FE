import type { SelfProposedRating } from '@/features/period-results/types/periodResult.types'

export const PeriodReviewStatus = {
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
} as const

export type PeriodReviewStatus =
  (typeof PeriodReviewStatus)[keyof typeof PeriodReviewStatus]

export type PeriodReviewRating = SelfProposedRating

export type PeriodReviewEmployee = {
  userId: string
  employeeName?: string | null
  fullName?: string | null
  employee?: {
    id?: string
    fullName?: string | null
  } | null
  commonScore: number
  commonMaxScore: number
  taskScore: number
  taskMaxScore: number
  totalScore: number
  totalMaxScore: number
  selfProposedRating: PeriodReviewRating | null
  submittedAt: string | null
  status: string
}

export type PeriodReviewCriterion = {
  id: string
  code: string
  content: string
  criterionType: 'GROUP' | 'ITEM'
  maxScore: number
  children?: PeriodReviewCriterion[]
  isMet?: boolean | null
  selfScore?: number | null
  selfNote?: string | null
}

export type PeriodReviewTaskEvaluation = {
  evaluatorName?: string | null
  reviewedByName?: string | null
  progressPercent: number
  qualityPercent: number
  actualScore: number
  convertedScore: number
  decision: string
  comment?: string | null
  evaluatedAt: string
}

export type PeriodReviewTask = {
  id: string
  title?: string | null
  taskName?: string | null
  workType?: string | null
  assignedDate?: string | null
  dueDate?: string | null
  completedDate?: string | null
  progressPercent?: number | null
  resultDescription?: string | null
  status?: string | null
  maxConvertedScore?: number | null
  maximumConvertedScore?: number | null
  convertedMaxScore?: number | null
  baseScore?: number | null
  finalEvaluation?: PeriodReviewTaskEvaluation | null
  taskEvaluation?: PeriodReviewTaskEvaluation | null
}

export type ManagerPeriodReview = PeriodReviewEmployee & {
  periodId: string
  periodName: string
  commonCriteria: PeriodReviewCriterion[]
  tasks: PeriodReviewTask[]
  managerScore?: number | null
  managerProposedRating?: PeriodReviewRating | null
  keyTaskAssessment?: string | null
  reviewedByName?: string | null
  reviewedAt?: string | null
}

export type UpdateManagerPeriodReviewRequest = {
  managerScore: number
  managerProposedRating: PeriodReviewRating
  keyTaskAssessment: string
}
