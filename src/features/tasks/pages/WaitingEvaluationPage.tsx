import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useUserAccounts } from '@/features/accounts/hooks/useUserAccounts'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'

import { TaskProgress } from '../components/TaskProgress'
import { useWaitingEvaluationTasks } from '../hooks/useTaskEvaluations'
import { getTaskStatusLabel, type Task } from '../types/task.types'
import { getTaskStatusSecondaryText } from '../utils/taskPresentation'
import {
  getAssigneeName,
  getDueBadge,
  getPeriodName,
  getProgress,
} from '../utils/taskPresentation'

const filterKeys = ['periodId', 'assigneeId', 'dueDateFrom', 'dueDateTo'] as const
const fieldClassName =
  'h-10 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

export function WaitingEvaluationPage() {
  useDocumentTitle(`Công việc chờ đánh giá | ${env.appName}`)

  const listState = usePagedListState(filterKeys)
  const tasksQuery = useWaitingEvaluationTasks(listState.query)
  const periodsQuery = useEvaluationPeriods({ pageNumber: 1, pageSize: 100 })
  const accountsQuery = useUserAccounts({ pageNumber: 1, pageSize: 100 })
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')

  const tasks = tasksQuery.data?.items ?? []
  const totalCount = tasksQuery.data?.totalCount ?? 0
  const activeFilterCount = [
    listState.searchInput.trim(),
    ...Object.values(listState.filters),
  ].filter(Boolean).length

  useEffect(() => {
    setFromDateInput(formatDateInput(listState.filters.dueDateFrom))
    setToDateInput(formatDateInput(listState.filters.dueDateTo))
  }, [listState.filters.dueDateFrom, listState.filters.dueDateTo])

  const commitDateFilter = (key: 'dueDateFrom' | 'dueDateTo', value: string) => {
    const normalizedValue = parseVietnameseDate(value)
    if (!value.trim() || normalizedValue) {
      listState.setFilter(key, normalizedValue)
      return
    }

    if (key === 'dueDateFrom') setFromDateInput(formatDateInput(listState.filters.dueDateFrom))
    else setToDateInput(formatDateInput(listState.filters.dueDateTo))
  }

  const columns: DataTableColumn<Task>[] = [
    {
      key: 'task',
      header: 'Công việc',
      className: 'min-w-60',
      render: (task) => (
        <div className="min-w-0">
          <Link
            to={getReviewTaskPath(task)}
            className="block truncate font-semibold text-[var(--color-text-strong)] transition-colors hover:text-[var(--color-primary)]"
            title={task.title}
          >
            {task.title}
          </Link>
          <p
            className="mt-1 max-w-72 truncate text-xs text-[var(--color-text-muted)]"
            title={task.resultDescription ?? undefined}
          >
            {task.resultDescription || 'Chưa có mô tả kết quả'}
          </p>
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Nhân viên',
      className: 'whitespace-nowrap',
      render: (task) => getAssigneeName(task),
    },
    {
      key: 'period',
      header: 'Kỳ đánh giá',
      className: 'whitespace-nowrap',
      render: (task) => getPeriodName(task),
    },
    {
      key: 'due',
      header: 'Hạn hoàn thành',
      className: 'whitespace-nowrap',
      render: (task) => <DueCell task={task} />,
    },
    {
      key: 'progress',
      header: 'Tiến độ',
      className: 'min-w-32',
      render: (task) => <TaskProgress value={getProgress(task)} label="" />,
    },
    {
      key: 'submittedAt',
      header: 'Ngày gửi',
      className: 'whitespace-nowrap text-[var(--color-text-muted)]',
      render: (task) => formatDisplayDate(getTaskSubmittedDate(task)),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (task) => (
        <div className="grid justify-items-start gap-1">
          <Badge variant="warning">{getTaskStatusLabel(task.status)}</Badge>
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
      className: 'whitespace-nowrap text-right',
      render: (task) => <ReviewTaskLink task={task} />,
    },
  ]

  return (
    <section className="grid min-w-0 gap-4">
      <PageHeader
        title="Công việc chờ đánh giá"
        description="Các công việc nhân viên đã gửi và đang chờ xác nhận kết quả."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-warning)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" aria-hidden="true" />
            {totalCount} công việc chờ đánh giá
          </div>
        }
      />

      <Card className="p-3">
        <div className="md:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <SearchInput
              value={listState.searchInput}
              onChange={listState.setSearchInput}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => setIsFilterModalOpen(true)}
            >
              Bộ lọc{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>
        </div>

        <div className="hidden min-w-0 gap-2 md:grid md:grid-cols-[minmax(240px,1fr)_160px_160px_145px_145px_auto] md:items-end">
          <SearchInput value={listState.searchInput} onChange={listState.setSearchInput} />
          <FilterSelect
            label="Kỳ đánh giá"
            value={listState.filters.periodId}
            onChange={(value) => listState.setFilter('periodId', value)}
            options={periodsQuery.data?.items.map((period) => ({ value: period.id, label: period.name })) ?? []}
          />
          <FilterSelect
            label="Nhân viên"
            value={listState.filters.assigneeId}
            onChange={(value) => listState.setFilter('assigneeId', value)}
            options={accountsQuery.data?.items.map((account) => ({ value: account.id, label: account.fullName })) ?? []}
          />
          <DateFilterField
            label="Hạn từ"
            value={fromDateInput}
            onChange={setFromDateInput}
            onCommit={() => commitDateFilter('dueDateFrom', fromDateInput)}
          />
          <DateFilterField
            label="Hạn đến"
            value={toDateInput}
            onChange={setToDateInput}
            onCommit={() => commitDateFilter('dueDateTo', toDateInput)}
          />
          {listState.hasActiveFilters ? (
            <Button type="button" variant="secondary" size="sm" onClick={listState.clearFilters}>
              Xóa lọc
            </Button>
          ) : null}
        </div>

        {activeFilterCount ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Đang áp dụng {activeFilterCount} bộ lọc
          </p>
        ) : null}
      </Card>

      <div className="hidden min-w-0 xl:block">
        <DataTable
          title="Danh sách chờ đánh giá"
          items={tasks}
          columns={columns}
          getRowKey={(task) => task.id}
          countLabel={`${totalCount} công việc`}
          isLoading={tasksQuery.isLoading}
          isError={tasksQuery.isError}
          loadingMessage="Đang tải công việc..."
          errorMessage={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Không tải được danh sách công việc.'}
          emptyContent={<WaitingEmptyState hasFilters={listState.hasActiveFilters} />}
          minWidthClassName="min-w-[980px]"
          rowClassName="transition-colors hover:bg-[var(--color-surface-subtle)]"
          footer={tasksQuery.data && totalCount > 0 ? (
            <Pagination
              {...tasksQuery.data}
              onPageChange={listState.setPageNumber}
              onPageSizeChange={listState.setPageSize}
              disabled={tasksQuery.isFetching}
            />
          ) : undefined}
        />
      </div>

      <div className="grid min-w-0 gap-3 xl:hidden">
        {tasksQuery.isLoading ? <StateMessage>Đang tải công việc...</StateMessage> : null}
        {tasksQuery.isError ? (
          <StateMessage tone="danger">
            {tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Không tải được danh sách công việc.'}
          </StateMessage>
        ) : null}
        {!tasksQuery.isLoading && !tasksQuery.isError && !tasks.length ? (
          <Card className="p-4">
            <WaitingEmptyState hasFilters={listState.hasActiveFilters} />
          </Card>
        ) : null}
        {tasks.length ? (
          <Card className="overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {tasks.map((task) => <WaitingTaskCard key={task.id} task={task} />)}
            </div>
            {tasksQuery.data && totalCount > 0 ? (
            <Pagination
              {...tasksQuery.data}
              onPageChange={listState.setPageNumber}
              onPageSizeChange={listState.setPageSize}
              disabled={tasksQuery.isFetching}
            />
            ) : null}
          </Card>
        ) : null}
      </div>

      <Modal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Bộ lọc công việc"
        description="Lọc danh sách công việc đang chờ đánh giá."
        size="md"
        mobileFullscreen
        footer={
          <div className="flex w-full justify-between gap-2">
            <Button type="button" variant="ghost" onClick={listState.clearFilters}>
              Xóa lọc
            </Button>
            <Button type="button" onClick={() => setIsFilterModalOpen(false)}>
              Xem kết quả
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <FilterSelect
            label="Kỳ đánh giá"
            value={listState.filters.periodId}
            onChange={(value) => listState.setFilter('periodId', value)}
            options={periodsQuery.data?.items.map((period) => ({ value: period.id, label: period.name })) ?? []}
          />
          <FilterSelect
            label="Nhân viên"
            value={listState.filters.assigneeId}
            onChange={(value) => listState.setFilter('assigneeId', value)}
            options={accountsQuery.data?.items.map((account) => ({ value: account.id, label: account.fullName })) ?? []}
          />
          <DateFilterField
            label="Hạn từ"
            value={fromDateInput}
            onChange={setFromDateInput}
            onCommit={() => commitDateFilter('dueDateFrom', fromDateInput)}
          />
          <DateFilterField
            label="Hạn đến"
            value={toDateInput}
            onChange={setToDateInput}
            onCommit={() => commitDateFilter('dueDateTo', toDateInput)}
          />
        </div>
      </Modal>
    </section>
  )
}

function WaitingTaskCard({ task }: { task: Task }) {
  return (
    <article className="grid min-w-0 gap-3 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={getReviewTaskPath(task)}
            className="block break-words font-semibold text-[var(--color-text-strong)] transition-colors hover:text-[var(--color-primary)]"
          >
            {task.title}
          </Link>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {getAssigneeName(task)} <span aria-hidden="true">·</span> {getPeriodName(task)}
          </p>
        </div>
        <Badge variant="warning">Chờ đánh giá</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailValue label="Hạn hoàn thành" value={formatDisplayDate(task.dueDate ?? task.due)} />
        <DetailValue label="Ngày gửi" value={formatDisplayDate(getTaskSubmittedDate(task))} />
      </div>

      <TaskProgress value={getProgress(task)} />
      <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text)]">
        {task.resultDescription || 'Chưa có mô tả kết quả'}
      </p>

      <Link
        to={getReviewTaskPath(task)}
        className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      >
        Xem &amp; đánh giá
      </Link>
    </article>
  )
}

function ReviewTaskLink({ task }: { task: Task }) {
  return (
    <Link
      to={getReviewTaskPath(task)}
      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
    >
      Xem &amp; đánh giá
    </Link>
  )
}

function getReviewTaskPath(task: Task) {
  return `/manager/tasks/${task.id}?from=waiting-evaluation`
}

function DueCell({ task }: { task: Task }) {
  const due = getDueBadge(task)
  return (
    <div className="grid gap-1">
      <span>{formatDisplayDate(task.dueDate ?? task.due)}</span>
      <Badge variant={due.variant}>{formatDueBadgeLabel(due.label)}</Badge>
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative grid min-w-0 gap-1.5">
      <span className="sr-only">Tìm tên công việc hoặc kết quả</span>
      <SearchIcon />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClassName} pl-9`}
        placeholder="Tìm tên công việc hoặc kết quả"
        aria-label="Tìm tên công việc hoặc kết quả"
      />
    </label>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} aria-label={label}>
        <option value="">{label}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function DateFilterField({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onCommit: () => void
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="sr-only">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
        className={fieldClassName}
        placeholder={`${label} dd/MM/yyyy`}
        inputMode="numeric"
        aria-label={`${label}, định dạng ngày dd/MM/yyyy`}
      />
    </label>
  )
}

function WaitingEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-4 py-8 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]" aria-hidden="true">
        <CheckIcon />
      </span>
      <h3 className="mt-4 font-semibold text-[var(--color-text-strong)]">
        {hasFilters ? 'Không có công việc phù hợp' : 'Không có công việc chờ đánh giá'}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        {hasFilters
          ? 'Thử điều chỉnh hoặc xóa bớt bộ lọc để xem thêm công việc.'
          : 'Hiện tại tất cả công việc đã được xử lý hoặc chưa có nhân viên nào gửi kết quả để đánh giá.'}
      </p>
    </div>
  )
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-[var(--color-text-strong)]">{value}</p>
    </div>
  )
}

function StateMessage({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' }) {
  return (
    <Card className={`p-4 text-sm ${tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>
      {children}
    </Card>
  )
}

function formatDateInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function parseVietnameseDate(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return ''
  }

  return `${year}-${month}-${day}`
}

function formatDisplayDate(value?: string | null) {
  return formatDateInput(value) || '-'
}

function getTaskSubmittedDate(task: Task) {
  return task.submittedDate ?? task.submittedAt ?? task.resultSubmittedAt ?? task.modifiedDate
}

function formatDueBadgeLabel(label: string) {
  return label.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$1/$2/$3')
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]">
      <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.75 12.75 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="m5 10.25 3.25 3.25L15 6.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
