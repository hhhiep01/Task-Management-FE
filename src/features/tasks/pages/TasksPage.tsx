import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useUserAccounts } from '@/features/accounts/hooks/useUserAccounts'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { PeriodStatus } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import { useWorkTemplates } from '@/features/work-templates/hooks/useWorkTemplates'
import { getWorkTypeLabel } from '@/features/work-templates/types/workTemplate.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'

import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks'
import {
  WorkTaskStatus,
  getTaskStatusLabel,
  type CreateTaskRequest,
  type Task,
  type TaskFormPayload,
} from '../types/task.types'

const initialForm: TaskFormPayload = {
  periodId: '',
  workTemplateId: '',
  assigneeId: '',
  title: '',
  description: '',
  assignedDate: getTodayInputValue(),
  dueDate: '',
}

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

type ReadOnlyFieldProps = {
  label: string
  value?: string | number | null
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="grid gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-800">{value || '-'}</span>
    </div>
  )
}

export function TasksPage() {
  useDocumentTitle(`Giao việc | ${env.appName}`)

  const { user } = useAuth()
  const [form, setForm] = useState<TaskFormPayload>(initialForm)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formError, setFormError] = useState('')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const tasksQuery = useTasks()
  const periodsQuery = useEvaluationPeriods()
  const templatesQuery = useWorkTemplates()
  const accountsQuery = useUserAccounts()
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  const isSubmitting = createTaskMutation.isPending || updateTaskMutation.isPending
  const canCreateTask = user?.roleCode === 'TP' || user?.roleCode === 'PP'
  const modalTitle = editingTask ? 'Cập nhật công việc' : 'Giao công việc'
  const selectedTemplate = useMemo(
    () => templatesQuery.data?.find((template) => template.id === form.workTemplateId),
    [form.workTemplateId, templatesQuery.data],
  )
  const templateForRequest = selectedTemplate ?? editingTask?.workTemplate
  const activePeriods = useMemo(
    () => periodsQuery.data?.filter((period) => period.status === PeriodStatus.ACTIVE) ?? [],
    [periodsQuery.data],
  )
  const assigneeOptions = useMemo(
    () =>
      accountsQuery.data?.filter((account) => account.role.code.toUpperCase() !== 'ADMIN') ?? [],
    [accountsQuery.data],
  )
  const formApiError = useMemo(() => {
    const error = createTaskMutation.error || updateTaskMutation.error
    return error instanceof Error ? error.message : ''
  }, [createTaskMutation.error, updateTaskMutation.error])
  const deleteError = deleteTaskMutation.error instanceof Error ? deleteTaskMutation.error.message : ''

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
      status:
        editingTask?.status === WorkTaskStatus.IN_PROGRESS ||
        editingTask?.status === WorkTaskStatus.COMPLETED ||
        editingTask?.status === WorkTaskStatus.CANCELLED
          ? editingTask.status
          : WorkTaskStatus.NEW,
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
      setFormError('Vui lòng chọn kỳ, danh mục công việc, người nhận và nhập đầy đủ thông tin bắt buộc.')
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

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Trưởng phòng
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Giao việc</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và theo dõi các công việc đã giao cho nhân sự.
          </p>
        </div>

        {canCreateTask ? (
          <Button type="button" onClick={openCreateModal}>
            Giao công việc
          </Button>
        ) : null}
      </div>

      {!canCreateTask && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Chỉ tài khoản TP hoặc PP được giao công việc.
        </p>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách công việc</h2>
          {tasksQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {tasksQuery.data.length} công việc
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {tasksQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải danh sách công việc...</p>
        ) : tasksQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">
            Không tải được danh sách công việc.
          </p>
        ) : tasksQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Tên công việc</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Người nhận</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Kỳ đánh giá</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Danh mục</th>
                  <th className="min-w-80 px-5 py-3 font-semibold">Mô tả</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Ngày giao</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Hạn hoàn thành</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Tiến độ</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tasksQuery.data.map((task) => (
                  <tr key={task.id} className="bg-white">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-950">
                      {task.title}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {getAssigneeName(task)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {getPeriodName(task)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {getTemplateName(task)}
                    </td>
                    <td className="min-w-80 whitespace-normal px-5 py-4 text-slate-600">
                      {task.description || '-'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(task.assignedDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(task.dueDate ?? task.due)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {task.progressPercent ?? 0}%
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {getTaskStatusLabel(task.status)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(task)}
                          disabled={deleteTaskMutation.isPending}
                          className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-slate-600">Chưa có công việc nào.</p>
        )}
      </Card>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{modalTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Chỉ nhập thông tin giao việc. Dữ liệu chuẩn được lấy từ danh mục công việc.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
              <section className="grid gap-4">
                <h3 className="text-base font-semibold text-slate-950">Thông tin giao việc</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Kỳ đánh giá</span>
                    <select
                      value={form.periodId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, periodId: event.target.value }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="">Chọn kỳ đang hoạt động</option>
                      {activePeriods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Danh mục công việc</span>
                    <select
                      value={form.workTemplateId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          workTemplateId: event.target.value,
                        }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="">Chọn danh mục công việc</option>
                      {templatesQuery.data?.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Người nhận việc</span>
                    <select
                      value={form.assigneeId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, assigneeId: event.target.value }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="">Chọn người nhận</option>
                      {assigneeOptions.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.fullName} - {account.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Tiêu đề</span>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                      placeholder="Nhập tiêu đề công việc"
                    />
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Mô tả</span>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                      placeholder="Nhập yêu cầu chi tiết"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Ngày giao</span>
                    <input
                      type="date"
                      value={form.assignedDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, assignedDate: event.target.value }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Hạn hoàn thành</span>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, dueDate: event.target.value }))
                      }
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-4 border-t border-slate-200 pt-5">
                <h3 className="text-base font-semibold text-slate-950">
                  Thông tin từ danh mục chuẩn
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <ReadOnlyField
                    label="Kết quả mong đợi"
                    value={selectedTemplate?.expectedOutput}
                  />
                  <ReadOnlyField
                    label="Loại công việc"
                    value={getWorkTypeLabel(selectedTemplate?.workType)}
                  />
                  <ReadOnlyField
                    label="Hạn chuẩn"
                    value={selectedTemplate?.standardDeadline}
                  />
                  <ReadOnlyField label="Điểm cơ bản" value={selectedTemplate?.baseScore} />
                  <ReadOnlyField
                    label="Độ khó"
                    value={
                      selectedTemplate ? `${selectedTemplate.difficultyPercent}%` : undefined
                    }
                  />
                  <ReadOnlyField
                    label="Yêu cầu minh chứng"
                    value={selectedTemplate?.evidenceRequirement}
                  />
                </div>
              </section>

              {(formError || formApiError) && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError || formApiError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang giao...' : editingTask ? 'Lưu' : 'Giao công việc'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
