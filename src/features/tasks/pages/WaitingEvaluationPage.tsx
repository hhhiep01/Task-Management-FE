import { useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useUserAccounts } from '@/features/accounts/hooks/useUserAccounts'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
import { formatDate } from '@/utils/formatDate'

import { TaskEvaluationAction } from '../components/TaskEvaluationAction'
import { TaskProgress } from '../components/TaskProgress'
import { useWaitingEvaluationTasks } from '../hooks/useTaskEvaluations'
import { getTaskStatusLabel, type Task } from '../types/task.types'
import { getAssigneeName, getDueBadge, getPeriodName, getProgress } from '../utils/taskPresentation'

const filterKeys = ['periodId', 'assigneeId', 'dueDateFrom', 'dueDateTo'] as const
const fieldClassName = 'h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

export function WaitingEvaluationPage() {
  useDocumentTitle(`Công việc chờ đánh giá | ${env.appName}`)
  const listState = usePagedListState(filterKeys)
  const tasksQuery = useWaitingEvaluationTasks(listState.query)
  const periodsQuery = useEvaluationPeriods({ pageNumber: 1, pageSize: 100 })
  const accountsQuery = useUserAccounts({ pageNumber: 1, pageSize: 100 })
  const [successMessage, setSuccessMessage] = useState('')
  const tasks = tasksQuery.data?.items ?? []

  const columns: DataTableColumn<Task>[] = [
    {
      key: 'task',
      header: 'Công việc',
      className: 'min-w-64',
      render: (task) => <div><p className="font-semibold text-[var(--color-text-strong)]">{task.title}</p><p className="mt-1 max-w-72 truncate text-xs text-[var(--color-text-muted)]" title={task.resultDescription ?? undefined}>{task.resultDescription || 'Chưa có mô tả kết quả'}</p></div>,
    },
    { key: 'assignee', header: 'Nhân viên', className: 'whitespace-nowrap', render: getAssigneeName },
    { key: 'period', header: 'Kỳ đánh giá', className: 'whitespace-nowrap', render: getPeriodName },
    { key: 'due', header: 'Hạn hoàn thành', className: 'whitespace-nowrap', render: (task) => { const due = getDueBadge(task); return <div className="grid gap-1"><span>{formatDate(task.dueDate ?? task.due)}</span><Badge variant={due.variant}>{due.label}</Badge></div> } },
    { key: 'progress', header: 'Tiến độ', className: 'min-w-36', render: (task) => <TaskProgress value={getProgress(task)} label="" /> },
    { key: 'status', header: 'Trạng thái', className: 'whitespace-nowrap', render: (task) => <Badge variant="warning">{getTaskStatusLabel(task.status)}</Badge> },
    { key: 'actions', header: 'Thao tác', className: 'whitespace-nowrap text-right', headerClassName: 'text-right', render: (task) => <div className="flex justify-end"><TaskEvaluationAction task={task} onEvaluated={setSuccessMessage} /></div> },
  ]

  return (
    <section className="grid min-w-0 gap-4">
      <PageHeader eyebrow="Quản lý" title="Công việc chờ đánh giá" description="Xem kết quả nhân viên, minh chứng và đưa ra quyết định đánh giá." />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_200px_170px_170px_auto]">
          <FilterField label="Tìm kiếm"><input value={listState.searchInput} onChange={(event) => listState.setSearchInput(event.target.value)} className={fieldClassName} placeholder="Tên công việc hoặc kết quả" /></FilterField>
          <FilterField label="Kỳ đánh giá"><select value={listState.filters.periodId} onChange={(event) => listState.setFilter('periodId', event.target.value)} className={fieldClassName}><option value="">Tất cả</option>{periodsQuery.data?.items.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select></FilterField>
          <FilterField label="Nhân viên"><select value={listState.filters.assigneeId} onChange={(event) => listState.setFilter('assigneeId', event.target.value)} className={fieldClassName}><option value="">Tất cả</option>{accountsQuery.data?.items.map((account) => <option key={account.id} value={account.id}>{account.fullName}</option>)}</select></FilterField>
          <FilterField label="Hạn từ ngày"><input type="date" value={listState.filters.dueDateFrom} onChange={(event) => listState.setFilter('dueDateFrom', event.target.value)} className={fieldClassName} /></FilterField>
          <FilterField label="Hạn đến ngày"><input type="date" value={listState.filters.dueDateTo} onChange={(event) => listState.setFilter('dueDateTo', event.target.value)} className={fieldClassName} /></FilterField>
          {listState.hasActiveFilters ? <div className="flex items-end"><Button variant="secondary" size="sm" className="w-full" onClick={listState.clearFilters}>Xóa bộ lọc</Button></div> : null}
        </div>
      </Card>

      {successMessage ? <p className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-3 py-2 text-sm font-medium text-[var(--color-success)]" role="status">{successMessage}</p> : null}

      <div className="hidden min-w-0 md:block">
        <DataTable title="Danh sách chờ đánh giá" items={tasks} columns={columns} getRowKey={(task) => task.id} countLabel={`${tasksQuery.data?.totalCount ?? 0} công việc`} isLoading={tasksQuery.isLoading} isError={tasksQuery.isError} errorMessage={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Không tải được danh sách.'} emptyMessage={listState.hasActiveFilters ? 'Không có công việc phù hợp với bộ lọc.' : 'Không có công việc nào đang chờ đánh giá.'} minWidthClassName="min-w-[1080px]" />
      </div>

      <div className="grid gap-3 md:hidden">
        {tasksQuery.isLoading ? <StateMessage>Đang tải công việc...</StateMessage> : null}
        {tasksQuery.isError ? <StateMessage tone="danger">{tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Không tải được danh sách.'}</StateMessage> : null}
        {!tasksQuery.isLoading && !tasksQuery.isError && !tasks.length ? <StateMessage>{listState.hasActiveFilters ? 'Không có công việc phù hợp với bộ lọc.' : 'Không có công việc nào đang chờ đánh giá.'}</StateMessage> : null}
        {tasks.map((task) => <WaitingTaskCard key={task.id} task={task} onEvaluated={setSuccessMessage} />)}
      </div>

      {tasksQuery.data ? <Card className="overflow-hidden"><Pagination {...tasksQuery.data} onPageChange={listState.setPageNumber} onPageSizeChange={listState.setPageSize} disabled={tasksQuery.isFetching} /></Card> : null}
    </section>
  )
}

function WaitingTaskCard({ task, onEvaluated }: { task: Task; onEvaluated: (message: string) => void }) {
  const due = getDueBadge(task)
  return (
    <Card className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold text-[var(--color-text-strong)]">{task.title}</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">{getAssigneeName(task)} · {getPeriodName(task)}</p></div><Badge variant={due.variant}>{due.label}</Badge></div>
      <TaskProgress value={getProgress(task)} />
      <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text)]">{task.resultDescription || 'Chưa có mô tả kết quả.'}</p>
      <div className="flex justify-end border-t border-[var(--color-border)] pt-3"><TaskEvaluationAction task={task} onEvaluated={onEvaluated} /></div>
    </Card>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-[var(--color-text)]">{label}</span>{children}</label>
}

function StateMessage({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'danger' }) {
  return <Card className={`p-4 text-sm ${tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>{children}</Card>
}
