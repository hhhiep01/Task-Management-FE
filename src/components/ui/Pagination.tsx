import { Button } from './Button'

type PaginationProps = {
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (pageNumber: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

export function Pagination({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: PaginationProps) {
  return (
    <nav
      className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Phân trang"
    >
      <p className="text-sm text-[var(--color-text-muted)]" aria-live="polite">
        <span className="font-semibold text-[var(--color-text-strong)]">{totalCount}</span> bản ghi
        {' · '}Trang {pageNumber}/{Math.max(totalPages, 1)}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          Hiển thị
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            disabled={disabled}
            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-2 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || !hasPreviousPage}
          onClick={() => onPageChange(pageNumber - 1)}
        >
          Trước
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || !hasNextPage}
          onClick={() => onPageChange(pageNumber + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  )
}
