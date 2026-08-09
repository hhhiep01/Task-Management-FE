import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { usePagedListState } from '@/hooks/usePagedListState'
import { WorkType, workTypeLabels } from '@/features/work-templates/types/workTemplate.types'

import { useMyTasks } from '../hooks/useTasks'
import { TaskWorkflowActions } from './TaskWorkflowActions'
import { WorkTaskStatus, getTaskStatusLabel, isWorkTaskStatus, type Task } from '../types/task.types'
import {
  getDueBadge,
  getProgress,
  getStatusVariant,
  isRevisionRequired,
} from '../utils/taskPresentation'

function getTaskDetailPath(taskId: string, role?: string) {
  return role === 'employee' ? `/employee/tasks/${taskId}` : `/manager/tasks/${taskId}`
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="grid gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">
        {value}% hoàn thành
      </span>
    </div>
  )
}

const myTaskFilterKeys = ['periodId', 'workType', 'status', 'dueDateFrom', 'dueDateTo'] as const

const statusTabs = [
  { value: '', label: 'Tất cả' },
  { value: WorkTaskStatus.NEW, label: 'Mới' },
  { value: WorkTaskStatus.IN_PROGRESS, label: 'Đang thực hiện' },
  { value: WorkTaskStatus.WAITING_EVALUATION, label: 'Chờ đánh giá' },
  { value: WorkTaskStatus.REVISION_REQUIRED, label: 'Cần chỉnh sửa' },
  { value: WorkTaskStatus.COMPLETED, label: 'Hoàn thành' },
  { value: WorkTaskStatus.CANCELLED, label: 'Đã hủy' },
] as const

export function MyTasksPanel() {
  const listState = usePagedListState(myTaskFilterKeys)
  const activeStatus = isWorkTaskStatus(listState.filters.status) ? listState.filters.status : ''
  const myTasksQuery = useMyTasks({
    ...listState.query,
    status: activeStatus || undefined,
  })
  const periodsQuery = useEvaluationPeriods()
  const { user } = useAuth()
  const navigate = useNavigate()
  const tasks = myTasksQuery.data?.items ?? []
  const reviewCount = tasks.filter((task) => isRevisionRequired(task)).length
  const completedCount = tasks.filter((task) => task.status === WorkTaskStatus.COMPLETED).length

  const columns: DataTableColumn<Task>[] = [
    {
      key: 'task',
      header: 'Công việc',
      className: 'min-w-72',
      render: (task) => (
        <div>
          <p className="font-semibold text-[var(--color-text-strong)]">{task.title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {task.workTemplate?.name ?? task.workTemplateName ?? 'Không có danh mục'}
          </p>
        </div>
      ),
    },
    {
      key: 'assigner',
      header: 'Người giao',
      className: 'whitespace-nowrap text-[var(--color-text)]',
      render: (task) => task.assigner?.fullName ?? '-',
    },
    {
      key: 'period',
      header: 'Kỳ đánh giá',
      className: 'whitespace-nowrap text-[var(--color-text-muted)]',
      render: (task) => task.period?.name ?? task.periodName ?? '-',
    },
    {
      key: 'due',
      header: 'Hạn xử lý',
      className: 'whitespace-nowrap',
      render: (task) => {
        const dueBadge = getDueBadge(task)
        return <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
      },
    },
    {
      key: 'progress',
      header: 'Tiến độ',
      render: (task) => <ProgressBar value={getProgress(task)} />,
    },
    {
      key: 'status',
      header: 'Trạng thái hiện tại',
      className: 'whitespace-nowrap',
      render: (task) => (
        <div className="grid justify-items-start gap-1.5">
          <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
          {isRevisionRequired(task) ? (
            <span className="text-xs font-medium text-[var(--color-warning)]">
              Cần xem lại kết quả
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right',
      render: (task) => (
        <div className="flex flex-wrap justify-end gap-2">
          <TaskWorkflowActions task={task} compact />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(getTaskDetailPath(task.id, user?.role))}
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <EvaluationMetric label="Tổng công việc" value={myTasksQuery.data?.totalCount ?? 0} />
        <EvaluationMetric label="Hoàn thành trên trang" value={completedCount} tone="success" />
        <EvaluationMetric
          label="Cần xem lại"
          value={reviewCount}
          tone={reviewCount ? 'warning' : 'neutral'}
        />
      </div>

      <Card variant="flat" className="mt-6 overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 pt-3">
          <div
            role="tablist"
            aria-label="Lọc công việc theo trạng thái"
            className="flex flex-wrap gap-x-1 gap-y-2"
          >
            {statusTabs.map((tab) => {
              const isActive = activeStatus === tab.value
              return (
                <button
                  key={tab.value || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => listState.setFilter('status', tab.value)}
                  className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <FilterInput label="Tìm kiếm" value={listState.searchInput} onChange={listState.setSearchInput} placeholder="Tên hoặc mô tả công việc" />
          <FilterSelect label="Kỳ đánh giá" value={listState.filters.periodId} onChange={(value) => listState.setFilter('periodId', value)} options={periodsQuery.data?.items.map((period) => ({ value: period.id, label: period.name })) ?? []} />
          <FilterSelect label="Loại công việc" value={listState.filters.workType} onChange={(value) => listState.setFilter('workType', value)} options={Object.values(WorkType).map((value) => ({ value, label: workTypeLabels[value] }))} />
          <FilterInput label="Hạn từ ngày" type="date" value={listState.filters.dueDateFrom} onChange={(value) => listState.setFilter('dueDateFrom', value)} />
          <FilterInput label="Hạn đến ngày" type="date" value={listState.filters.dueDateTo} onChange={(value) => listState.setFilter('dueDateTo', value)} />
          {listState.hasActiveFilters ? <Button variant="secondary" className="self-end" onClick={listState.clearFilters}>Xóa bộ lọc</Button> : null}
        </div>
      </Card>

      <div className="mt-6 hidden md:block">
        <DataTable
          title="Kết quả và trạng thái công việc"
          items={tasks}
          columns={columns}
          getRowKey={(task) => task.id}
          countLabel={myTasksQuery.data ? `${myTasksQuery.data.totalCount} công việc` : undefined}
          isLoading={myTasksQuery.isLoading}
          isError={myTasksQuery.isError}
          loadingMessage="Đang tải kết quả công việc..."
          errorMessage={
            myTasksQuery.error instanceof Error
              ? myTasksQuery.error.message
              : 'Không tải được danh sách công việc.'
          }
          emptyMessage="Chưa có công việc để đánh giá."
          minWidthClassName="min-w-[1120px]"
        />
      </div>

      <div className="mt-6 grid gap-3 md:hidden">
        {myTasksQuery.isLoading ? (
          <Card className="px-5 py-6 text-sm text-[var(--color-text-muted)]">
            Đang tải kết quả công việc...
          </Card>
        ) : myTasksQuery.isError ? (
          <Card className="border-[var(--color-danger)] px-5 py-6 text-sm text-[var(--color-danger)]">
            {myTasksQuery.error instanceof Error
              ? myTasksQuery.error.message
              : 'Không tải được danh sách công việc.'}
          </Card>
        ) : tasks.length ? (
          tasks.map((task) => (
            <MobileTaskCard
              key={task.id}
              task={task}
              detailPath={getTaskDetailPath(task.id, user?.role)}
            />
          ))
        ) : (
          <Card className="px-5 py-8 text-sm text-[var(--color-text-muted)]">
            Chưa có công việc để đánh giá.
          </Card>
        )}
      </div>

      {myTasksQuery.data ? (
        <Card className="mt-3 overflow-hidden">
          <Pagination {...myTasksQuery.data} onPageChange={listState.setPageNumber} onPageSizeChange={listState.setPageSize} disabled={myTasksQuery.isFetching} />
        </Card>
      ) : null}
    </>
  )
}

function FilterInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-[var(--color-text)]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]" /></label>
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-[var(--color-text)]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"><option value="">Tất cả</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function EvaluationMetric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'success' | 'warning'
}) {
  const valueClass =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'warning'
        ? 'text-[var(--color-warning)]'
        : 'text-[var(--color-text-strong)]'

  return (
    <Card variant="flat" className="p-4">
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </Card>
  )
}

function MobileTaskCard({ task, detailPath }: { task: Task; detailPath: string }) {
  const dueBadge = getDueBadge(task)
  const navigate = useNavigate()

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--color-text-strong)]">{task.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {task.workTemplate?.name ?? task.workTemplateName ?? 'Không có danh mục'}
          </p>
        </div>
        <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
      </div>
      {isRevisionRequired(task) ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-medium text-[var(--color-warning)]">
          Cần xem lại kết quả theo phản hồi hiện có.
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailItem label="Người giao" value={task.assigner?.fullName} />
        <DetailItem label="Kỳ đánh giá" value={task.period?.name ?? task.periodName} />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
            {getProgress(task)}%
          </span>
        </div>
        <ProgressBar value={getProgress(task)} />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => navigate(detailPath)}
      >
        Xem chi tiết
      </Button>
      <TaskWorkflowActions task={task} compact />
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text-strong)]">{value || '-'}</p>
    </div>
  )
}
