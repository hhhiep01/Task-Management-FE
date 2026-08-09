import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTaskEvidence,
  deleteTaskEvidence,
  downloadTaskEvidence,
  getTaskEvidences,
  updateTaskEvidence,
  uploadTaskEvidence,
} from '../api/taskEvidenceApi'
import type {
  CreateTaskEvidenceRequest,
  TaskEvidence,
  UpdateTaskEvidenceRequest,
} from '../types/taskEvidence.types'
import { taskQueryKeys } from './useTasks'

export const taskEvidenceQueryKeys = {
  all: ['task-evidences'] as const,
  byTask: (taskId: string) => ['task-evidences', taskId] as const,
}

function useEvidenceInvalidation(taskId: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: taskEvidenceQueryKeys.byTask(taskId) })
    void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
  }
}

export function useTaskEvidences(taskId: string) {
  return useQuery({
    queryKey: taskEvidenceQueryKeys.byTask(taskId),
    queryFn: ({ signal }) => getTaskEvidences(taskId, signal),
    enabled: Boolean(taskId),
  })
}

export function useCreateTaskEvidence(taskId: string) {
  const invalidate = useEvidenceInvalidation(taskId)
  return useMutation({
    mutationFn: (payload: CreateTaskEvidenceRequest) => createTaskEvidence(taskId, payload),
    onSuccess: invalidate,
  })
}

export function useUploadTaskEvidence(taskId: string) {
  const invalidate = useEvidenceInvalidation(taskId)
  return useMutation({
    mutationFn: ({ file, description, onProgress }: { file: File; description: string; onProgress?: (progress: number) => void }) =>
      uploadTaskEvidence(taskId, file, description, onProgress),
    onSuccess: invalidate,
  })
}

export function useUpdateTaskEvidence(taskId: string) {
  const invalidate = useEvidenceInvalidation(taskId)
  return useMutation({
    mutationFn: ({ evidenceId, payload }: { evidenceId: string; payload: UpdateTaskEvidenceRequest }) =>
      updateTaskEvidence(evidenceId, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteTaskEvidence(taskId: string) {
  const invalidate = useEvidenceInvalidation(taskId)
  return useMutation({ mutationFn: deleteTaskEvidence, onSuccess: invalidate })
}

export function useDownloadTaskEvidence() {
  return useMutation({ mutationFn: (evidence: TaskEvidence) => downloadTaskEvidence(evidence) })
}
