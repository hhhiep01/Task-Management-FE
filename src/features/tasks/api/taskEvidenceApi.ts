import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type {
  CreateTaskEvidenceRequest,
  TaskEvidence,
  UpdateTaskEvidenceRequest,
} from '../types/taskEvidence.types'

export const taskEvidenceApiLinks = {
  list: (taskId: string) => `/api/Task/${taskId}/evidences`,
  create: (taskId: string) => `/api/Task/${taskId}/evidences`,
  upload: (taskId: string) => `/api/Task/${taskId}/evidences/file`,
  update: (evidenceId: string) => `/api/TaskEvidence/${evidenceId}`,
  delete: (evidenceId: string) => `/api/TaskEvidence/${evidenceId}`,
  download: (evidenceId: string) => `/api/TaskEvidence/${evidenceId}/download`,
}

type EvidenceListResponse = ApiResponse<TaskEvidence[]>
type EvidenceResponse = ApiResponse<TaskEvidence>
type DeleteEvidenceResponse = ApiResponse<null>

export async function getTaskEvidences(taskId: string, signal?: AbortSignal) {
  const response = await httpClient.get<EvidenceListResponse>(taskEvidenceApiLinks.list(taskId), {
    signal,
  })
  return unwrapApiResponse(response.data)
}

export async function createTaskEvidence(taskId: string, payload: CreateTaskEvidenceRequest) {
  const response = await httpClient.post<EvidenceResponse>(
    taskEvidenceApiLinks.create(taskId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function uploadTaskEvidence(
  taskId: string,
  file: File,
  description: string,
  onProgress?: (progress: number) => void,
) {
  const formData = new FormData()
  formData.append('file', file)
  if (description.trim()) formData.append('description', description.trim())

  const response = await httpClient.post<EvidenceResponse>(
    taskEvidenceApiLinks.upload(taskId),
    formData,
    {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    },
  )
  return unwrapApiResponse(response.data)
}

export async function updateTaskEvidence(
  evidenceId: string,
  payload: UpdateTaskEvidenceRequest,
) {
  const response = await httpClient.put<EvidenceResponse>(
    taskEvidenceApiLinks.update(evidenceId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function deleteTaskEvidence(evidenceId: string) {
  const response = await httpClient.delete<DeleteEvidenceResponse>(
    taskEvidenceApiLinks.delete(evidenceId),
  )
  return unwrapApiResponse(response.data)
}

function getFilename(contentDisposition: string | undefined, fallback: string) {
  if (!contentDisposition) return fallback
  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  }
  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback
}

export async function downloadTaskEvidence(evidence: TaskEvidence) {
  const response = await httpClient.get<Blob>(taskEvidenceApiLinks.download(evidence.id), {
    responseType: 'blob',
  })
  return {
    blob: response.data,
    fileName: getFilename(response.headers['content-disposition'], evidence.fileName ?? 'evidence'),
  }
}
