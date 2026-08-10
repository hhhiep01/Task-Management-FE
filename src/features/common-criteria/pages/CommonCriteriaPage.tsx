import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'

import {
  useCommonCriteria,
  useCreateCommonCriterion,
  useDeleteCommonCriterion,
  useUpdateCommonCriterion,
} from '../hooks/useCommonCriteria'
import {
  CriterionType,
  criterionTypeLabels,
  getCriterionTypeLabel,
} from '../types/commonCriterion.types'
import type { CommonCriterion, CommonCriterionPayload } from '../types/commonCriterion.types'

const initialForm: CommonCriterionPayload = {
  organizationId: '',
  parentId: null,
  code: '',
  content: '',
  maxScore: 0,
  criterionType: CriterionType.GROUP,
  sortOrder: 0,
  isActive: true,
}

const filterKeys = ['organizationId', 'parentId', 'criterionType', 'isActive'] as const

const fieldClassName =
  'h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]'

const textAreaClassName =
  'min-h-28 w-full min-w-0 resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm leading-6 text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

type FormFieldErrors = Partial<Record<'organizationId' | 'code' | 'content' | 'maxScore', string>>

function getFormFieldErrors(payload: CommonCriterionPayload): FormFieldErrors {
  const errors: FormFieldErrors = {}

  if (!payload.organizationId) errors.organizationId = 'Vui lòng chọn đơn vị.'
  if (!payload.code.trim()) errors.code = 'Mã tiêu chí không được để trống.'
  if (!payload.content.trim()) errors.content = 'Nội dung tiêu chí không được để trống.'

  if (payload.criterionType === CriterionType.ITEM && payload.maxScore <= 0) {
    errors.maxScore = 'Điểm tối đa phải lớn hơn 0 đối với tiêu chí chấm điểm.'
  }

  if (payload.criterionType === CriterionType.GROUP && payload.maxScore < 0) {
    errors.maxScore = 'Điểm tối đa không được nhỏ hơn 0.'
  }

  return errors
}

function formatScore(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function getCriterionTypeVariant(criterionType: CriterionType) {
  return criterionType === CriterionType.GROUP ? ('primary' as const) : ('info' as const)
}

function getStatusVariant(isActive: boolean) {
  return isActive ? ('success' as const) : ('neutral' as const)
}

function sortCriteria(criteria: CommonCriterion[]) {
  return [...criteria].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.code.localeCompare(right.code, 'vi-VN'),
  )
}

export function CommonCriteriaPage() {
  useDocumentTitle(`Tiêu chí chung | ${env.appName}`)

  const { user } = useAuth()
  const [form, setForm] = useState<CommonCriterionPayload>(initialForm)
  const [editingCriterion, setEditingCriterion] = useState<CommonCriterion | null>(null)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const listState = usePagedListState(filterKeys)
  const criteriaQuery = useCommonCriteria({
    ...listState.query,
    isActive: listState.filters.isActive
      ? listState.filters.isActive === 'true'
      : undefined,
  })
  const organizationsQuery = useOrganizations()
  const parentCriteriaQuery = useCommonCriteria(
    {
      organizationId: form.organizationId || undefined,
      criterionType: CriterionType.GROUP,
      pageNumber: 1,
      pageSize: 100,
    },
    Boolean(form.organizationId),
  )
  const filterParentsQuery = useCommonCriteria(
    {
      organizationId: listState.filters.organizationId || undefined,
      criterionType: CriterionType.GROUP,
      pageNumber: 1,
      pageSize: 100,
    },
    Boolean(listState.filters.organizationId),
  )
  const createCriterionMutation = useCreateCommonCriterion()
  const updateCriterionMutation = useUpdateCommonCriterion()
  const deleteCriterionMutation = useDeleteCommonCriterion()

  const canManage = user?.roleCode === 'ADMIN' || user?.roleCode === 'TP'
  const criteria = useMemo(() => sortCriteria(criteriaQuery.data?.items ?? []), [criteriaQuery.data])
  const parentOptions = useMemo(
    () =>
      sortCriteria(parentCriteriaQuery.data?.items ?? []).filter(
        (criterion) => criterion.id !== editingCriterion?.id,
      ),
    [editingCriterion?.id, parentCriteriaQuery.data],
  )
  const filterParentOptions = useMemo(
    () => sortCriteria(filterParentsQuery.data?.items ?? []),
    [filterParentsQuery.data],
  )
  const isSubmitting = createCriterionMutation.isPending || updateCriterionMutation.isPending
  const modalTitle = editingCriterion ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí'
  const fieldErrors = showFieldErrors ? getFormFieldErrors(form) : {}
  const formApiError = useMemo(() => {
    const error = createCriterionMutation.error || updateCriterionMutation.error
    return error instanceof Error ? error.message : ''
  }, [createCriterionMutation.error, updateCriterionMutation.error])
  const deleteError =
    deleteCriterionMutation.error instanceof Error ? deleteCriterionMutation.error.message : ''
  const secondaryFilterCount = filterKeys.reduce(
    (count, key) => count + (listState.filters[key] ? 1 : 0),
    0,
  )

  const resetMutations = () => {
    createCriterionMutation.reset()
    updateCriterionMutation.reset()
  }

  const closeModal = () => {
    setForm(initialForm)
    setEditingCriterion(null)
    setShowFieldErrors(false)
    resetMutations()
    setIsCriterionModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingCriterion(null)
    setShowFieldErrors(false)
    resetMutations()
    setIsCriterionModalOpen(true)
  }

  const openEditModal = (criterion: CommonCriterion) => {
    setEditingCriterion(criterion)
    setForm({
      organizationId: criterion.organizationId,
      parentId: criterion.parentId,
      code: criterion.code,
      content: criterion.content,
      maxScore: criterion.maxScore,
      criterionType: criterion.criterionType,
      sortOrder: criterion.sortOrder,
      isActive: criterion.isActive,
    })
    setShowFieldErrors(false)
    resetMutations()
    setIsCriterionModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const payload: CommonCriterionPayload = {
      organizationId: form.organizationId,
      parentId: form.parentId || null,
      code: form.code.trim(),
      content: form.content.trim(),
      maxScore: Number(form.maxScore),
      criterionType: form.criterionType,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    }
    const errors = getFormFieldErrors(payload)

    setShowFieldErrors(true)
    if (Object.keys(errors).length) return

    try {
      if (editingCriterion) {
        await updateCriterionMutation.mutateAsync({
          criterionId: editingCriterion.id,
          payload,
        })
        setStatusMessage('Đã lưu thay đổi tiêu chí.')
      } else {
        await createCriterionMutation.mutateAsync(payload)
        setStatusMessage('Đã thêm tiêu chí.')
      }
      closeModal()
    } catch {
      // The API error is shown inside the modal.
    }
  }

  const handleDelete = async (criterion: CommonCriterion) => {
    const confirmed = window.confirm(`Xóa tiêu chí "${criterion.code}"?`)
    if (!confirmed) return

    try {
      await deleteCriterionMutation.mutateAsync(criterion.id)
      setStatusMessage('Đã cập nhật danh sách tiêu chí.')
    } catch {
      // The API error is shown near the list.
    }
  }

  const handleOrganizationFilterChange = (organizationId: string) => {
    listState.setFilters({ organizationId, parentId: '' })
  }

  const columns: DataTableColumn<CommonCriterion>[] = [
    {
      key: 'code',
      header: 'Mã',
      className: 'w-24 whitespace-nowrap font-semibold tabular-nums text-[var(--color-text-strong)]',
      render: (criterion) => (
        <span className={criterion.criterionType === CriterionType.ITEM ? 'inline-block pl-5' : ''}>
          {criterion.code}
        </span>
      ),
    },
    {
      key: 'content',
      header: 'Nội dung tiêu chí',
      className: 'min-w-80 max-w-xl',
      render: (criterion) => (
        <div className={criterion.criterionType === CriterionType.ITEM ? 'border-l border-[var(--color-border)] pl-3' : ''}>
          <p className={criterion.criterionType === CriterionType.GROUP ? 'line-clamp-2 font-semibold leading-5 text-[var(--color-text-strong)]' : 'line-clamp-2 leading-5 text-[var(--color-text)]'} title={criterion.content}>
            {criterion.content}
          </p>
          {criterion.criterionType === CriterionType.GROUP ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Tổng điểm nhóm</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      className: 'whitespace-nowrap',
      render: (criterion) => (
        <Badge variant={getCriterionTypeVariant(criterion.criterionType)}>
          {getCriterionTypeLabel(criterion.criterionType)}
        </Badge>
      ),
    },
    {
      key: 'maxScore',
      header: 'Điểm tối đa',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right font-medium tabular-nums text-[var(--color-text)]',
      render: (criterion) => formatScore(criterion.maxScore),
    },
    {
      key: 'sortOrder',
      header: 'Thứ tự',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right font-medium tabular-nums text-[var(--color-text-muted)]',
      render: (criterion) => criterion.sortOrder,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (criterion) => (
        <Badge variant={getStatusVariant(criterion.isActive)}>
          {criterion.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap',
      render: (criterion) =>
        canManage ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => openEditModal(criterion)}>
              Sửa
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(criterion)} disabled={deleteCriterionMutation.isPending}>
              Xóa
            </Button>
          </div>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">Chỉ xem</span>
        ),
    },
  ]

  return (
    <section className="grid w-full min-w-0 max-w-full gap-6">
      <PageHeader
        eyebrow="Cấu hình"
        title="Tiêu chí chung"
        description="Quản lý bộ tiêu chí chung dùng cho quá trình tự đánh giá và xếp loại."
        actions={
          canManage ? (
            <div className="hidden md:block">
              <Button type="button" onClick={openCreateModal}>+ Thêm tiêu chí</Button>
            </div>
          ) : null
        }
      />

      <Card variant="flat" className="w-full min-w-0 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(280px,2fr)_auto] md:items-end">
          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Tìm kiếm</span>
            <input
              type="search"
              value={listState.searchInput}
              onChange={(event) => listState.setSearchInput(event.target.value)}
              className={fieldClassName}
              placeholder="Tìm theo mã hoặc nội dung tiêu chí..."
            />
          </label>

          <div className="flex items-center justify-between gap-2 md:hidden">
            <Button type="button" variant="secondary" className="flex-1" aria-expanded={isMobileFiltersOpen} aria-controls="common-criterion-filters" onClick={() => setIsMobileFiltersOpen((current) => !current)}>
              Bộ lọc{secondaryFilterCount ? ` (${secondaryFilterCount})` : ''}
            </Button>
            {canManage ? <Button type="button" className="flex-1" onClick={openCreateModal}>+ Thêm</Button> : null}
          </div>
        </div>

        <div
          id="common-criterion-filters"
          className={(isMobileFiltersOpen ? 'grid' : 'hidden') + ' mt-4 min-w-0 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(150px,1fr))_auto] xl:items-end'}
        >
          <FilterSelect
            label="Đơn vị"
            value={listState.filters.organizationId}
            onChange={handleOrganizationFilterChange}
            options={organizationsQuery.data?.items.map((organization) => ({ value: organization.id, label: organization.name })) ?? []}
            emptyLabel="Tất cả đơn vị"
          />
          <FilterSelect
            label="Loại tiêu chí"
            value={listState.filters.criterionType}
            onChange={(value) => listState.setFilter('criterionType', value)}
            options={Object.values(CriterionType).map((value) => ({ value, label: criterionTypeLabels[value] }))}
          />
          <FilterSelect
            label="Tiêu chí cha"
            value={listState.filters.parentId}
            onChange={(value) => listState.setFilter('parentId', value)}
            options={filterParentOptions.map((criterion) => ({ value: criterion.id, label: `${criterion.code} - ${criterion.content}` }))}
            emptyLabel={listState.filters.organizationId ? 'Tất cả' : 'Chọn đơn vị trước'}
            disabled={!listState.filters.organizationId}
          />
          <FilterSelect
            label="Trạng thái"
            value={listState.filters.isActive}
            onChange={(value) => listState.setFilter('isActive', value)}
            options={[{ value: 'true', label: 'Đang hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]}
          />
          {listState.hasActiveFilters ? <Button type="button" variant="link" size="sm" onClick={listState.clearFilters}>Xóa bộ lọc</Button> : null}
        </div>
      </Card>

      {statusMessage ? <p role="status" className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-4 py-3 text-sm font-medium text-[var(--color-success)]">{statusMessage}</p> : null}
      {deleteError ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">{deleteError}</p> : null}

      {criteriaQuery.isLoading ? (
        <CriteriaLoadingState />
      ) : criteriaQuery.isError ? (
        <CriteriaState
          title="Không thể tải danh sách tiêu chí"
          description="Đã xảy ra lỗi khi tải dữ liệu."
          action={<Button type="button" variant="secondary" onClick={() => void criteriaQuery.refetch()} disabled={criteriaQuery.isFetching}>{criteriaQuery.isFetching ? 'Đang tải...' : 'Thử lại'}</Button>}
        />
      ) : criteria.length ? (
        <>
          <div className={'hidden min-w-0 max-w-full transition-opacity lg:block ' + (criteriaQuery.isFetching ? 'opacity-70' : '')} aria-busy={criteriaQuery.isFetching}>
            <DataTable
              title="Danh sách tiêu chí chung"
              items={criteria}
              columns={columns}
              getRowKey={(criterion) => criterion.id}
              countLabel={`${criteriaQuery.data?.totalCount ?? 0} tiêu chí`}
              minWidthClassName="min-w-[960px]"
              rowClassName={(criterion) => criterion.criterionType === CriterionType.GROUP ? 'bg-[var(--color-surface-subtle)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)]' : 'transition-colors duration-150 hover:bg-[var(--color-surface-subtle)]'}
            />
          </div>

          <div className={'grid min-w-0 gap-3 lg:hidden ' + (criteriaQuery.isFetching ? 'opacity-70' : '')} aria-busy={criteriaQuery.isFetching}>
            {criteria.map((criterion) => (
              <CommonCriterionMobileCard key={criterion.id} criterion={criterion} canManage={canManage} onEdit={openEditModal} onDelete={handleDelete} isDeleting={deleteCriterionMutation.isPending} />
            ))}
          </div>

          {criteriaQuery.data ? (
            <Card className="overflow-hidden">
              <Pagination {...criteriaQuery.data} onPageChange={listState.setPageNumber} onPageSizeChange={listState.setPageSize} disabled={criteriaQuery.isFetching} />
            </Card>
          ) : null}
        </>
      ) : listState.hasActiveFilters ? (
        <CriteriaState
          title="Không tìm thấy tiêu chí phù hợp"
          description="Thử thay đổi từ khóa hoặc bộ lọc."
          action={<Button type="button" variant="secondary" onClick={listState.clearFilters}>Xóa bộ lọc</Button>}
        />
      ) : (
        <CriteriaState
          title="Chưa có tiêu chí chung"
          description="Hãy tạo bộ tiêu chí đầu tiên cho đơn vị."
          action={canManage ? <Button type="button" onClick={openCreateModal}>+ Thêm tiêu chí</Button> : null}
        />
      )}

      {canManage ? (
        <Modal
          open={isCriterionModalOpen}
          onClose={closeModal}
          title={modalTitle}
          description="Thiết lập nhóm tiêu chí và tiêu chí chấm điểm dùng trong quá trình tự đánh giá."
          size="xl"
          mobileFullscreen
          footer={
            <>
              <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>Hủy</Button>
              <Button type="submit" form="common-criterion-form" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : editingCriterion ? 'Lưu thay đổi' : 'Thêm tiêu chí'}</Button>
            </>
          }
        >
          <form id="common-criterion-form" className="mx-auto grid w-full max-w-4xl gap-5" onSubmit={handleSubmit} noValidate>
            <FormSection title="Thông tin tiêu chí">
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <FormField id="criterion-organization" label="Đơn vị" required error={fieldErrors.organizationId}>
                  <select
                    id="criterion-organization"
                    value={form.organizationId}
                    onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value, parentId: event.target.value === current.organizationId ? current.parentId : null }))}
                    className={fieldClassName}
                    aria-invalid={Boolean(fieldErrors.organizationId)}
                    aria-describedby={fieldErrors.organizationId ? 'criterion-organization-error' : undefined}
                  >
                    <option value="">Chọn đơn vị</option>
                    {organizationsQuery.data?.items.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                  </select>
                </FormField>
                <FormField id="criterion-type" label="Loại tiêu chí" required>
                  <select id="criterion-type" value={form.criterionType} onChange={(event) => setForm((current) => ({ ...current, criterionType: event.target.value === CriterionType.ITEM ? CriterionType.ITEM : CriterionType.GROUP }))} className={fieldClassName}>
                    <option value={CriterionType.GROUP}>{criterionTypeLabels[CriterionType.GROUP]}</option>
                    <option value={CriterionType.ITEM}>{criterionTypeLabels[CriterionType.ITEM]}</option>
                  </select>
                </FormField>
                <FormField id="criterion-code" label="Mã tiêu chí" required error={fieldErrors.code}>
                  <input id="criterion-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} className={fieldClassName} placeholder="Ví dụ: 1.1" aria-invalid={Boolean(fieldErrors.code)} aria-describedby={fieldErrors.code ? 'criterion-code-error' : undefined} />
                </FormField>
                <FormField id="criterion-sort-order" label="Thứ tự hiển thị">
                  <input id="criterion-sort-order" type="number" min={0} step={1} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className={fieldClassName} />
                </FormField>
                <FormField id="criterion-content" label="Nội dung tiêu chí" required error={fieldErrors.content} className="md:col-span-2">
                  <textarea id="criterion-content" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} className={textAreaClassName} placeholder="Nhập nội dung tiêu chí" aria-invalid={Boolean(fieldErrors.content)} aria-describedby={fieldErrors.content ? 'criterion-content-error' : undefined} />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Cấu trúc">
              <FormField id="criterion-parent" label="Tiêu chí cha" helper={form.criterionType === CriterionType.GROUP ? 'Nhóm dùng để gom các tiêu chí con và hiển thị tổng điểm.' : 'Tiêu chí chấm điểm sẽ được sử dụng trong phần tự đánh giá của nhân viên.'}>
                <select id="criterion-parent" value={form.parentId ?? ''} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value || null }))} className={fieldClassName} disabled={!form.organizationId}>
                  <option value="">{form.organizationId ? 'Không chọn tiêu chí cha' : 'Chọn đơn vị trước'}</option>
                  {parentOptions.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.code} - {criterion.content}</option>)}
                </select>
              </FormField>
              {parentCriteriaQuery.isError ? <p className="text-xs font-medium text-[var(--color-warning)]">Không tải được danh sách tiêu chí cha.</p> : null}
            </FormSection>

            <FormSection title="Thiết lập điểm">
              <FormField id="criterion-max-score" label="Điểm tối đa" required error={fieldErrors.maxScore} helper={form.criterionType === CriterionType.GROUP ? 'Điểm nhóm có thể bằng 0 hoặc là tổng điểm các tiêu chí con.' : 'Điểm tối đa phải lớn hơn 0 đối với tiêu chí chấm điểm.'}>
                <input id="criterion-max-score" type="number" min={form.criterionType === CriterionType.ITEM ? 0.01 : 0} step="any" value={form.maxScore} onChange={(event) => setForm((current) => ({ ...current, maxScore: Number(event.target.value) }))} className={fieldClassName} aria-invalid={Boolean(fieldErrors.maxScore)} aria-describedby={fieldErrors.maxScore ? 'criterion-max-score-error' : undefined} />
              </FormField>
            </FormSection>

            <FormSection title="Trạng thái">
              <label htmlFor="criterion-is-active" className="flex min-w-0 items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
                <input id="criterion-is-active" type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border-strong)] accent-[var(--color-primary)]" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--color-text-strong)]">Đang hoạt động</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">Tiêu chí đang hoạt động có thể được sử dụng trong quá trình đánh giá.</span>
                </span>
              </label>
            </FormSection>

            {organizationsQuery.isError ? <p className="rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm text-[var(--color-warning)]">Không tải được danh sách đơn vị.</p> : null}
            {formApiError ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{formApiError}</p> : null}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}

function FilterSelect({ label, value, onChange, options, emptyLabel = 'Tất cả', disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; emptyLabel?: string; disabled?: boolean }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName + (value ? ' border-[var(--color-primary)] bg-[var(--color-primary-subtle)]' : '')} disabled={disabled}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function FormField({ id, label, children, required = false, helper, error, className = '' }: { id: string; label: string; children: ReactNode; required?: boolean; helper?: string; error?: string; className?: string }) {
  return (
    <div className={`grid min-w-0 content-start gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
        {label}
        {required ? <><span aria-hidden="true" className="text-[var(--color-danger)]"> *</span><span className="sr-only"> (bắt buộc)</span></> : null}
      </label>
      {children}
      {helper ? <p className="text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p> : null}
      {error ? <p id={`${id}-error`} className="text-xs font-medium text-[var(--color-danger)]">{error}</p> : null}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="grid min-w-0 gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"><h3 className="text-sm font-semibold text-[var(--color-text-strong)]">{title}</h3>{children}</section>
}

function CommonCriterionMobileCard({ criterion, canManage, onEdit, onDelete, isDeleting }: { criterion: CommonCriterion; canManage: boolean; onEdit: (criterion: CommonCriterion) => void; onDelete: (criterion: CommonCriterion) => Promise<void>; isDeleting: boolean }) {
  const isGroup = criterion.criterionType === CriterionType.GROUP
  return (
    <Card className={`${isGroup ? 'bg-[var(--color-surface-subtle)]' : ''} grid min-w-0 gap-4 p-4`}>
      <div className={isGroup ? 'min-w-0' : 'min-w-0 border-l border-[var(--color-border)] pl-3'}>
        <p className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">{criterion.code}</p>
        <h2 className={`${isGroup ? 'font-semibold text-[var(--color-text-strong)]' : 'font-medium text-[var(--color-text)]'} mt-1 line-clamp-3 leading-5`} title={criterion.content}>{criterion.content}</h2>
      </div>
      <div className="flex flex-wrap gap-2"><Badge variant={getCriterionTypeVariant(criterion.criterionType)}>{getCriterionTypeLabel(criterion.criterionType)}</Badge><Badge variant={getStatusVariant(criterion.isActive)}>{criterion.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Badge></div>
      <dl className="grid min-w-0 grid-cols-2 gap-3 border-y border-[var(--color-border)] py-3 text-sm">
        {criterion.parentCode ? <div className="col-span-2 min-w-0"><dt className="text-xs text-[var(--color-text-muted)]">Nhóm cha</dt><dd className="mt-1 truncate font-medium text-[var(--color-text)]" title={criterion.parentCode}>{criterion.parentCode}</dd></div> : null}
        <div><dt className="text-xs text-[var(--color-text-muted)]">{isGroup ? 'Điểm nhóm' : 'Điểm tối đa'}</dt><dd className="mt-1 font-semibold tabular-nums text-[var(--color-text-strong)]">{formatScore(criterion.maxScore)}</dd></div>
        <div><dt className="text-xs text-[var(--color-text-muted)]">Thứ tự</dt><dd className="mt-1 font-semibold tabular-nums text-[var(--color-text-strong)]">{criterion.sortOrder}</dd></div>
      </dl>
      {canManage ? <div className="flex justify-end gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => onEdit(criterion)}>Sửa</Button><Button type="button" variant="danger" size="sm" onClick={() => void onDelete(criterion)} disabled={isDeleting}>Xóa</Button></div> : <p className="text-xs text-[var(--color-text-muted)]">Bạn có quyền xem danh sách tiêu chí.</p>}
    </Card>
  )
}

function CriteriaState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <Card className="grid min-h-56 place-items-center px-5 py-10 text-center"><div className="max-w-md"><h2 className="text-lg font-semibold text-[var(--color-text-strong)]">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</div></Card>
}

function CriteriaLoadingState() {
  return (
    <div aria-busy="true" aria-label="Đang tải danh sách tiêu chí chung">
      <span className="sr-only">Đang tải danh sách tiêu chí chung...</span>
      <Card className="hidden overflow-hidden lg:block">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3"><SkeletonBar className="h-5 w-48" /><SkeletonBar className="h-4 w-24" /></div>
        <div className="grid grid-cols-[0.5fr_2.8fr_1.1fr_repeat(3,0.7fr)_1fr] gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">{Array.from({ length: 7 }).map((_, index) => <SkeletonBar key={index} className="h-3 w-full" />)}</div>
        {Array.from({ length: 5 }).map((_, rowIndex) => <div key={rowIndex} className="grid grid-cols-[0.5fr_2.8fr_1.1fr_repeat(3,0.7fr)_1fr] gap-4 border-b border-[var(--color-border)] px-4 py-4 last:border-b-0">{Array.from({ length: 7 }).map((_, cellIndex) => <SkeletonBar key={cellIndex} className={cellIndex === 1 ? 'h-8 w-full' : 'h-5 w-full'} />)}</div>)}
      </Card>
      <div className="grid gap-3 lg:hidden">{Array.from({ length: 3 }).map((_, index) => <Card key={index} className="grid gap-4 p-4"><SkeletonBar className="h-4 w-16" /><SkeletonBar className="h-10 w-full" /><div className="flex gap-2"><SkeletonBar className="h-6 w-28 rounded-full" /><SkeletonBar className="h-6 w-28 rounded-full" /></div><SkeletonBar className="h-14 w-full" /></Card>)}</div>
    </div>
  )
}

function SkeletonBar({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] ${className}`} />
}
