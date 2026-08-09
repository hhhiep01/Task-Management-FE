export const TaskEvidenceType = {
  FILE: 'FILE',
  DOCUMENT: 'DOCUMENT',
  LINK: 'LINK',
} as const

export type TaskEvidenceType = (typeof TaskEvidenceType)[keyof typeof TaskEvidenceType]

export type TaskEvidence = {
  id: string
  taskId: string
  evidenceType: TaskEvidenceType
  documentNumber: string | null
  documentDate: string | null
  description: string | null
  fileName: string | null
  fileUrl: string | null
  contentType: string | null
  fileSize: number | null
  uploadedBy: string
  uploadedByName: string
  createdAt: string
  updatedAt: string | null
}

export type CreateTaskEvidenceRequest = {
  evidenceType: 'DOCUMENT' | 'LINK'
  documentNumber: string | null
  documentDate: string | null
  description: string | null
  fileUrl: string | null
}

export type UpdateTaskEvidenceRequest = {
  documentNumber?: string | null
  documentDate?: string | null
  description?: string | null
  fileUrl?: string | null
}
