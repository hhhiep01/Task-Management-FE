import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ApiClientError } from '@/services/httpClient'
import { formatDate } from '@/utils/formatDate'

import { useEvaluateTask } from '../hooks/useTaskEvaluations'
import type { Task } from '../types/task.types'
import { TaskEvaluationDecision, type EvaluateTaskRequest } from '../types/taskEvaluation.types'
import { getAssigneeName, getPeriodName, getProgress } from '../utils/taskPresentation'
import { TaskProgress } from './TaskProgress'

export function TaskEvaluationAction({ task, onEvaluated }: { task: Task; onEvaluated?: (message: string) => void }) {
  const { user } = useAuth()
  const mutation = useEvaluateTask(task.id)
  const [open, setOpen] = useState(false)
  const [confirmApproval, setConfirmApproval] = useState(false)
  const [progressPercent, setProgressPercent] = useState(getProgress(task))
  const [qualityPercent, setQualityPercent] = useState(100)
  const [decision, setDecision] = useState<TaskEvaluationDecision>(TaskEvaluationDecision.APPROVED)
  const [comment, setComment] = useState('')
  const [validationError, setValidationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const formId = `task-evaluation-${task.id}`

  const detailPath = user?.role === 'employee' ? `/employee/tasks/${task.id}` : `/manager/tasks/${task.id}`

  const reset = () => {
    setProgressPercent(getProgress(task))
    setQualityPercent(100)
    setDecision(TaskEvaluationDecision.APPROVED)
    setComment('')
    setValidationError('')
    setConfirmApproval(false)
    mutation.reset()
  }

  const openDialog = () => {
    reset()
    setSuccessMessage('')
    setOpen(true)
  }

  const closeDialog = () => {
    if (mutation.isPending) return
    setOpen(false)
    setConfirmApproval(false)
  }

  const getPayload = (): EvaluateTaskRequest | null => {
    if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      setValidationError('Mức độ hoàn thành phải từ 0 đến 100.')
      return null
    }
    if (!Number.isFinite(qualityPercent) || qualityPercent < 0 || qualityPercent > 100) {
      setValidationError('Chất lượng phải từ 0 đến 100.')
      return null
    }
    setValidationError('')
    return {
      progressPercent,
      qualityPercent,
      comment: comment.trim() || null,
      decision,
    }
  }

  const submit = async (payload: EvaluateTaskRequest) => {
    try {
      await mutation.mutateAsync(payload)
      const message = payload.decision === TaskEvaluationDecision.APPROVED
        ? 'Đã duyệt và hoàn thành công việc.'
        : 'Đã gửi yêu cầu chỉnh sửa.'
      setOpen(false)
      setConfirmApproval(false)
      if (!onEvaluated) setSuccessMessage(message)
      onEvaluated?.(message)
    } catch {
      // The backend error remains visible in the evaluation dialog.
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = getPayload()
    if (!payload) return
    if (payload.decision === TaskEvaluationDecision.APPROVED) {
      setConfirmApproval(true)
      return
    }
    void submit(payload)
  }

  const mutationMessage = mutation.error instanceof Error ? mutation.error.message : ''
  const conflictMessage = mutation.error instanceof ApiClientError && mutation.error.status === 409
    ? ' Công việc đã thay đổi. Hãy đóng hộp thoại và xem lại dữ liệu mới nhất trước khi đánh giá lại.'
    : ''

  const footer = confirmApproval ? (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button variant="secondary" disabled={mutation.isPending} onClick={() => setConfirmApproval(false)}>Xem lại</Button>
      <Button disabled={mutation.isPending} onClick={() => { const payload = getPayload(); if (payload) void submit(payload) }}>
        {mutation.isPending ? 'Đang duyệt...' : 'Duyệt & hoàn thành'}
      </Button>
    </div>
  ) : (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button variant="secondary" disabled={mutation.isPending} onClick={closeDialog}>Đóng</Button>
      <Button
        type="submit"
        form={formId}
        variant={decision === TaskEvaluationDecision.APPROVED ? 'primary' : 'secondary'}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Đang gửi...' : decision === TaskEvaluationDecision.APPROVED ? 'Duyệt & hoàn thành' : 'Gửi yêu cầu chỉnh sửa'}
      </Button>
    </div>
  )

  return (
    <div className="grid gap-1.5">
      <Button size="sm" onClick={openDialog}>Đánh giá</Button>
      {successMessage ? <p className="text-xs font-medium text-[var(--color-success)]" role="status">{successMessage}</p> : null}

      <Modal
        open={open}
        onClose={closeDialog}
        title={confirmApproval ? 'Xác nhận duyệt công việc' : 'Đánh giá công việc'}
        description={confirmApproval ? 'Công việc sẽ chuyển sang trạng thái Hoàn thành.' : `${getAssigneeName(task)} · ${getPeriodName(task)}`}
        size="wide"
        footer={footer}
      >
        {confirmApproval ? (
          <div className="grid min-w-0 gap-3">
            <p className="min-w-0 break-words text-sm leading-6 text-[var(--color-text)]">
              Xác nhận kết quả của <strong className="font-semibold text-[var(--color-text-strong)]">“{task.title}”</strong> đạt yêu cầu. Hệ thống sẽ hoàn thành công việc và ghi nhận điểm đánh giá.
            </p>
            {mutationMessage ? <ErrorMessage>{mutationMessage}{conflictMessage}</ErrorMessage> : null}
          </div>
        ) : (
          <form
            id={formId}
            className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-0"
            onSubmit={handleSubmit}
          >
            <div className="w-full min-w-0 max-w-full lg:pr-5">
              <ReviewContext task={task} detailPath={detailPath} />
            </div>

            <section
              className="grid w-full min-w-0 max-w-full content-start gap-3 border-t border-[var(--color-border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
              aria-labelledby="evaluation-fields-title"
            >
              <div className="min-w-0">
                <h3 id="evaluation-fields-title" className="break-words font-semibold text-[var(--color-text-strong)]">Đánh giá của quản lý</h3>
                <p className="mt-1 break-words whitespace-normal text-sm leading-5 text-[var(--color-text-muted)]">Đánh giá mức độ hoàn thành và chất lượng kết quả nhân viên đã báo cáo.</p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <PercentField label="Mức độ hoàn thành" value={progressPercent} onChange={setProgressPercent} disabled={mutation.isPending} />
                <PercentField label="Chất lượng" value={qualityPercent} onChange={setQualityPercent} disabled={mutation.isPending} />
              </div>

              <fieldset className="grid min-w-0 gap-2">
                <legend className="text-sm font-medium text-[var(--color-text)]">Quyết định</legend>
                <div className="grid min-w-0 gap-2">
                  <DecisionOption
                    name={`decision-${task.id}`}
                    value={TaskEvaluationDecision.APPROVED}
                    checked={decision === TaskEvaluationDecision.APPROVED}
                    onChange={setDecision}
                    disabled={mutation.isPending}
                  >
                    Duyệt
                  </DecisionOption>
                  <DecisionOption
                    name={`decision-${task.id}`}
                    value={TaskEvaluationDecision.REVISION_REQUIRED}
                    checked={decision === TaskEvaluationDecision.REVISION_REQUIRED}
                    onChange={setDecision}
                    disabled={mutation.isPending}
                  >
                    Yêu cầu chỉnh sửa
                  </DecisionOption>
                </div>
              </fieldset>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">Nhận xét</span>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  disabled={mutation.isPending}
                  className="min-h-24 w-full min-w-0 max-w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
                  placeholder="Nhập nhận xét về kết quả hoặc nội dung cần chỉnh sửa..."
                />
                {decision === TaskEvaluationDecision.REVISION_REQUIRED ? (
                  <span className="text-xs text-[var(--color-warning)]">Nêu rõ nội dung nhân viên cần bổ sung hoặc điều chỉnh.</span>
                ) : null}
              </label>
            </section>

            {validationError || mutationMessage ? (
              <div className="grid min-w-0 gap-2 lg:col-span-2 lg:pt-1">
                {validationError ? <ErrorMessage>{validationError}</ErrorMessage> : null}
                {mutationMessage ? <ErrorMessage>{mutationMessage}{conflictMessage}</ErrorMessage> : null}
              </div>
            ) : null}
          </form>
        )}
      </Modal>
    </div>
  )
}

function ReviewContext({ task, detailPath }: { task: Task; detailPath: string }) {
  return (
    <div className="grid w-full min-w-0 max-w-full gap-4">
      <section className="min-w-0 max-w-full" aria-labelledby="task-review-title">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Công việc cần đánh giá</p>
        <h3
          id="task-review-title"
          className="mt-1 min-w-0 max-w-full break-words whitespace-normal text-lg font-semibold leading-6 text-[var(--color-text-strong)]"
        >
          {task.title}
        </h3>
        <p className="mt-1.5 min-w-0 max-w-full break-words whitespace-pre-wrap text-sm leading-5 text-[var(--color-text)]">
          {task.description || 'Chưa có mô tả.'}
        </p>

        <dl className="mt-3 grid min-w-0 gap-x-5 gap-y-2 sm:grid-cols-3">
          <MetadataRow label="Hạn hoàn thành" value={formatDate(task.dueDate ?? task.due)} />
          <MetadataRow label="Điểm cơ bản" value={task.baseScore} />
          <MetadataRow label="Độ khó" value={task.difficultyPercent === undefined ? undefined : `${task.difficultyPercent}%`} />
        </dl>

        <div className="mt-3 min-w-0 max-w-full">
          <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">Kết quả mong đợi</h4>
          <p className="mt-1 min-w-0 max-w-full break-words whitespace-pre-wrap text-sm leading-5 text-[var(--color-text)]">
            {task.expectedOutput || 'Chưa có nội dung.'}
          </p>
        </div>
      </section>

      <section
        className="min-w-0 max-w-full border-t border-[var(--color-border)] pt-3"
        aria-labelledby="employee-result-title"
      >
        <h3 id="employee-result-title" className="font-semibold text-[var(--color-text-strong)]">Kết quả thực hiện</h3>
        <div className="mt-2 w-full min-w-0 max-w-full">
          <TaskProgress value={getProgress(task)} label="Tiến độ" />
        </div>
        <p className="mt-2 min-w-0 max-w-full break-words whitespace-pre-wrap text-sm leading-5 text-[var(--color-text)]">
          {task.resultDescription || 'Nhân viên chưa cập nhật nội dung kết quả.'}
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium">
          <Link to={detailPath} className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Xem chi tiết</Link>
          <Link to={`${detailPath}#task-evidence`} className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Xem minh chứng</Link>
        </div>
      </section>
    </div>
  )
}

function PercentField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="min-w-0 break-words text-sm font-medium text-[var(--color-text)]">{label}</span>
      <div className="relative w-full min-w-0 max-w-full">
        <input type="number" min="0" max="100" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} disabled={disabled} className="h-10 w-full min-w-0 max-w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 pr-9 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">%</span>
      </div>
    </label>
  )
}

function DecisionOption({ name, value, checked, onChange, disabled, children }: { name: string; value: TaskEvaluationDecision; checked: boolean; onChange: (value: TaskEvaluationDecision) => void; disabled: boolean; children: ReactNode }) {
  const selectedClass = value === TaskEvaluationDecision.APPROVED
    ? 'text-[var(--color-success)]'
    : 'text-[var(--color-warning)]'

  return (
    <label className={`flex min-h-8 min-w-0 cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] px-1 py-1 text-sm font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] ${checked ? selectedClass : 'text-[var(--color-text-strong)]'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
      />
      <span className="min-w-0 break-words">{children}</span>
    </label>
  )
}

function MetadataRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 text-sm">
      <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-[var(--color-text-strong)]">{value ?? '-'}</dd>
    </div>
  )
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return <p className="min-w-0 break-words rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]" role="alert">{children}</p>
}
