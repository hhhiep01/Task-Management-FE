import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useUserAccounts } from '@/features/accounts/hooks/useUserAccounts'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { PeriodStatus } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import { useWorkTemplates } from '@/features/work-templates/hooks/useWorkTemplates'
import { WorkType, getWorkTypeLabel, workTypeLabels } from '@/features/work-templates/types/workTemplate.types'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
import { formatDate } from '@/utils/formatDate'

import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks'
import { TaskWorkflowActions } from '../components/TaskWorkflowActions'
import {
  WorkTaskStatus,
  getTaskStatusLabel,
  isWorkTaskStatus,
  type CreateTaskRequest,
  type Task,
  type TaskFormPayload,
} from '../types/task.types'
import { getTaskStatusSecondaryText } from '../utils/taskPresentation'

const initialForm: TaskFormPayload = {
  periodId: '',
  workTemplateId: '',
  assigneeId: '',
  title: '',
  description: '',
  assignedDate: getTodayInputValue(),
  dueDate: '',
}

const fieldClassName =
  'w-full min-w-0 max-w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text-strong)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-teal-100'

const selectClassName = `${fieldClassName} truncate`

const taskFilterKeys = ['periodId', 'workTemplateId', 'organizationId', 'assignedBy', 'assigneeId', 'workType', 'status', 'dueDateFrom', 'dueDateTo'] as const

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toDateInputValue(value?: string | null) {
  return value?.slice(0, 10) ?? ''
}

function getPeriodId(task: Task) {
  return task.period?.id ?? task.periodId ?? ''
}

function getPeriodName(task: Task) {
  return task.period?.name ?? task.periodName ?? '-'
}

function getTemplateId(task: Task) {
  return task.workTemplate?.id ?? task.workTemplateId ?? ''
}

function getTemplateName(task: Task) {
  return task.workTemplate?.name ?? task.workTemplateName ?? '-'
}

function getAssigneeId(task: Task) {
  return task.assignee?.id ?? task.assigneeId ?? ''
}

function getAssigneeName(task: Task) {
  return task.assignee?.fullName ?? task.assigneeName ?? task.owner ?? '-'
}

function getWorkTypeValue(workType?: string | null) {
  return workType === 'AD_HOC' ? 1 : 0
}

function getProgress(task: Task) {
  return Math.min(100, Math.max(0, task.progressPercent ?? 0))
}

function isTaskPeriodLocked(task: Task) {
  return task.period?.status === PeriodStatus.LOCKED
}

function isClosedTask(task: Task) {
  return task.status === WorkTaskStatus.COMPLETED || task.status === WorkTaskStatus.CANCELLED
}

function getDaysUntilDue(task: Task) {
  const value = task.dueDate ?? task.due

  if (!value) {
    return null
  }

  const dateValue = value.slice(0, 10)
  const dueDate = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(dueDate.getTime())) {
    return null
  }

  const today = new Date(`${getTodayInputValue()}T00:00:00`)
  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
}

function getStatusVariant(task: Task) {
  if (task.status === WorkTaskStatus.COMPLETED) {
    return 'success' as const
  }

  if (task.status === WorkTaskStatus.CANCELLED) {
    return 'neutral' as const
  }

  if (task.status === WorkTaskStatus.WAITING_EVALUATION) {
    return 'warning' as const
  }

  if (task.status === WorkTaskStatus.REVISION_REQUIRED) {
    return 'warning' as const
  }

  if (task.status === WorkTaskStatus.IN_PROGRESS) {
    return 'primary' as const
  }

  return 'info' as const
}

function getDueBadge(task: Task) {
  const daysUntilDue = getDaysUntilDue(task)

  if (isClosedTask(task)) {
    return { label: formatDate(task.dueDate ?? task.due), variant: 'neutral' as const }
  }

  if (daysUntilDue === null) {
    return { label: 'Chưa có hạn', variant: 'neutral' as const }
  }

  if (daysUntilDue < 0) {
    return { label: `Quá hạn ${Math.abs(daysUntilDue)} ngày`, variant: 'danger' as const }
  }

  if (daysUntilDue === 0) {
    return { label: 'Hạn hôm nay', variant: 'warning' as const }
  }

  if (daysUntilDue <= 3) {
    return { label: `Còn ${daysUntilDue} ngày`, variant: 'warning' as const }
  }

  return { label: formatDate(task.dueDate ?? task.due), variant: 'info' as const }
}

type ReadOnlyFieldProps = {
  label: string
  value?: string | number | null
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="grid min-w-0 gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="min-w-0 break-words text-sm text-[var(--color-text-strong)]">
        {value || '-'}
      </span>
    </div>
  )
}

function ProgressIndicator({ value }: { value: number }) {
  return (
    <div className="grid min-w-32 gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">{value}%</span>
    </div>
  )
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="grid place-items-center px-5 py-10 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  )
}

function FieldError({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <p
      className={`min-h-4 min-w-0 break-words text-xs font-medium leading-4 ${
        show ? 'text-[var(--color-danger)]' : 'invisible'
      }`}
      aria-hidden={!show}
    >
      {children}
    </p>
  )
}

type TaskMobileCardProps = {
  task: Task
  onView: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  isDeleting: boolean
}

function TaskMobileCard({ task, onView, onEdit, onDelete, isDeleting }: TaskMobileCardProps) {
  const dueBadge = getDueBadge(task)

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--color-text-strong)]">{task.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{getTemplateName(task)}</p>
        </div>
        <div className="grid justify-items-start gap-1">
          <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
          {getTaskStatusSecondaryText(task) ? (
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              {getTaskStatusSecondaryText(task)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Người nhận
          </p>
          <p className="mt-1 font-medium text-[var(--color-text)]">{getAssigneeName(task)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Kỳ đánh giá
          </p>
          <p className="mt-1 font-medium text-[var(--color-text)]">{getPeriodName(task)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
        <div className="w-36">
          <ProgressIndicator value={getProgress(task)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
        <TaskWorkflowActions task={task} compact />
        <Button type="button" variant="ghost" size="sm" onClick={() => onView(task)}>
          Xem
        </Button>
        {!isTaskPeriodLocked(task) ? <>
          <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(task)}>Sửa</Button>
          <Button type="button" variant="danger" size="sm" onClick={() => void onDelete(task)} disabled={isDeleting}>Xóa</Button>
        </> : null}
      </div>
    </Card>
  )
}

export function TasksPage() {
  useDocumentTitle(`Giao việc | ${env.appName}`)

  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState<TaskFormPayload>(initialForm)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formError, setFormError] = useState('')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const listState = usePagedListState(taskFilterKeys)
  const tasksQuery = useTasks(listState.query)
  const periodsQuery = useEvaluationPeriods()
  const templatesQuery = useWorkTemplates()
  const accountsQuery = useUserAccounts()
  const organizationsQuery = useOrganizations()
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  const isSubmitting = createTaskMutation.isPending || updateTaskMutation.isPending
  const canCreateTask = user?.roleCode === 'TP' || user?.roleCode === 'PP'
  const modalTitle = editingTask ? 'Cập nhật công việc' : 'Giao công việc'
  const selectedTemplate = useMemo(
    () => templatesQuery.data?.items.find((template) => template.id === form.workTemplateId),
    [form.workTemplateId, templatesQuery.data],
  )
  const templateForRequest = selectedTemplate ?? editingTask?.workTemplate
  const activePeriods = useMemo(
    () => periodsQuery.data?.items.filter((period) => period.status === PeriodStatus.ACTIVE) ?? [],
    [periodsQuery.data],
  )
  const assigneeOptions = useMemo(
    () =>
      accountsQuery.data?.items.filter((account) => account.role.code.toUpperCase() !== 'ADMIN') ?? [],
    [accountsQuery.data],
  )
  const selectedPeriod = activePeriods.find((period) => period.id === form.periodId)
  const selectedAssignee = assigneeOptions.find((account) => account.id === form.assigneeId)
  const formApiError = useMemo(() => {
    const error = createTaskMutation.error || updateTaskMutation.error
    return error instanceof Error ? error.message : ''
  }, [createTaskMutation.error, updateTaskMutation.error])
  const deleteError =
    deleteTaskMutation.error instanceof Error ? deleteTaskMutation.error.message : ''

  const tasks = useMemo(() => tasksQuery.data?.items ?? [], [tasksQuery.data?.items])

  const overdueCount = useMemo(
    () =>
      tasks.filter((task) => {
        const daysUntilDue = getDaysUntilDue(task)
        return !isClosedTask(task) && daysUntilDue !== null && daysUntilDue < 0
      }).length,
    [tasks],
  )
  const showFieldErrors = Boolean(formError)

  const closeModal = () => {
    setForm({ ...initialForm, assignedDate: getTodayInputValue() })
    setEditingTask(null)
    setFormError('')
    setIsTaskModalOpen(false)
  }

  const openCreateModal = () => {
    if (!canCreateTask) {
      setFormError('Chỉ tài khoản TP hoặc PP được giao công việc.')
      return
    }

    setForm({ ...initialForm, assignedDate: getTodayInputValue() })
    setEditingTask(null)
    setFormError('')
    setIsTaskModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setForm({
      periodId: getPeriodId(task),
      workTemplateId: getTemplateId(task),
      assigneeId: getAssigneeId(task),
      title: task.title,
      description: task.description ?? '',
      assignedDate: toDateInputValue(task.assignedDate),
      dueDate: toDateInputValue(task.dueDate ?? task.due),
    })
    setFormError('')
    setIsTaskModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingTask && !canCreateTask) {
      setFormError('Chỉ tài khoản TP hoặc PP được giao công việc.')
      return
    }

    const payload: CreateTaskRequest = {
      periodId: form.periodId,
      workTemplateId: form.workTemplateId,
      assigneeId: form.assigneeId,
      title: form.title.trim(),
      description: form.description.trim(),
      expectedOutput: templateForRequest?.expectedOutput ?? editingTask?.expectedOutput ?? '',
      workType: getWorkTypeValue(templateForRequest?.workType ?? editingTask?.workType),
      assignedDate: form.assignedDate,
      dueDate: form.dueDate,
      completedDate: editingTask?.completedDate ?? null,
      baseScore: templateForRequest?.baseScore ?? editingTask?.baseScore ?? 0,
      difficultyPercent:
        templateForRequest?.difficultyPercent ?? editingTask?.difficultyPercent ?? 100,
      progressPercent: editingTask?.progressPercent ?? 0,
      resultDescription: editingTask?.resultDescription ?? null,
      status: isWorkTaskStatus(editingTask?.status) ? editingTask.status : WorkTaskStatus.NEW,
    }

    if (
      !payload.periodId ||
      !payload.workTemplateId ||
      !payload.assigneeId ||
      !payload.title ||
      !payload.expectedOutput ||
      !payload.assignedDate ||
      !payload.dueDate
    ) {
      setFormError(
        'Vui lòng chọn kỳ, danh mục công việc, người nhận và nhập đầy đủ thông tin bắt buộc.',
      )
      return
    }

    setFormError('')

    if (editingTask) {
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.id,
        payload,
      })
    } else {
      await createTaskMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (task: Task) => {
    const confirmed = window.confirm(`Xóa công việc "${task.title}"?`)

    if (!confirmed) {
      return
    }

    await deleteTaskMutation.mutateAsync(task.id)
  }

  const openDetailPage = (task: Task) => {
    void navigate(`/manager/tasks/${task.id}`)
  }

  const columns: DataTableColumn<Task>[] = [
    {
      key: 'task',
      header: 'Công việc',
      className: 'min-w-80',
      render: (task) => (
        <div>
          <p className="font-semibold text-[var(--color-text-strong)]">{task.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">
            {task.description || getTemplateName(task)}
          </p>
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Người nhận',
      className: 'whitespace-nowrap text-[var(--color-text)]',
      render: getAssigneeName,
    },
    {
      key: 'period',
      header: 'Kỳ đánh giá',
      className: 'whitespace-nowrap text-[var(--color-text-muted)]',
      render: getPeriodName,
    },
    {
      key: 'template',
      header: 'Danh mục',
      className: 'min-w-56 text-[var(--color-text-muted)]',
      render: getTemplateName,
    },
    {
      key: 'assigned',
      header: 'Ngày giao',
      className: 'whitespace-nowrap text-[var(--color-text-muted)]',
      render: (task) => formatDate(task.assignedDate),
    },
    {
      key: 'due',
      header: 'Hạn',
      className: 'whitespace-nowrap',
      render: (task) => {
        const dueBadge = getDueBadge(task)
        return <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
      },
    },
    {
      key: 'progress',
      header: 'Tiến độ',
      render: (task) => <ProgressIndicator value={getProgress(task)} />,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (task) => (
        <div className="grid justify-items-start gap-1">
          <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
          {getTaskStatusSecondaryText(task) ? (
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              {getTaskStatusSecondaryText(task)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap',
      render: (task) => (
        <div className="flex justify-end gap-2">
          <TaskWorkflowActions task={task} compact />
          <Button type="button" variant="ghost" size="sm" onClick={() => openDetailPage(task)}>
            Xem
          </Button>
          {!isTaskPeriodLocked(task) ? <>
            <Button type="button" variant="secondary" size="sm" onClick={() => openEditModal(task)}>Sửa</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(task)} disabled={deleteTaskMutation.isPending}>Xóa</Button>
          </> : null}
        </div>
      ),
    },
  ]

  return (
    <section className="grid w-full min-w-0 max-w-full gap-6">
      <PageHeader
        eyebrow="Trưởng phòng"
        title="Giao việc"
        description="Tạo, cập nhật và theo dõi các công việc đã giao cho nhân sự theo kỳ đánh giá."
        actions={
          canCreateTask ? (
            <Button type="button" onClick={openCreateModal}>
              Giao công việc
            </Button>
          ) : null
        }
      />

      {!canCreateTask && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] px-4 py-3 text-sm font-medium text-[var(--color-warning)]">
          Chỉ tài khoản TP hoặc PP được giao công việc.
        </p>
      )}

      <Card className="w-full min-w-0 max-w-full p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">
              Bộ lọc công việc
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Tìm nhanh theo tên, người nhận, kỳ đánh giá, trạng thái và hạn xử lý.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={overdueCount ? 'danger' : 'success'}>
              {overdueCount} quá hạn
            </Badge>
            <Badge variant="primary">{tasksQuery.data?.totalCount ?? 0} kết quả</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Tìm kiếm</span>
            <input
              value={listState.searchInput}
              onChange={(event) => listState.setSearchInput(event.target.value)}
              className={fieldClassName}
              placeholder="Tên công việc, mô tả, người nhận..."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Người nhận</span>
            <select
              value={listState.filters.assigneeId}
              onChange={(event) => listState.setFilter('assigneeId', event.target.value)}
              className={fieldClassName}
            >
              <option value="">Tất cả</option>
              {assigneeOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Kỳ đánh giá</span>
            <select
              value={listState.filters.periodId}
              onChange={(event) => listState.setFilter('periodId', event.target.value)}
              className={fieldClassName}
            >
              <option value="">Tất cả</option>
              {periodsQuery.data?.items.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Trạng thái</span>
            <select
              value={listState.filters.status}
              onChange={(event) => listState.setFilter('status', event.target.value)}
              className={fieldClassName}
            >
              <option value="">Tất cả</option>
              {Object.values(WorkTaskStatus).map((status) => (
                <option key={status} value={status}>
                  {getTaskStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Danh mục</span>
            <select
              value={listState.filters.workTemplateId}
              onChange={(event) => listState.setFilter('workTemplateId', event.target.value)}
              className={fieldClassName}
            >
              <option value="">Tất cả</option>
              {templatesQuery.data?.items.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>

          <TaskFilterSelect label="Phòng ban" value={listState.filters.organizationId} onChange={(value) => listState.setFilter('organizationId', value)} options={organizationsQuery.data?.items.map((item) => ({ value: item.id, label: item.name })) ?? []} />
          <TaskFilterSelect label="Người giao" value={listState.filters.assignedBy} onChange={(value) => listState.setFilter('assignedBy', value)} options={accountsQuery.data?.items.map((item) => ({ value: item.id, label: item.fullName })) ?? []} />
          <TaskFilterSelect label="Loại công việc" value={listState.filters.workType} onChange={(value) => listState.setFilter('workType', value)} options={Object.values(WorkType).map((value) => ({ value, label: workTypeLabels[value] }))} />
          <TaskFilterDate label="Hạn từ ngày" value={listState.filters.dueDateFrom} onChange={(value) => listState.setFilter('dueDateFrom', value)} />
          <TaskFilterDate label="Hạn đến ngày" value={listState.filters.dueDateTo} onChange={(value) => listState.setFilter('dueDateTo', value)} />

          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={listState.clearFilters}
              disabled={!listState.hasActiveFilters}
            >
              Xóa lọc
            </Button>
          </div>
        </div>
      </Card>

      {deleteError && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
          {deleteError}
        </p>
      )}

      {tasksQuery.isLoading ? (
        <EmptyState
          title="Đang tải danh sách công việc"
          description="Hệ thống đang lấy dữ liệu công việc và các thông tin liên quan."
        />
      ) : tasksQuery.isError ? (
        <EmptyState
          title="Không tải được danh sách công việc"
          description={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Vui lòng kiểm tra kết nối hoặc thử lại sau.'}
        />
      ) : tasks.length ? (
        <>
          <div className="hidden w-full min-w-0 max-w-full md:block">
            <DataTable
              title="Danh sách công việc"
              items={tasks}
              columns={columns}
              getRowKey={(task) => task.id}
              countLabel={`${tasksQuery.data?.totalCount ?? 0} công việc`}
              minWidthClassName="min-w-[1180px]"
              emptyMessage="Không có công việc nào khớp với bộ lọc hiện tại."
            />
          </div>

          <div className="grid gap-3 md:hidden">
            {tasks.map((task) => (
                <TaskMobileCard
                  key={task.id}
                  task={task}
                  onView={openDetailPage}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  isDeleting={deleteTaskMutation.isPending}
                />
              ))}
          </div>
          {tasksQuery.data ? (
            <Card className="overflow-hidden">
              <Pagination {...tasksQuery.data} onPageChange={listState.setPageNumber} onPageSizeChange={listState.setPageSize} disabled={tasksQuery.isFetching} />
            </Card>
          ) : null}
        </>
      ) : (
        <EmptyState
          title={listState.hasActiveFilters ? 'Không có kết quả phù hợp' : 'Chưa có công việc nào'}
          description={listState.hasActiveFilters ? 'Hãy thử thay đổi hoặc xóa bộ lọc.' : 'Khi có công việc được giao, danh sách sẽ hiển thị tại đây.'}
          action={
            listState.hasActiveFilters ? (
              <Button type="button" variant="secondary" onClick={listState.clearFilters}>Xóa bộ lọc</Button>
            ) : canCreateTask ? (
              <Button type="button" onClick={openCreateModal}>
                Giao công việc đầu tiên
              </Button>
            ) : null
          }
        />
      )}

      <Modal
        open={isTaskModalOpen}
        onClose={closeModal}
        title={modalTitle}
        description="Chỉ nhập thông tin giao việc. Dữ liệu chuẩn được lấy từ danh mục công việc."
        size="xl"
      >
        <form onSubmit={handleSubmit} className="mx-auto grid w-full min-w-0 max-w-5xl gap-5">
          <section className="grid min-w-0 gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
            <h3 className="text-base font-semibold text-[var(--color-text-strong)]">
              Thông tin giao việc
            </h3>
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">Kỳ đánh giá</span>
                <select
                  value={form.periodId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, periodId: event.target.value }))
                  }
                  className={selectClassName}
                  title={selectedPeriod?.name}
                >
                  <option value="">Chọn kỳ đang hoạt động</option>
                  {activePeriods.map((period) => (
                    <option key={period.id} value={period.id} title={period.name}>
                      {period.name}
                    </option>
                  ))}
                </select>
                <FieldError show={showFieldErrors && !form.periodId}>
                  Vui lòng chọn kỳ đánh giá.
                </FieldError>
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  Danh mục công việc
                </span>
                <select
                  value={form.workTemplateId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      workTemplateId: event.target.value,
                    }))
                  }
                  className={selectClassName}
                  title={selectedTemplate?.name ?? editingTask?.workTemplate?.name}
                >
                  <option value="">Chọn danh mục công việc</option>
                  {templatesQuery.data?.items.map((template) => (
                    <option key={template.id} value={template.id} title={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <FieldError show={showFieldErrors && !form.workTemplateId}>
                  Vui lòng chọn danh mục công việc.
                </FieldError>
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  Người nhận việc
                </span>
                <select
                  value={form.assigneeId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, assigneeId: event.target.value }))
                  }
                  className={selectClassName}
                  title={
                    selectedAssignee
                      ? `${selectedAssignee.fullName} - ${selectedAssignee.email}`
                      : undefined
                  }
                >
                  <option value="">Chọn người nhận</option>
                  {assigneeOptions.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                      title={`${account.fullName} - ${account.email}`}
                    >
                      {account.fullName} - {account.email}
                    </option>
                  ))}
                </select>
                <FieldError show={showFieldErrors && !form.assigneeId}>
                  Vui lòng chọn người nhận việc.
                </FieldError>
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">Tiêu đề</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className={fieldClassName}
                  placeholder="Nhập tiêu đề công việc"
                />
                <FieldError show={showFieldErrors && !form.title.trim()}>
                  Vui lòng nhập tiêu đề công việc.
                </FieldError>
              </label>

              <label className="grid min-w-0 gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-[var(--color-text)]">Mô tả</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className={`${fieldClassName} min-h-24`}
                  placeholder="Nhập yêu cầu chi tiết"
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Mô tả ngắn gọn phạm vi, yêu cầu và điểm cần lưu ý khi thực hiện.
                </p>
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">Ngày giao</span>
                <input
                  type="date"
                  value={form.assignedDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, assignedDate: event.target.value }))
                  }
                  className={fieldClassName}
                />
                <FieldError show={showFieldErrors && !form.assignedDate}>
                  Vui lòng chọn ngày giao.
                </FieldError>
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  Hạn hoàn thành
                </span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  className={fieldClassName}
                />
                <FieldError show={showFieldErrors && !form.dueDate}>
                  Vui lòng chọn hạn hoàn thành.
                </FieldError>
              </label>
            </div>
          </section>

          <section className="grid min-w-0 gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="text-base font-semibold text-[var(--color-text-strong)]">
              Thông tin từ danh mục chuẩn
            </h3>
            <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
              <ReadOnlyField label="Kết quả mong đợi" value={selectedTemplate?.expectedOutput} />
              <ReadOnlyField
                label="Loại công việc"
                value={getWorkTypeLabel(selectedTemplate?.workType)}
              />
              <ReadOnlyField label="Hạn chuẩn" value={selectedTemplate?.standardDeadline} />
              <ReadOnlyField label="Điểm cơ bản" value={selectedTemplate?.baseScore} />
              <ReadOnlyField
                label="Độ khó"
                value={selectedTemplate ? `${selectedTemplate.difficultyPercent}%` : undefined}
              />
              <ReadOnlyField
                label="Yêu cầu minh chứng"
                value={selectedTemplate?.evidenceRequirement}
              />
            </div>
          </section>

          {(formError || formApiError) && (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {formError || formApiError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang giao...' : editingTask ? 'Lưu' : 'Giao công việc'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

function TaskFilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName}>
        <option value="">Tất cả</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function TaskFilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} />
    </label>
  )
}
