import type { ReactNode } from 'react'

import { Card } from './Card'

type DataTableColumn<TItem> = {
  key: string
  header: ReactNode
  render: (item: TItem) => ReactNode
  className?: string
  headerClassName?: string
}

type DataTableProps<TItem> = {
  title: ReactNode
  items?: TItem[]
  columns: DataTableColumn<TItem>[]
  getRowKey: (item: TItem) => string
  countLabel?: ReactNode
  isLoading?: boolean
  isError?: boolean
  loadingMessage?: ReactNode
  errorMessage?: ReactNode
  emptyMessage?: ReactNode
  minWidthClassName?: string
  toolbar?: ReactNode
}

export function DataTable<TItem>({
  title,
  items = [],
  columns,
  getRowKey,
  countLabel,
  isLoading = false,
  isError = false,
  loadingMessage = 'Đang tải dữ liệu...',
  errorMessage = 'Không tải được dữ liệu.',
  emptyMessage = 'Chưa có dữ liệu.',
  minWidthClassName = 'min-w-[720px]',
  toolbar,
}: DataTableProps<TItem>) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">{title}</h2>
          {countLabel ? (
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              {countLabel}
            </p>
          ) : null}
        </div>
        {toolbar ? <div className="flex flex-wrap gap-2">{toolbar}</div> : null}
      </div>

      {isLoading ? (
        <p className="px-5 py-6 text-sm text-[var(--color-text-muted)]">{loadingMessage}</p>
      ) : isError ? (
        <p className="px-5 py-6 text-sm text-[var(--color-danger)]">{errorMessage}</p>
      ) : items.length ? (
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm ${minWidthClassName}`}>
            <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-5 py-3 font-semibold ${column.headerClassName ?? ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {items.map((item) => (
                <tr key={getRowKey(item)} className="bg-[var(--color-surface)]">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-5 py-4 ${column.className ?? ''}`}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-8 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      )}
    </Card>
  )
}

export type { DataTableColumn }
