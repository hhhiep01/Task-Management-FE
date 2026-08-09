export const TaskEvaluationDecision = {
  APPROVED: 'APPROVED',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
} as const

export type TaskEvaluationDecision =
  (typeof TaskEvaluationDecision)[keyof typeof TaskEvaluationDecision]

export type EvaluateTaskRequest = {
  progressPercent: number
  qualityPercent: number
  comment: string | null
  decision: TaskEvaluationDecision
}

export type TaskEvaluation = {
  id: string
  taskId: string
  evaluatorId: string
  evaluatorName: string | null
  evaluationRound: number
  progressPercent: number
  qualityPercent: number
  actualScore: number
  convertedScore: number
  decision: TaskEvaluationDecision
  comment: string | null
  isFinal: boolean
  evaluatedAt: string
}
