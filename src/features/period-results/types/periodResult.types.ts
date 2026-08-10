export const SelfProposedRating = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  COMPLETED: 'COMPLETED',
  NOT_COMPLETED: 'NOT_COMPLETED',
} as const

export type SelfProposedRating =
  (typeof SelfProposedRating)[keyof typeof SelfProposedRating]

export const selfProposedRatingLabels: Record<SelfProposedRating, string> = {
  [SelfProposedRating.EXCELLENT]: 'Hoàn thành xuất sắc nhiệm vụ',
  [SelfProposedRating.GOOD]: 'Hoàn thành tốt nhiệm vụ',
  [SelfProposedRating.COMPLETED]: 'Hoàn thành nhiệm vụ',
  [SelfProposedRating.NOT_COMPLETED]: 'Không hoàn thành nhiệm vụ',
}

export type PeriodResult = {
  periodId: string
  periodName: string
  commonScore: number
  commonMaxScore: number
  taskScore: number
  taskMaxScore: number
  totalScore: number
  totalMaxScore: number
  selfProposedRating: SelfProposedRating | null
  status: string
  submittedAt: string | null
}

export type SelfProposalRequest = {
  selfProposedRating: SelfProposedRating
}
