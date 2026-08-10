export const SelfEvaluationCriterionType = {
  GROUP: 'GROUP',
  ITEM: 'ITEM',
} as const

export type SelfEvaluationCriterionType =
  (typeof SelfEvaluationCriterionType)[keyof typeof SelfEvaluationCriterionType]

export type SelfEvaluationCriterion = {
  id: string
  code: string
  content: string
  criterionType: SelfEvaluationCriterionType
  maxScore: number
  children?: SelfEvaluationCriterion[]
  isMet?: boolean | null
  selfScore?: number | null
  selfNote?: string | null
}

export type SelfEvaluation = {
  periodId: string
  totalMaxScore: number
  totalSelfScore: number
  criteria: SelfEvaluationCriterion[]
}

export type SelfEvaluationCriterionRequest = {
  criterionId: string
  isMet: boolean
  selfScore: number
  selfNote: string | null
}

export type UpdateSelfEvaluationRequest = {
  criteria: SelfEvaluationCriterionRequest[]
}
