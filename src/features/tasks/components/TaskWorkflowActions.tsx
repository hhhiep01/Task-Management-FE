import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/hooks/useAuth'

import type { TaskWorkflowAction } from '../api/taskApi'
import { useTaskWorkflowAction, useUpdateTaskResult } from '../hooks/useTasks'
import { WorkTaskStatus, type Task } from '../types/task.types'
import { getProgress } from '../utils/taskPresentation'
import { TaskProgress } from './TaskProgress'
import { TaskEvaluationAction } from './TaskEvaluationAction'

type PendingConfirmation = {
  action: TaskWorkflowAction
  title: string
  description: string
  confirmLabel: string
  variant: 'primary' | 'secondary' | 'danger'
}

type TaskWorkflowActionsProps = {
  task: Task
  compact?: boolean
}

function isSameUser(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase())
}

export function TaskWorkflowActions({ task, compact = false }: TaskWorkflowActionsProps) {
  const { user } = useAuth()
  const workflowMutation = useTaskWorkflowAction()
  const resultMutation = useUpdateTaskResult()
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null)
  const [isResultEditorOpen, setIsResultEditorOpen] = useState(false)
  const [progressPercent, setProgressPercent] = useState(task.progressPercent ?? 0)
  const [resultDescription, setResultDescription] = useState(task.resultDescription ?? '')
  const [resultError, setResultError] = useState('')
  const [resultSuccess, setResultSuccess] = useState('')
  const [evaluationSuccess, setEvaluationSuccess] = useState('')

  useEffect(() => {
    setProgressPercent(task.progressPercent ?? 0)
    setResultDescription(task.resultDescription ?? '')
  }, [task.id, task.progressPercent, task.resultDescription])

  const isAssignee = isSameUser(user?.id, task.assignee?.id ?? task.assigneeId)
  const isAssigner = isSameUser(user?.id, task.assigner?.id)
  const isManagerEvaluator = user?.role === 'manager' && ['TP', 'PP'].includes(user.roleCode.toUpperCase())
  const isClosed =
    task.status === WorkTaskStatus.COMPLETED || task.status === WorkTaskStatus.CANCELLED
  const hasResult = Boolean(task.resultDescription?.trim() || resultSuccess && resultDescription.trim())
  const hasUnsavedResult =
    progressPercent !== (task.progressPercent ?? 0) ||
    resultDescription.trim() !== (task.resultDescription ?? '').trim()
  const canSubmitSavedResult = hasResult && (!hasUnsavedResult || Boolean(resultSuccess))
  const canStart = isAssignee && task.status === WorkTaskStatus.NEW
  const canSubmit =
    isAssignee &&
    (task.status === WorkTaskStatus.IN_PROGRESS ||
      task.status === WorkTaskStatus.REVISION_REQUIRED)
  const canEditResult = canSubmit
  const canEvaluate = isManagerEvaluator && task.status === WorkTaskStatus.WAITING_EVALUATION
  const canCancel = isAssigner && !isClosed
  const isWaitingAssignee = isAssignee && task.status === WorkTaskStatus.WAITING_EVALUATION
  const hasActions = canStart || canEditResult || canSubmit || canEvaluate || canCancel
  const hasVisibleState = compact ? hasActions : true
  const isPending = workflowMutation.isPending || resultMutation.isPending

  const execute = async (action: TaskWorkflowAction) => {
    try {
      await workflowMutation.mutateAsync({ taskId: task.id, action })
      setConfirmation(null)
    } catch {
      // React Query exposes the backend error in the action panel.
    }
  }

  const saveResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedProgress = Math.min(100, Math.max(0, Number(progressPercent)))
    const normalizedDescription = resultDescription.trim()

    if (!normalizedDescription) {
      setResultError('Vui lòng nhập kết quả công việc trước khi lưu.')
      return
    }

    setResultError('')
    setResultSuccess('')
    try {
      await resultMutation.mutateAsync({
        taskId: task.id,
        payload: {
          progressPercent: normalizedProgress,
          resultDescription: normalizedDescription,
        },
      })
      setProgressPercent(normalizedProgress)
      setResultDescription(normalizedDescription)
      setResultSuccess('Đã cập nhật tiến độ và kết quả.')
    } catch {
      // React Query exposes the backend error in the result editor.
    }
  }

  const changeProgress = (value: number) => {
    setProgressPercent(value)
    setResultSuccess('')
  }

  const changeDescription = (value: string) => {
    setResultDescription(value)
    setResultSuccess('')
  }

  if (!hasVisibleState) return null

  const controls = (
    <div className={`flex gap-2 ${compact ? 'flex-wrap justify-end' : 'flex-col sm:flex-row sm:flex-wrap'}`}>
      {canStart ? (
        <Button size="sm" disabled={isPending} onClick={() => void execute('start')}>
          {isPending ? 'Đang xử lý...' : 'Bắt đầu'}
        </Button>
      ) : null}
      {canEditResult && compact ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => setIsResultEditorOpen(true)}
        >
          Cập nhật kết quả
        </Button>
      ) : null}
      {canSubmit ? (
        <Button
          size="sm"
          disabled={isPending || !canSubmitSavedResult}
          onClick={() => void execute('submit')}
          title={!canSubmitSavedResult ? 'Cần cập nhật tiến độ mới nhất trước khi gửi đánh giá' : undefined}
        >
          {isPending
            ? 'Đang xử lý...'
            : task.status === WorkTaskStatus.REVISION_REQUIRED
              ? 'Gửi lại'
              : 'Gửi đánh giá'}
        </Button>
      ) : null}
      {canEvaluate ? (
        <TaskEvaluationAction task={task} onEvaluated={setEvaluationSuccess} />
      ) : null}
    </div>
  )

  const cancelControl = canCancel ? (
    <div className={compact ? '' : 'border-t border-[var(--color-border)] pt-3'}>
      <Button
        size="sm"
        variant="ghost"
        className="text-[var(--color-danger)]"
        disabled={isPending}
        onClick={() =>
          setConfirmation({
            action: 'cancel',
            title: 'Hủy công việc?',
            description: 'Công việc sẽ chuyển sang trạng thái đã hủy và không thể tiếp tục quy trình.',
            confirmLabel: 'Hủy công việc',
            variant: 'danger',
          })
        }
      >
        Hủy công việc
      </Button>
    </div>
  ) : null

  return (
    <>
      {compact ? (
        <div className="grid gap-1.5">
          {controls}
          {cancelControl}
          {workflowMutation.error instanceof Error ? (
            <p className="max-w-72 text-right text-xs font-medium text-[var(--color-danger)]" role="alert">
              {workflowMutation.error.message}
            </p>
          ) : null}
          {evaluationSuccess ? <p className="text-xs font-medium text-[var(--color-success)]" role="status">{evaluationSuccess}</p> : null}
        </div>
      ) : (
        <Card variant="muted" className="grid gap-3 p-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Kết quả thực hiện</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Cập nhật tiến độ, kết quả và thực hiện bước tiếp theo của công việc.
            </p>
          </div>
          {task.status === WorkTaskStatus.REVISION_REQUIRED ? (
            <p className="rounded-[var(--radius-md)] border border-amber-200 bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-medium text-[var(--color-warning)]">
              Công việc cần chỉnh sửa kết quả trước khi gửi lại.
            </p>
          ) : null}
          {isWaitingAssignee ? (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)]">
              Đang chờ người giao việc đánh giá. Kết quả hiện ở chế độ chỉ đọc.
            </p>
          ) : null}
          {canEditResult ? (
            <ResultEditor
              progressPercent={progressPercent}
              resultDescription={resultDescription}
              onProgressChange={changeProgress}
              onDescriptionChange={changeDescription}
              onSubmit={saveResult}
              isPending={resultMutation.isPending}
              error={resultError || (resultMutation.error instanceof Error ? resultMutation.error.message : '')}
              success={resultSuccess}
              submitLabel={task.status === WorkTaskStatus.REVISION_REQUIRED ? 'Lưu thay đổi' : 'Cập nhật tiến độ'}
              submitVariant="secondary"
            />
          ) : null}
          {!canEditResult ? (
            <ReadOnlyResult task={task} />
          ) : null}
          {canSubmit && !canSubmitSavedResult ? (
            <p className="text-sm text-[var(--color-danger)]">
              Hãy cập nhật tiến độ và kết quả mới nhất trước khi gửi đánh giá.
            </p>
          ) : null}
          {controls}
          {cancelControl}
          {workflowMutation.error instanceof Error ? (
            <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">
              {workflowMutation.error.message}
            </p>
          ) : null}
          {evaluationSuccess ? <p className="text-sm font-medium text-[var(--color-success)]" role="status">{evaluationSuccess}</p> : null}
        </Card>
      )}

      <Modal
        open={Boolean(confirmation)}
        onClose={() => !isPending && setConfirmation(null)}
        title={confirmation?.title ?? ''}
        description={confirmation?.description}
        size="sm"
      >
        <div className="grid gap-4">
          {workflowMutation.error instanceof Error ? (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]" role="alert">
              {workflowMutation.error.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={isPending} onClick={() => setConfirmation(null)}>Quay lại</Button>
            <Button
              variant={confirmation?.variant}
              disabled={isPending || !confirmation}
              onClick={() => confirmation && void execute(confirmation.action)}
            >
              {isPending ? 'Đang xử lý...' : confirmation?.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isResultEditorOpen}
        onClose={() => !resultMutation.isPending && setIsResultEditorOpen(false)}
        title={task.status === WorkTaskStatus.REVISION_REQUIRED ? 'Cập nhật lại kết quả' : 'Cập nhật kết quả'}
        description="Cập nhật tiến độ và kết quả trước khi gửi cho người giao việc đánh giá."
        size="md"
      >
        <ResultEditor
          progressPercent={progressPercent}
          resultDescription={resultDescription}
          onProgressChange={changeProgress}
          onDescriptionChange={changeDescription}
          onSubmit={saveResult}
          isPending={resultMutation.isPending}
          error={resultError || (resultMutation.error instanceof Error ? resultMutation.error.message : '')}
          success={resultSuccess}
          submitLabel={task.status === WorkTaskStatus.REVISION_REQUIRED ? 'Lưu thay đổi' : 'Cập nhật tiến độ'}
          onCancel={() => setIsResultEditorOpen(false)}
        />
      </Modal>
    </>
  )
}

function ResultEditor({
  progressPercent,
  resultDescription,
  onProgressChange,
  onDescriptionChange,
  onSubmit,
  isPending,
  error,
  success,
  submitLabel,
  submitVariant = 'primary',
  onCancel,
}: {
  progressPercent: number
  resultDescription: string
  onProgressChange: (value: number) => void
  onDescriptionChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isPending: boolean
  error: string
  success: string
  submitLabel: string
  submitVariant?: 'primary' | 'secondary'
  onCancel?: () => void
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2">
        <span className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--color-text)]">
          Tiến độ
          <span className="font-semibold text-[var(--color-primary)]">{progressPercent}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={progressPercent}
          onChange={(event) => onProgressChange(Number(event.target.value))}
          disabled={isPending}
          className="w-full accent-[var(--color-primary)]"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">Kết quả công việc</span>
        <textarea
          value={resultDescription}
          onChange={(event) => onDescriptionChange(event.target.value)}
          disabled={isPending}
          rows={5}
          className="min-h-32 resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:opacity-60"
          placeholder="Mô tả kết quả đã hoàn thành"
        />
      </label>

      {error ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-[var(--color-success)]" role="status">{success}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? <Button variant="secondary" disabled={isPending} onClick={onCancel}>Quay lại</Button> : null}
        <Button type="submit" variant={submitVariant} disabled={isPending}>
          {isPending ? 'Đang lưu...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function ReadOnlyResult({ task }: { task: Task }) {
  return (
    <div className="grid gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
      <TaskProgress value={getProgress(task)} label="Tiến độ đã ghi nhận" />
      <div className="border-t border-[var(--color-border)] pt-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Kết quả công việc</h3>
        {task.resultDescription ? (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">{task.resultDescription}</p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Chưa có kết quả được cập nhật.</p>
        )}
      </div>
    </div>
  )
}
