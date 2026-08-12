import { ApiClientError } from '@/services/httpClient'

import type {
  PeriodReviewEmployee,
  PeriodReviewTask,
  PeriodReviewTaskEvaluation,
} from '../types/managerPeriodReview.types'

export function formatReviewScore(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

export function formatReviewDate(value?: string | null, includeTime = false) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('vi-VN',
    includeTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' },
  ).format(date)
}

export function getPeriodReviewEmployeeName(employee: PeriodReviewEmployee) {
  return employee.employeeName || employee.fullName || employee.employee?.fullName || 'Nhân viên'
}

export function getTaskName(task: PeriodReviewTask) {
  return task.title || task.taskName || 'Công việc chưa có tên'
}

export function getTaskMaxConvertedScore(task: PeriodReviewTask) {
  return (
    task.maxConvertedScore ??
    task.maximumConvertedScore ??
    task.convertedMaxScore ??
    task.baseScore ??
    0
  )
}

export function getTaskFinalEvaluation(task: PeriodReviewTask) {
  return task.finalEvaluation ?? task.taskEvaluation ?? null
}

export function getEvaluatorName(evaluation: PeriodReviewTaskEvaluation) {
  return evaluation.evaluatorName || evaluation.reviewedByName || 'Người đánh giá'
}

export function getPeriodReviewErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Phiên đăng nhập không hợp lệ.'
    if (error.status === 403) return 'Bạn không có quyền thực hiện chức năng này.'
    if (error.status === 404) return 'Không tìm thấy nhân viên hoặc kỳ đánh giá.'
    if (error.status === 400) return error.message
    return error.message || fallback
  }

  return error instanceof Error && error.message ? error.message : fallback
}
